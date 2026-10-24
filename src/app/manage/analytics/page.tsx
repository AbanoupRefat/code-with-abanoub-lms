import AdminNavigation from "@/components/AdminNavigation";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import PaymentPie from "@/app/manage/payments/PaymentPie";
import { COLORS, FEE_LABELS, PALETTE, formatEgp } from "@/app/manage/payments/types";
import { BarChart2, Award, Users, TrendingUp, Clock, CheckCircle2, AlertTriangle } from "lucide-react";

export default async function AnalyticsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return redirect("/login");

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (profile?.role !== 'admin') return redirect("/dashboard");

  // ── Revenue (all money received, kept per stream) ─────────────
  const [tuitionRes, feesRes, sessionsRes] = await Promise.all([
    supabase.from('student_payments').select('amount, month, year, status, payment_method').eq('status', 'paid'),
    supabase.from('one_time_payments').select('amount, fee_type, payment_method, paid_at'),
    supabase.from('private_sessions').select('price, payment_method, paid_at').eq('status', 'paid'),
  ]);
  const cairoYm = (iso: string | null) =>
    iso ? new Date(iso).toLocaleDateString('en-CA', { timeZone: 'Africa/Cairo' }).slice(0, 7) : null;

  const rev = { tuition: 0, notes: 0, printing: 0, other: 0, private: 0 };
  const byMethod: Record<string, number> = {};
  const byMonth: Record<string, typeof rev> = {};
  const bump = (ym: string | null, key: keyof typeof rev, amt: number, method: string | null) => {
    rev[key] += amt;
    const m = method || 'Unspecified';
    byMethod[m] = (byMethod[m] || 0) + amt;
    if (ym) {
      byMonth[ym] ??= { tuition: 0, notes: 0, printing: 0, other: 0, private: 0 };
      byMonth[ym][key] += amt;
    }
  };
  for (const p of tuitionRes.data || []) {
    bump(`${p.year}-${String(p.month).padStart(2, '0')}`, 'tuition', Number(p.amount) || 0, p.payment_method);
  }
  for (const p of feesRes.error ? [] : feesRes.data || []) {
    bump(cairoYm(p.paid_at), p.fee_type as 'notes' | 'printing' | 'other', Number(p.amount) || 0, p.payment_method);
  }
  for (const p of sessionsRes.error ? [] : sessionsRes.data || []) {
    bump(cairoYm(p.paid_at), 'private', Number(p.price) || 0, p.payment_method);
  }
  const revTotal = rev.tuition + rev.notes + rev.printing + rev.other + rev.private;
  let palIdx = 0;
  const methodSlices = Object.entries(byMethod)
    .sort((a, b) => b[1] - a[1])
    .map(([name, value]) => ({ name, value, color: (COLORS as Record<string, string>)[name] ?? PALETTE[palIdx++ % PALETTE.length] }));
  const months = Object.keys(byMonth).sort().slice(-6);
  const monthMax = Math.max(1, ...months.map((m) => Object.values(byMonth[m]).reduce((a, b) => a + b, 0)));
  const streams: { key: keyof typeof rev; label: string; color: string }[] = [
    { key: 'tuition', label: 'Monthly tuition', color: COLORS.tuition },
    { key: 'notes', label: FEE_LABELS.notes, color: COLORS.notes },
    { key: 'printing', label: FEE_LABELS.printing, color: COLORS.printing },
    { key: 'other', label: 'Other fees', color: COLORS.other },
    { key: 'private', label: 'Private sessions', color: COLORS.private },
  ];

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

          {/* Revenue */}
          <section className="mb-12">
            <h2 className="text-xl font-bold text-foreground mb-1">Revenue</h2>
            <p className="text-sm text-muted-foreground mb-4">All money received, all time — every stream tracked separately.</p>

            <div className="grid grid-cols-2 lg:grid-cols-6 gap-4 mb-6">
              <div className="col-span-2 lg:col-span-1 p-4 rounded-xl bg-primary text-primary-foreground shadow-md">
                <p className="text-xs font-semibold uppercase opacity-80">Total net</p>
                <p className="text-xl font-bold mt-1">{formatEgp(revTotal)}</p>
              </div>
              {streams.map((st) => (
                <div key={st.key} className="clean-panel p-4 rounded-xl border border-border bg-card" style={{ borderLeft: `4px solid ${st.color}` }}>
                  <p className="text-xs font-semibold text-muted-foreground uppercase">{st.label}</p>
                  <p className="text-lg font-bold text-foreground mt-1">{formatEgp(rev[st.key])}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
              <PaymentPie
                title="Revenue by source"
                subtitle="All time"
                data={streams.map((st) => ({ name: st.label, value: rev[st.key], color: st.color }))}
                format={formatEgp}
                centerCaption="Net"
                emptyText="No income recorded yet"
              />
              <PaymentPie
                title="Revenue by payment method"
                subtitle="All time · all sources"
                data={methodSlices}
                format={formatEgp}
                centerCaption="Net"
                emptyText="No income recorded yet"
              />
            </div>

            <div className="clean-panel rounded-xl border border-border bg-card p-5">
              <h3 className="font-bold text-foreground text-sm mb-1">Income by month (last 6)</h3>
              <div className="flex flex-wrap gap-x-4 gap-y-1 mb-4">
                {streams.map((st) => (
                  <span key={st.key} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: st.color }} />
                    {st.label}
                  </span>
                ))}
              </div>
              {months.length === 0 && <p className="text-sm text-muted-foreground">No income recorded yet.</p>}
              <div className="space-y-3">
                {months.map((m) => {
                  const total = Object.values(byMonth[m]).reduce((a, b) => a + b, 0);
                  return (
                    <div key={m}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="font-medium text-foreground">{m}</span>
                        <span className="text-muted-foreground">{formatEgp(total)}</span>
                      </div>
                      <div className="flex h-3 rounded-full overflow-hidden bg-muted" style={{ width: `${Math.max(4, (total / monthMax) * 100)}%` }}>
                        {streams.map((st) =>
                          byMonth[m][st.key] > 0 ? (
                            <div key={st.key} title={`${st.label}: ${formatEgp(byMonth[m][st.key])}`} style={{ width: `${(byMonth[m][st.key] / total) * 100}%`, backgroundColor: st.color }} />
                          ) : null
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

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
                            className={`h-full rounded-full transition-all duration-700 ${
                              (quiz.avg / quiz.totalPoints) >= 0.8 ? 'bg-green-500' :
                              (quiz.avg / quiz.totalPoints) >= 0.6 ? 'bg-blue-500' : 'bg-amber-500'
                            }`}
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
