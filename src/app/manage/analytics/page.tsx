import AdminNavigation from "@/components/AdminNavigation";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { BarChart2, Award, Users, TrendingUp, Clock, CheckCircle2, AlertTriangle } from "lucide-react";

export default async function AnalyticsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return redirect("/login");

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (profile?.role !== 'admin') return redirect("/dashboard");

  // Fetch all quiz submissions with full details
  const { data: allSubmissions } = await supabase
    .from('quiz_submissions')
    .select(`
      id, status, score, mcq_score, final_score, timed_out, submitted_at,
      profiles ( id, full_name, avatar_url ),
      quizzes ( id, title, time_limit_minutes,
        quiz_questions ( id, points )
      )
    `)
    .in('status', ['submitted', 'graded'])
    .order('submitted_at', { ascending: false });

  // Aggregate per-quiz stats
  const quizMap: Record<string, {
    title: string; total: number; graded: number; timedOut: number;
    scores: number[]; totalPoints: number;
  }> = {};

  for (const sub of allSubmissions || []) {
    const quiz = sub.quizzes as any;
    if (!quiz) continue;
    const qId = quiz.id;
    const quizTotalPts = (quiz.quiz_questions || []).reduce((s: number, q: any) => s + q.points, 0);
    if (!quizMap[qId]) quizMap[qId] = { title: quiz.title, total: 0, graded: 0, timedOut: 0, scores: [], totalPoints: quizTotalPts };
    quizMap[qId].total++;
    if (sub.status === 'graded') { quizMap[qId].graded++; quizMap[qId].scores.push(sub.final_score ?? sub.score ?? 0); }
    if (sub.timed_out) quizMap[qId].timedOut++;
  }

  const quizStats = Object.entries(quizMap).map(([id, data]) => {
    const avg = data.scores.length ? Math.round(data.scores.reduce((a, b) => a + b, 0) / data.scores.length) : null;
    const passRate = data.scores.length ? Math.round(data.scores.filter(s => data.totalPoints > 0 && (s / data.totalPoints) >= 0.6).length / data.scores.length * 100) : null;
    return { id, ...data, avg, passRate };
  });

  // Per-student stats
  const studentMap: Record<string, { name: string; avatar: string | null; quizzes: number; avgScore: number | null; scores: number[]; totalPts: number[] }> = {};
  for (const sub of allSubmissions || []) {
    const p = sub.profiles as any;
    const quiz = sub.quizzes as any;
    if (!p || !quiz) continue;
    const sId = (p as any).id;
    const totalPts = (quiz.quiz_questions || []).reduce((s: number, q: any) => s + q.points, 0);
    if (!studentMap[sId]) studentMap[sId] = { name: p.full_name || 'Unknown', avatar: p.avatar_url, quizzes: 0, avgScore: null, scores: [], totalPts: [] };
    studentMap[sId].quizzes++;
    if (sub.status === 'graded') { studentMap[sId].scores.push(sub.final_score ?? sub.score ?? 0); studentMap[sId].totalPts.push(totalPts); }
  }

  const studentStats = Object.entries(studentMap).map(([id, data]) => {
    const pct = data.scores.length
      ? Math.round(data.scores.reduce((a, b, i) => a + (data.totalPts[i] > 0 ? b / data.totalPts[i] : 0), 0) / data.scores.length * 100)
      : null;
    return { id, ...data, pct };
  }).sort((a, b) => (b.pct ?? -1) - (a.pct ?? -1));

  const totalSubmissions = allSubmissions?.length || 0;
  const gradedSubmissions = allSubmissions?.filter(s => s.status === 'graded').length || 0;
  const timedOutCount = allSubmissions?.filter(s => s.timed_out).length || 0;
  const overallAvg = gradedSubmissions > 0
    ? Math.round(allSubmissions!.filter(s => s.status === 'graded').reduce((sum, s) => sum + ((s.final_score ?? s.score ?? 0)), 0) / gradedSubmissions)
    : null;

  return (
    <div className="flex min-h-screen bg-background">
      <AdminNavigation />
      <main className="flex-1 p-8 md:p-12 overflow-y-auto">
        <div className="max-w-6xl mx-auto">
          <header className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <BarChart2 className="w-7 h-7 text-primary" />
              <h1 className="text-3xl font-bold text-foreground">Performance Analytics</h1>
            </div>
            <p className="text-muted-foreground text-sm">A bird's-eye view of student performance across all quizzes.</p>
          </header>

          {/* Top stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
            {[
              { label: 'Total Submissions', value: totalSubmissions, icon: TrendingUp, color: 'text-blue-500' },
              { label: 'Fully Graded', value: gradedSubmissions, icon: CheckCircle2, color: 'text-green-500' },
              { label: 'Timed Out', value: timedOutCount, icon: Clock, color: 'text-amber-500' },
              { label: 'Pending Review', value: totalSubmissions - gradedSubmissions, icon: AlertTriangle, color: 'text-red-500' },
            ].map(stat => {
              const Icon = stat.icon;
              return (
                <div key={stat.label} className="clean-panel p-5 rounded-xl border border-border bg-card">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">{stat.label}</p>
                    <Icon className={`w-4 h-4 ${stat.color}`} />
                  </div>
                  <p className="text-3xl font-bold text-foreground">{stat.value}</p>
                </div>
              );
            })}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
            {/* Per-Quiz Stats */}
            <div className="clean-panel rounded-xl border border-border bg-card overflow-hidden">
              <div className="p-5 border-b border-border">
                <h2 className="font-bold text-foreground text-lg">Quiz Performance</h2>
                <p className="text-sm text-muted-foreground">Average scores and pass rates per quiz.</p>
              </div>
              <div className="divide-y divide-border">
                {quizStats.length === 0 && (
                  <p className="text-muted-foreground text-sm p-5">No quiz data yet.</p>
                )}
                {quizStats.map(quiz => (
                  <div key={quiz.id} className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="font-medium text-foreground">{quiz.title}</p>
                        <p className="text-xs text-muted-foreground">{quiz.total} submission{quiz.total !== 1 ? 's' : ''} · {quiz.timedOut} timed out</p>
                      </div>
                      {quiz.passRate !== null && (
                        <span className={`text-sm font-bold px-2.5 py-1 rounded-full ${quiz.passRate >= 60 ? 'bg-green-500/10 text-green-600' : 'bg-red-500/10 text-red-600'}`}>
                          {quiz.passRate}% pass
                        </span>
                      )}
                    </div>
                    {quiz.avg !== null && (
                      <div>
                        <div className="flex justify-between text-xs text-muted-foreground mb-1">
                          <span>Avg: {quiz.avg}/{quiz.totalPoints} pts</span>
                          <span>{quiz.totalPoints > 0 ? Math.round(quiz.avg / quiz.totalPoints * 100) : 0}%</span>
                        </div>
                        <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-700 ${(quiz.avg / quiz.totalPoints) >= 0.6 ? 'bg-green-500' : 'bg-amber-500'}`}
                            style={{ width: `${quiz.totalPoints > 0 ? Math.min(100, Math.round(quiz.avg / quiz.totalPoints * 100)) : 0}%` }}
                          />
                        </div>
                      </div>
                    )}
                    {quiz.avg === null && <p className="text-xs text-muted-foreground italic">Awaiting grading</p>}
                  </div>
                ))}
              </div>
            </div>

            {/* Per-Student Leaderboard */}
            <div className="clean-panel rounded-xl border border-border bg-card overflow-hidden">
              <div className="p-5 border-b border-border">
                <h2 className="font-bold text-foreground text-lg">Student Leaderboard</h2>
                <p className="text-sm text-muted-foreground">Overall performance across all graded quizzes.</p>
              </div>
              <div className="divide-y divide-border">
                {studentStats.length === 0 && (
                  <p className="text-muted-foreground text-sm p-5">No student data yet.</p>
                )}
                {studentStats.slice(0, 15).map((student, i) => (
                  <div key={student.id} className="p-4 flex items-center gap-4">
                    <span className={`w-6 text-center text-sm font-bold flex-shrink-0 ${i === 0 ? 'text-amber-500' : i === 1 ? 'text-slate-400' : i === 2 ? 'text-amber-700' : 'text-muted-foreground'}`}>
                      {i + 1}
                    </span>
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
                      {student.avatar ? <img src={student.avatar} alt="" className="w-full h-full object-cover" /> : <Users className="w-4 h-4 text-muted-foreground" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground truncate">{student.name}</p>
                      <p className="text-xs text-muted-foreground">{student.quizzes} quiz{student.quizzes !== 1 ? 'zes' : ''}</p>
                    </div>
                    {student.pct !== null ? (
                      <div className="text-right flex-shrink-0">
                        <p className={`font-bold text-sm ${student.pct >= 60 ? 'text-green-600' : 'text-amber-600'}`}>{student.pct}%</p>
                        <div className="w-16 h-1.5 bg-muted rounded-full mt-1">
                          <div className={`h-full rounded-full ${student.pct >= 60 ? 'bg-green-500' : 'bg-amber-500'}`} style={{ width: `${student.pct}%` }} />
                        </div>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">Pending</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
