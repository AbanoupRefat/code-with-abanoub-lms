import AdminNavigation from "@/components/AdminNavigation";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import GradingClient from "@/components/GradingClient";
import { ClipboardCheck, AlertCircle, CheckCircle2 } from "lucide-react";

export default async function ManageGradingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return redirect("/login");

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (profile?.role !== 'admin') return redirect("/dashboard");

  // Fetch all submissions that need grading (submitted = has written, not yet fully graded)
  const { data: submissions } = await supabase
    .from('quiz_submissions')
    .select(`
      id, status, mcq_score, final_score, timed_out, submitted_at, started_at, graded_at,
      profiles ( full_name, avatar_url, email ),
      quizzes ( title, time_limit_minutes, show_grade_immediately,
        quiz_questions ( id, question_text, question_type, image_url, points, order_index, quiz_options(id, option_text, is_correct) )
      ),
      quiz_submission_answers ( id, question_id, selected_option_id, text_answer, is_correct, points_awarded )
    `)
    .in('status', ['submitted', 'graded'])
    .order('submitted_at', { ascending: false });

  const pendingCount = submissions?.filter(s => s.status === 'submitted').length || 0;
  const gradedCount = submissions?.filter(s => s.status === 'graded').length || 0;

  return (
    <div className="flex min-h-screen bg-background">
      <AdminNavigation />
      <main className="flex-1 p-8 md:p-12 overflow-y-auto">
        <div className="max-w-5xl mx-auto">
          <header className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <ClipboardCheck className="w-7 h-7 text-primary" />
              <h1 className="text-3xl font-bold text-foreground">Grading Center</h1>
            </div>
            <p className="text-muted-foreground text-sm">Review written answers and finalize student scores.</p>
          </header>

          <div className="flex gap-4 mb-8">
            <div className="clean-panel px-5 py-4 rounded-lg border border-amber-500/30 bg-amber-500/5 flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-amber-500 animate-pulse" />
              <div>
                <p className="text-2xl font-bold text-foreground">{pendingCount}</p>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Awaiting Review</p>
              </div>
            </div>
            <div className="clean-panel px-5 py-4 rounded-lg border border-green-500/30 bg-green-500/5 flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-500" />
              <div>
                <p className="text-2xl font-bold text-foreground">{gradedCount}</p>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Fully Graded</p>
              </div>
            </div>
          </div>

          <GradingClient submissions={(submissions as any[]) || []} />
        </div>
      </main>
    </div>
  );
}
