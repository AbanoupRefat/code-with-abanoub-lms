"use client";

import { useState, useTransition } from "react";
import { ChevronDown, ChevronUp, User, Clock, CheckCircle2, AlertCircle, PenLine, CheckSquare, Award, Save, Filter, Mail } from "lucide-react";
import { toast } from "sonner";
import { gradeAllWrittenAnswers, notifyStudentQuizGraded } from "@/app/manage/actions";
import { useLang } from "@/components/LangContext";
import { useRouter } from "next/navigation";

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

export default function GradingClient({ submissions, currentFilter }: { submissions: Submission[], currentFilter: string }) {
  const { t } = useLang();
  const router = useRouter();
  const [expanded, setExpanded] = useState<string | null>(null);
  const [pendingGrades, setPendingGrades] = useState<Record<string, Record<string, string>>>({});
  const [isPending, startTransition] = useTransition();

  const handleFilterChange = (filter: string) => {
    router.push(`/manage/grading?filter=${filter}`);
  };

  const handleGradeChange = (submissionId: string, answerId: string, val: string) => {
    setPendingGrades(prev => ({
      ...prev,
      [submissionId]: {
        ...(prev[submissionId] || {}),
        [answerId]: val
      }
    }));
  };

  const markUngradedAsZero = (sub: Submission) => {
    const writtenQs = sub.quizzes.quiz_questions.filter(q => q.question_type === 'written');
    const newGrades = { ...pendingGrades[sub.id] };
    writtenQs.forEach(q => {
      const ans = sub.quiz_submission_answers.find(a => a.question_id === q.id);
      if (ans && ans.points_awarded === null && !newGrades[ans.id]) {
        newGrades[ans.id] = "0";
      }
    });
    setPendingGrades(prev => ({ ...prev, [sub.id]: newGrades }));
  };

  const handleBatchSubmit = (sub: Submission) => {
    const gradesToSubmit: { answerId: string, pointsAwarded: number }[] = [];
    
    // Gather already saved grades + pending edits
    const writtenQs = sub.quizzes.quiz_questions.filter(q => q.question_type === 'written');
    for (const q of writtenQs) {
      const ans = sub.quiz_submission_answers.find(a => a.question_id === q.id);
      if (ans) {
        let pts = ans.points_awarded;
        if (pendingGrades[sub.id]?.[ans.id] !== undefined) {
          pts = parseFloat(pendingGrades[sub.id][ans.id]);
        }
        
        if (pts !== null && !isNaN(pts) && pts >= 0 && pts <= q.points) {
          gradesToSubmit.push({ answerId: ans.id, pointsAwarded: pts });
        }
      }
    }

    if (gradesToSubmit.length === 0) {
      toast.error("No valid grades to save");
      return;
    }

    startTransition(async () => {
      try {
        await gradeAllWrittenAnswers(sub.id, gradesToSubmit);
        toast.success(t("grading.save") + " ✓");
        
        // Remove from pending state since it's saved
        setPendingGrades(prev => {
          const newGrades = { ...prev };
          delete newGrades[sub.id];
          return newGrades;
        });
      } catch (e: any) {
        toast.error(e.message);
      }
    });
  };

  const handleNotifyStudent = (subId: string) => {
    startTransition(async () => {
      try {
        await notifyStudentQuizGraded(subId);
        toast.success(t("grading.notifyStudent") + " ✓");
      } catch (e: any) {
        toast.error(e.message || "Failed to send email");
      }
    });
  };

  return (
    <div className="space-y-6">
      
      {/* Filters */}
      <div className="flex items-center gap-2 p-1.5 bg-muted/50 rounded-lg w-fit border border-border">
        <Filter className="w-4 h-4 text-muted-foreground ml-2 mr-1" />
        <button 
          onClick={() => handleFilterChange('all')}
          className={`px-3 py-1.5 text-sm font-semibold rounded-md transition-colors ${currentFilter === 'all' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
        >
          {t("grading.all")}
        </button>
        <button 
          onClick={() => handleFilterChange('pending')}
          className={`px-3 py-1.5 text-sm font-semibold rounded-md transition-colors ${currentFilter === 'pending' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
        >
          {t("grading.pending")}
        </button>
        <button 
          onClick={() => handleFilterChange('completed')}
          className={`px-3 py-1.5 text-sm font-semibold rounded-md transition-colors ${currentFilter === 'completed' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
        >
          {t("grading.completed")}
        </button>
      </div>

      {submissions.length === 0 ? (
        <div className="text-center py-16 clean-panel rounded-lg border border-dashed border-border">
          <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-4 opacity-50" />
          <p className="text-lg font-semibold text-foreground">{t("grading.allDone")}</p>
          <p className="text-muted-foreground text-sm mt-1">{t("grading.noPending")}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {submissions.map((sub) => {
            const isOpen = expanded === sub.id;
            const questions = sub.quizzes?.quiz_questions?.slice().sort((a, b) => a.order_index - b.order_index) || [];
            
            const mcqQuestions = questions.filter(q => q.question_type === 'mcq');
            const writtenQuestions = questions.filter(q => q.question_type === 'written');
            
            const totalPoints = questions.reduce((s, q) => s + q.points, 0);
            
            // Calculate current display score (Auto MCQ + whatever written points are saved or typed)
            let currentWrittenScore = 0;
            let writtenGradedCount = 0;
            
            writtenQuestions.forEach(q => {
              const ans = sub.quiz_submission_answers.find(a => a.question_id === q.id);
              let pts = ans?.points_awarded;
              
              if (pendingGrades[sub.id]?.[ans?.id || ''] !== undefined) {
                const typed = parseFloat(pendingGrades[sub.id][ans!.id]);
                if (!isNaN(typed)) {
                  pts = typed;
                }
              }
              
              if (pts !== null && pts !== undefined) {
                currentWrittenScore += pts;
                writtenGradedCount++;
              }
            });

            const currentTotalScore = sub.mcq_score + currentWrittenScore;
            const allWrittenGradedLocally = writtenGradedCount === writtenQuestions.length;

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
                      {currentTotalScore}/{totalPoints}
                    </span>
                    {isOpen ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                  </div>
                </button>

                {isOpen && (
                  <div className="border-t border-border p-5 space-y-8 bg-muted/10">
                    
                    {/* Score Summary Panel */}
                    <div className="bg-background rounded-xl border border-border p-4 flex flex-col md:flex-row items-center justify-between gap-6">
                      <div className="flex gap-8 w-full md:w-auto">
                        <div>
                          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1 font-bold">{t("grading.mcqSection")}</p>
                          <p className="text-2xl font-bold text-blue-600">{sub.mcq_score}</p>
                        </div>
                        <div className="w-px bg-border h-12" />
                        <div>
                          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1 font-bold">{t("grading.writtenSection")}</p>
                          <p className={`text-2xl font-bold ${allWrittenGradedLocally ? 'text-green-600' : 'text-amber-500'}`}>
                            {currentWrittenScore}
                          </p>
                          <p className="text-xs text-muted-foreground">{writtenGradedCount} / {writtenQuestions.length} graded</p>
                        </div>
                      </div>
                      
                      <div className="flex-1 w-full flex flex-col items-end">
                        <div className="flex items-center gap-3 mb-3">
                           {!allWrittenGradedLocally && (
                              <button 
                                onClick={() => markUngradedAsZero(sub)}
                                className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2"
                              >
                                {t("grading.markZero")}
                              </button>
                           )}
                           <button
                             onClick={() => handleBatchSubmit(sub)}
                             disabled={isPending || Object.keys(pendingGrades[sub.id] || {}).length === 0}
                             className="px-5 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-bold shadow-sm hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2"
                           >
                             <Save className="w-4 h-4" /> {t("grading.batchSave")}
                           </button>
                        </div>

                        {allWrittenGradedLocally && (
                          <div className="flex justify-end mb-3 w-full">
                             <button
                               onClick={() => handleNotifyStudent(sub.id)}
                               disabled={isPending}
                               className="px-4 py-1.5 border border-border text-foreground hover:bg-muted/50 rounded-lg text-xs font-bold transition-colors disabled:opacity-50 flex items-center gap-1.5"
                             >
                               <Mail className="w-3.5 h-3.5 text-blue-500" /> {t("grading.notifyStudent")}
                             </button>
                          </div>
                        )}
                        
                        <div className="w-full max-w-xs space-y-1">
                          <div className="flex justify-between text-xs font-bold">
                            <span>{t("grading.totalScore")}</span>
                            <span>{currentTotalScore} / {totalPoints}</span>
                          </div>
                          <div className="w-full h-2 bg-muted rounded-full overflow-hidden flex">
                             <div className="bg-blue-500 h-full transition-all" style={{ width: `${(sub.mcq_score / totalPoints) * 100}%` }} />
                             <div className="bg-green-500 h-full transition-all" style={{ width: `${(currentWrittenScore / totalPoints) * 100}%` }} />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Written Questions */}
                    {writtenQuestions.length > 0 && (
                      <div className="space-y-4">
                        <h3 className="font-bold text-foreground flex items-center gap-2">
                          <PenLine className="w-4 h-4 text-purple-500" /> {t("grading.writtenSection")}
                        </h3>
                        {writtenQuestions.map((q, i) => {
                          const answer = sub.quiz_submission_answers.find((a) => a.question_id === q.id);
                          const isGradedLocally = answer?.points_awarded !== null || pendingGrades[sub.id]?.[answer?.id || ''] !== undefined;

                          return (
                            <div key={q.id} className={`bg-card border rounded-lg p-4 transition-colors ${!isGradedLocally ? 'border-amber-500/50 shadow-[0_0_0_1px_rgba(245,158,11,0.2)]' : 'border-border'}`}>
                              <div className="flex items-start gap-3 mb-3">
                                <span className="text-xs font-bold bg-muted text-muted-foreground px-2 py-0.5 rounded-full flex-shrink-0 mt-0.5">Q{q.order_index + 1}</span>
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                                    <span className="text-xs text-muted-foreground flex items-center gap-0.5">
                                      <Award className="w-3 h-3" /> {q.points} {t("quiz.points").toLowerCase()}
                                    </span>
                                    {!isGradedLocally && <span className="text-xs font-bold text-amber-500 bg-amber-500/10 px-2 rounded-full">Needs Grade</span>}
                                  </div>
                                  <p className="text-foreground font-medium">{q.question_text}</p>
                                </div>
                              </div>

                              <div className="ms-8 space-y-3">
                                <div className="bg-muted/50 rounded-md p-3">
                                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1 font-medium">{t("grading.studentAnswer")}</p>
                                  {answer?.text_answer ? (
                                    <p className="text-foreground text-sm whitespace-pre-wrap">{answer.text_answer}</p>
                                  ) : (
                                    <p className="text-muted-foreground italic text-sm">{t("grading.notAnswered")}</p>
                                  )}
                                </div>
                                <div className="flex items-center gap-3">
                                  <label className="text-sm font-medium text-foreground">{t("grading.pointsAwarded")}</label>
                                  <input
                                    type="number" min={0} max={q.points} step="0.5"
                                    value={pendingGrades[sub.id]?.[answer?.id || ''] ?? answer?.points_awarded ?? ""}
                                    placeholder={`0–${q.points}`}
                                    onChange={(e) => handleGradeChange(sub.id, answer?.id || "", e.target.value)}
                                    className="w-24 bg-background border border-border rounded-md px-3 py-1.5 text-sm text-foreground focus:ring-1 focus:ring-primary outline-none transition-shadow"
                                  />
                                  <span className="text-sm text-muted-foreground">/ {q.points}</span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* MCQ Questions (Read-Only) */}
                    {mcqQuestions.length > 0 && (
                      <div className="space-y-4 opacity-75 mt-8">
                        <h3 className="font-bold text-muted-foreground flex items-center gap-2">
                          <CheckSquare className="w-4 h-4 text-blue-500" /> {t("grading.mcqSection")}
                        </h3>
                        {mcqQuestions.map((q, i) => {
                          const answer = sub.quiz_submission_answers.find((a) => a.question_id === q.id);

                          return (
                            <div key={q.id} className="bg-transparent border border-border rounded-lg p-4">
                              <div className="flex items-start gap-3 mb-3">
                                <span className="text-xs font-bold bg-muted text-muted-foreground px-2 py-0.5 rounded-full flex-shrink-0 mt-0.5">Q{q.order_index + 1}</span>
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                                    <span className={`text-xs font-semibold flex items-center gap-1 ${answer?.is_correct ? 'text-green-600' : 'text-red-500'}`}>
                                      {answer?.is_correct ? <CheckCircle2 className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                                      {answer?.points_awarded || 0} / {q.points} pts
                                    </span>
                                  </div>
                                  <p className="text-muted-foreground font-medium text-sm">{q.question_text}</p>
                                </div>
                              </div>
                              <div className="space-y-1.5 ms-8">
                                {q.quiz_options.map((opt) => (
                                  <div key={opt.id} className={`text-sm px-3 py-1 rounded-md flex items-center gap-2 ${
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
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
