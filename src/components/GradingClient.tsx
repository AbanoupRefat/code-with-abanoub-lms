"use client";

import { useState, useTransition } from "react";
import { ChevronDown, ChevronUp, User, Clock, CheckCircle2, AlertCircle, PenLine, CheckSquare, Award } from "lucide-react";
import { toast } from "sonner";
import { gradeWrittenAnswer } from "@/app/manage/actions";
import { useLang } from "@/components/LangContext";

interface Submission {
  id: string;
  status: string;
  mcq_score: number;
  final_score: number | null;
  timed_out: boolean;
  submitted_at: string;
  started_at: string | null;
  graded_at: string | null;
  profiles: { full_name: string; avatar_url: string | null; email: string | null };
  quizzes: {
    title: string;
    time_limit_minutes: number | null;
    show_grade_immediately: boolean;
    quiz_questions: {
      id: string; question_text: string; question_type: string; image_url: string | null;
      points: number; order_index: number;
      quiz_options: { id: string; option_text: string; is_correct: boolean }[];
    }[];
  };
  quiz_submission_answers: {
    id: string; question_id: string; selected_option_id: string | null; text_answer: string | null;
    is_correct: boolean | null; points_awarded: number | null;
  }[];
}

export default function GradingClient({ submissions }: { submissions: Submission[] }) {
  const { t } = useLang();
  const [expanded, setExpanded] = useState<string | null>(null);
  const [pendingGrades, setPendingGrades] = useState<Record<string, string>>({});
  const [isPending, startTransition] = useTransition();

  const handleGrade = (answerId: string, submissionId: string) => {
    const pts = parseFloat(pendingGrades[answerId] || "0");
    if (isNaN(pts) || pts < 0) { toast.error("Invalid points value"); return; }
    startTransition(async () => {
      try {
        await gradeWrittenAnswer(answerId, pts, submissionId);
        toast.success(t("grading.save") + " ✓");
      } catch (e: any) {
        toast.error(e.message);
      }
    });
  };

  if (submissions.length === 0) {
    return (
      <div className="text-center py-16 clean-panel rounded-lg border border-dashed border-border">
        <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-4" />
        <p className="text-lg font-semibold text-foreground">{t("grading.allDone")}</p>
        <p className="text-muted-foreground text-sm mt-1">{t("grading.noPending")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {submissions.map((sub) => {
        const isOpen = expanded === sub.id;
        const questions = sub.quizzes?.quiz_questions?.slice().sort((a, b) => a.order_index - b.order_index) || [];
        const totalPoints = questions.reduce((s, q) => s + q.points, 0);

        return (
          <div key={sub.id} className="clean-panel rounded-lg border border-border bg-card overflow-hidden">
            <button
              onClick={() => setExpanded(isOpen ? null : sub.id)}
              className="w-full flex items-center justify-between p-5 text-left hover:bg-muted/20 transition-colors"
            >
              <div className="flex items-center gap-4 flex-1 min-w-0">
                <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
                  {sub.profiles?.avatar_url ? (
                    <img src={sub.profiles.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : <User className="w-4 h-4 text-muted-foreground" />}
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-foreground truncate">{sub.profiles?.full_name || "Unknown"}</p>
                  <p className="text-sm text-muted-foreground truncate">{sub.quizzes?.title}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0 ms-4">
                {sub.timed_out && (
                  <span className="text-xs text-amber-600 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {t("grading.timedOut")}
                  </span>
                )}
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1 ${
                  sub.status === "submitted"
                    ? "bg-amber-500/10 text-amber-600 border border-amber-500/20"
                    : "bg-green-500/10 text-green-600 border border-green-500/20"
                }`}>
                  {sub.status === "submitted"
                    ? <><AlertCircle className="w-3 h-3" /> {t("grading.awaitingReview")}</>
                    : <><CheckCircle2 className="w-3 h-3" /> {t("grading.graded")}</>}
                </span>
                <span className="text-sm text-muted-foreground flex items-center gap-1">
                  <Award className="w-3.5 h-3.5" />
                  {sub.final_score !== null ? sub.final_score : sub.mcq_score}/{totalPoints}
                </span>
                {isOpen ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
              </div>
            </button>

            {isOpen && (
              <div className="border-t border-border p-5 space-y-6 bg-muted/10">
                <div className="text-xs text-muted-foreground flex flex-wrap gap-4">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {t("grading.submitted")}: {sub.submitted_at ? new Date(sub.submitted_at).toLocaleString() : "N/A"}
                  </span>
                  {sub.quizzes?.time_limit_minutes && sub.started_at && (
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {t("grading.timeLimit")}: {sub.quizzes.time_limit_minutes} {t("quiz.minutes").toLowerCase()}</span>
                  )}
                  {sub.graded_at && (
                    <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-green-500" /> {t("grading.gradedAt")}: {new Date(sub.graded_at).toLocaleString()}</span>
                  )}
                </div>

                {questions.map((q, i) => {
                  const answer = sub.quiz_submission_answers.find((a) => a.question_id === q.id);

                  return (
                    <div key={q.id} className="bg-card border border-border rounded-lg p-4">
                      <div className="flex items-start gap-3 mb-3">
                        <span className="text-xs font-bold bg-muted text-muted-foreground px-2 py-0.5 rounded-full flex-shrink-0 mt-0.5">Q{i + 1}</span>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 ${q.question_type === "mcq" ? "bg-blue-500/10 text-blue-600" : "bg-purple-500/10 text-purple-600"}`}>
                              {q.question_type === "mcq" ? <CheckSquare className="w-3 h-3" /> : <PenLine className="w-3 h-3" />}
                              {t(q.question_type === "mcq" ? "quiz.mcq" : "quiz.written")}
                            </span>
                            <span className="text-xs text-muted-foreground flex items-center gap-0.5">
                              <Award className="w-3 h-3" /> {q.points}
                            </span>
                          </div>
                          {q.image_url && <img src={q.image_url} alt="" className="mb-2 max-h-32 rounded-md object-contain" />}
                          <p className="text-foreground font-medium">{q.question_text}</p>
                        </div>
                      </div>

                      {q.question_type === "mcq" ? (
                        <div className="space-y-1.5 ms-8">
                          {q.quiz_options.map((opt) => (
                            <div key={opt.id} className={`text-sm px-3 py-1.5 rounded-md flex items-center gap-2 ${
                              opt.is_correct ? "bg-green-500/10 text-green-700 dark:text-green-400"
                              : opt.id === answer?.selected_option_id && !opt.is_correct ? "bg-red-500/10 text-red-600"
                              : "text-muted-foreground"
                            }`}>
                              {opt.is_correct
                                ? <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
                                : opt.id === answer?.selected_option_id
                                ? <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                                : <span className="w-3.5 h-3.5 rounded-full border border-current inline-block flex-shrink-0" />}
                              {opt.option_text}
                              {opt.id === answer?.selected_option_id && !opt.is_correct && (
                                <span className="text-xs ms-1">({t("grading.studentAnswer_label")})</span>
                              )}
                            </div>
                          ))}
                          {!answer && <p className="text-xs text-muted-foreground italic ms-1">{t("grading.notAnswered")}</p>}
                        </div>
                      ) : (
                        <div className="ms-8 space-y-3">
                          <div className="bg-muted/50 rounded-md p-3">
                            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1 font-medium">{t("grading.studentAnswer")}</p>
                            {answer?.text_answer ? (
                              <p className="text-foreground text-sm whitespace-pre-wrap">{answer.text_answer}</p>
                            ) : (
                              <p className="text-muted-foreground italic text-sm">{t("grading.notAnswered")}</p>
                            )}
                          </div>
                          <div className="flex items-center gap-3 flex-wrap">
                            <label className="text-sm font-medium text-foreground">{t("grading.pointsAwarded")}</label>
                            <input
                              type="number" min={0} max={q.points}
                              defaultValue={answer?.points_awarded ?? ""}
                              placeholder={`0–${q.points}`}
                              onChange={(e) => setPendingGrades((prev) => ({ ...prev, [answer?.id || ""]: e.target.value }))}
                              className="w-24 bg-background border border-border rounded-md px-3 py-1.5 text-sm text-foreground"
                            />
                            <span className="text-sm text-muted-foreground">/ {q.points}</span>
                            <button
                              onClick={() => handleGrade(answer?.id || "", sub.id)}
                              disabled={isPending || !answer?.id}
                              className="px-4 py-1.5 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-1.5"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" /> {t("grading.save")}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
