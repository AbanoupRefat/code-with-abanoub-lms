import AdminNavigation from "@/components/AdminNavigation";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import QuizBuilderClient from "@/components/QuizBuilderClient";

export default async function ManageQuizPage({ params }: { params: Promise<{ quizId: string }> }) {
  const { quizId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return redirect("/login");

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (profile?.role !== 'admin') return redirect("/dashboard");

  const { data: quiz } = await supabase
    .from('quizzes')
    .select('*, quiz_questions(*, quiz_options(*))')
    .eq('id', quizId)
    .single();

  if (!quiz) return redirect("/manage/courses");

  const { data: unit } = await supabase.from('units').select('course_id').eq('id', quiz.unit_id).single();
  const courseId = unit?.course_id || '';

  return (
    <div className="flex min-h-screen bg-background">
      <AdminNavigation />
      <main className="flex-1 p-8 md:p-12 overflow-y-auto">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
            <Link href={`/manage/courses/${courseId}`} className="hover:text-foreground transition-colors">
              ← Back to Course
            </Link>
          </div>
          <header className="mb-8">
            <p className="text-primary text-sm font-semibold tracking-wider uppercase mb-1">Quiz Builder</p>
            <h1 className="text-3xl font-bold text-foreground">{quiz.title}</h1>
            {quiz.time_limit_minutes && (
              <p className="text-muted-foreground mt-1">⏱ {quiz.time_limit_minutes} minute time limit</p>
            )}
          </header>

          <QuizBuilderClient quiz={quiz} courseId={courseId} />
        </div>
      </main>
    </div>
  );
}
