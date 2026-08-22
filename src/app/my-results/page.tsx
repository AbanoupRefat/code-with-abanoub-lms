import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import Navigation from "@/components/Navigation";
import StudentAnalyticsClient from "./StudentAnalyticsClient";

export const metadata = {
  title: "My Results — LMS",
};

export default async function MyResultsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return redirect("/login");

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();

  const { data: submissions } = await supabase
    .from('quiz_submissions')
    .select(`
      id, status, score, mcq_score, final_score, timed_out, submitted_at,
      quizzes ( id, title, quiz_questions(points) )
    `)
    .eq('student_id', user.id)
    .in('status', ['submitted', 'graded'])
    .order('submitted_at', { ascending: false });

  let best: any = null;
  let worst: any = null;
  let totalScoreSum = 0;
  let totalPointsSum = 0;

  submissions?.forEach((sub) => {
    if (sub.status !== 'graded') return;
    
    const quiz = sub.quizzes as any;
    const totalPts = quiz?.quiz_questions?.reduce((s: number, q: any) => s + q.points, 0) || 0;
    const score = sub.final_score ?? sub.score;
    const pct = totalPts > 0 ? (score / totalPts) * 100 : 0;
    
    totalScoreSum += score;
    totalPointsSum += totalPts;
    
    const stats = { title: quiz?.title, score, pct: Math.round(pct) };
    
    if (!best || pct > best.pct) best = stats;
    if (!worst || pct < worst.pct) worst = stats;
  });

  const overallAvg = totalPointsSum > 0 ? Math.round((totalScoreSum / totalPointsSum) * 100) : null;
  const stats = { best, worst: best && worst && best.title !== worst.title ? worst : null };

  return (
    <div className="flex min-h-screen bg-background">
      <Navigation profile={profile} />
      <main className="flex-1 p-8 md:p-12 overflow-y-auto">
        <StudentAnalyticsClient 
          stats={stats} 
          submissions={submissions || []} 
          overallAvg={overallAvg} 
        />
      </main>
    </div>
  );
}
