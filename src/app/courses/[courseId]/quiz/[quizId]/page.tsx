import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import QuizPlayer from "@/components/QuizPlayer";
import { startQuiz } from "@/app/manage/actions";
import Link from "next/link";
import { ChevronLeft, Clock, HelpCircle, PenLine, CheckSquare, Award, Info, Eye, EyeOff } from "lucide-react";
import { LangToggle } from "@/components/LangContext";

export default async function QuizPage({
  params,
  searchParams,
}: {
  params: Promise<{ courseId: string; quizId: string }>;
  searchParams: Promise<{ start?: string }>;
}) {
  const { courseId, quizId } = await params;
  const { start } = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return redirect("/login");

  const { data: quiz } = await supabase
    .from("quizzes")
    .select("*, quiz_questions(*, quiz_options(id, option_text))")
    .eq("id", quizId)
    .single();

  if (!quiz) return redirect(`/courses/${courseId}`);

  const questions = (quiz.quiz_questions || []).slice().sort((a: any, b: any) => a.order_index - b.order_index);
  const mcqCount = questions.filter((q: any) => q.question_type === "mcq").length;
  const writtenCount = questions.filter((q: any) => q.question_type === "written").length;
  const totalPoints = questions.reduce((s: number, q: any) => s + q.points, 0);
  const totalMcqPoints = questions.filter((q: any) => q.question_type === "mcq").reduce((s: number, q: any) => s + q.points, 0);
  const hasWrittenQuestions = writtenCount > 0;

  // Check for existing submission — include scores for results screen
  const { data: existingSubmission } = await supabase
    .from("quiz_submissions")
    .select("id, status, started_at, mcq_score, final_score, quiz_submission_answers(question_id, selected_option_id, text_answer)")
    .eq("quiz_id", quizId)
    .eq("student_id", user.id)
    .maybeSingle();

  const submissionStatus = existingSubmission?.status as "in_progress" | "submitted" | "graded" | undefined;
  const alreadyFinished = submissionStatus === "submitted" || submissionStatus === "graded";
  const hasInProgress = submissionStatus === "in_progress";

  // Show lobby unless: user clicked start, has in_progress, or already finished (show results)
  const shouldShowPlayer = start === "1" || hasInProgress || alreadyFinished;

  let submissionId = existingSubmission?.id || null;
  let startedAt = existingSubmission?.started_at || new Date().toISOString();
  let existingAnswers = existingSubmission?.quiz_submission_answers || [];

  if (shouldShowPlayer && !existingSubmission) {
    try {
      const result = await startQuiz(quizId);
      submissionId = result.submissionId;
      startedAt = new Date().toISOString();
      existingAnswers = [];
    } catch {
      return redirect(`/courses/${courseId}`);
    }
  }

  if (shouldShowPlayer && submissionId) {
    return (
      <div className="flex min-h-screen bg-background flex-col">
        <nav className="flex items-center justify-between px-6 py-3 border-b border-border bg-card sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <Link href={`/courses/${courseId}`} className="text-muted-foreground hover:text-foreground transition-colors">
              <ChevronLeft className="w-5 h-5" />
            </Link>
            <h2 className="font-semibold text-foreground">{quiz.title}</h2>
          </div>
          <div className="w-32">
            <LangToggle />
          </div>
        </nav>
        <QuizPlayer
          quiz={quiz}
          questions={questions}
          submissionId={submissionId}
          startedAt={startedAt}
          existingAnswers={existingAnswers as any}
          showGradeImmediately={quiz.show_grade_immediately}
          initialStatus={submissionStatus}
          initialScore={alreadyFinished ? {
            mcqScore: existingSubmission?.mcq_score ?? 0,
            finalScore: existingSubmission?.final_score ?? null,
            totalMcqPoints,
            totalPoints,
            hasWrittenQuestions,
          } : undefined}
        />
      </div>
    );
  }

  // Quiz Lobby
  return (
    <div className="min-h-screen bg-background">
      <nav className="flex items-center justify-between px-6 py-4 border-b border-border bg-card">
        <Link href={`/courses/${courseId}`} className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1 text-sm">
          <ChevronLeft className="w-4 h-4" /> Back to Course
        </Link>
        <div className="w-32">
          <LangToggle />
        </div>
      </nav>
      <div className="max-w-2xl mx-auto px-6 py-16 flex flex-col items-center text-center">
        <div className="w-16 h-16 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center mb-6">
          <HelpCircle className="w-8 h-8 text-primary" />
        </div>
        <h1 className="text-3xl font-bold text-foreground mb-3">{quiz.title}</h1>
        {quiz.description && <p className="text-muted-foreground mb-8 max-w-md">{quiz.description}</p>}

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10 w-full max-w-lg">
          <div className="bg-card border border-border rounded-lg p-4">
            <p className="text-2xl font-bold text-foreground">{questions.length}</p>
            <p className="text-xs text-muted-foreground uppercase tracking-wider mt-1">Questions / الأسئلة</p>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <Award className="w-5 h-5 text-muted-foreground mx-auto mb-1" />
            <p className="text-2xl font-bold text-foreground">{totalPoints}</p>
            <p className="text-xs text-muted-foreground uppercase tracking-wider mt-0.5">Points / النقاط</p>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <Clock className="w-5 h-5 text-muted-foreground mx-auto mb-1" />
            <p className="text-sm font-semibold text-foreground">{quiz.time_limit_minutes ? `${quiz.time_limit_minutes} min` : "No limit"}</p>
            <p className="text-xs text-muted-foreground uppercase tracking-wider mt-0.5">Timer / الوقت</p>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <PenLine className="w-5 h-5 text-muted-foreground mx-auto mb-1" />
            <p className="text-sm font-semibold text-foreground">{mcqCount} MCQ / {writtenCount} Written</p>
            <p className="text-xs text-muted-foreground uppercase tracking-wider mt-0.5">Format / النوع</p>
          </div>
        </div>

        {quiz.time_limit_minutes && (
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4 mb-6 text-sm text-amber-700 dark:text-amber-400 max-w-md flex items-start gap-2 text-left">
            <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>
              <strong>Heads up / تنبيه:</strong> Once you start, the {quiz.time_limit_minutes}-minute timer begins. Your progress is auto-saved.
              <br />
              <span className="text-xs opacity-80 mt-1 block">بمجرد البدء، يبدأ المؤقت. يتم حفظ إجاباتك تلقائيًا.</span>
            </span>
          </div>
        )}

        <div className="bg-muted/30 border border-border rounded-lg p-4 mb-8 text-sm text-muted-foreground max-w-md text-left space-y-2">
          <p className="flex items-center gap-2"><CheckSquare className="w-4 h-4 text-green-500 flex-shrink-0" /> Answers auto-saved / الإجابات تُحفظ تلقائيًا</p>
          <p className="flex items-center gap-2"><PenLine className="w-4 h-4 text-purple-500 flex-shrink-0" /> Written answers graded manually / الإجابات المكتوبة تُصحَّح يدويًا</p>
          {quiz.show_grade_immediately
            ? <p className="flex items-center gap-2"><Eye className="w-4 h-4 flex-shrink-0" /> MCQ score shown immediately / درجة الاختيار تظهر فور التسليم</p>
            : <p className="flex items-center gap-2"><EyeOff className="w-4 h-4 flex-shrink-0" /> Results shared after grading / النتائج تُشارَك بعد التصحيح</p>
          }
        </div>

        <Link
          href={`/courses/${courseId}/quiz/${quizId}?start=1`}
          className="px-10 py-4 bg-primary text-primary-foreground rounded-xl font-bold text-lg hover:opacity-90 transition-opacity shadow-lg flex items-center gap-2"
        >
          Start Quiz / ابدأ الاختبار <ChevronLeft className="w-5 h-5 rotate-180" />
        </Link>
      </div>
    </div>
  );
}
