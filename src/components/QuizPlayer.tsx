"use client";

import { useState, useEffect, useRef, useCallback, useTransition } from "react";
import {
  Clock, CheckCircle2, AlertTriangle, Send, Loader2,
  HelpCircle, PenLine, Save, ChevronRight, AlertCircle,
  BookOpen, Info, Eye, EyeOff,
} from "lucide-react";
import { toast } from "sonner";
import { saveQuizAnswer, submitQuiz } from "@/app/manage/actions";
import { useRouter } from "next/navigation";
import { useLang } from "@/components/LangContext";

interface QuizOption { id: string; option_text: string; }
interface QuizQuestion {
  id: string; question_text: string; question_type: "mcq" | "written";
  image_url: string | null; points: number; order_index: number;
  quiz_options: QuizOption[];
}
interface Quiz {
  id: string; title: string; description: string | null;
  time_limit_minutes: number | null; show_grade_immediately: boolean;
}
interface ExistingAnswer {
  question_id: string; selected_option_id: string | null; text_answer: string | null;
}
interface Props {
  quiz: Quiz;
  questions: QuizQuestion[];
  submissionId: string;
  startedAt: string;
  existingAnswers: ExistingAnswer[];
  showGradeImmediately: boolean;
}

export default function QuizPlayer({
  quiz, questions, submissionId, startedAt, existingAnswers, showGradeImmediately,
}: Props) {
  const router = useRouter();
  const { t, dir } = useLang();

  const [answers, setAnswers] = useState<Record<string, { optionId?: string; text?: string }>>(() => {
    const init: Record<string, { optionId?: string; text?: string }> = {};
    existingAnswers.forEach((a) => {
      init[a.question_id] = { optionId: a.selected_option_id || undefined, text: a.text_answer || undefined };
    });
    return init;
  });

  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<any>(null);
  const [, startTransition] = useTransition();
  const saveTimeouts = useRef<Record<string, NodeJS.Timeout>>({});
  const timerInterval = useRef<NodeJS.Timeout | null>(null);
  const hasAutoSubmitted = useRef(false);

  // Init timer
  useEffect(() => {
    if (!quiz.time_limit_minutes) return;
    const elapsed = Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000);
    const totalSeconds = quiz.time_limit_minutes * 60;
    setSecondsLeft(Math.max(0, totalSeconds - elapsed));
  }, [quiz.time_limit_minutes, startedAt]);

  // Countdown
  useEffect(() => {
    if (secondsLeft === null) return;
    if (secondsLeft <= 0) {
      if (!hasAutoSubmitted.current) {
        hasAutoSubmitted.current = true;
        handleSubmit(true);
      }
      return;
    }
    timerInterval.current = setTimeout(() => setSecondsLeft((s) => (s !== null ? s - 1 : null)), 1000);
    return () => { if (timerInterval.current) clearTimeout(timerInterval.current); };
  }, [secondsLeft]);

  // Anti-copy protection
  useEffect(() => {
    const prevent = (e: Event) => e.preventDefault();
    const preventKeyboard = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && ["c", "a", "u", "s"].includes(e.key.toLowerCase())) e.preventDefault();
    };
    document.addEventListener("copy", prevent);
    document.addEventListener("contextmenu", prevent);
    document.addEventListener("keydown", preventKeyboard);
    return () => {
      document.removeEventListener("copy", prevent);
      document.removeEventListener("contextmenu", prevent);
      document.removeEventListener("keydown", preventKeyboard);
    };
  }, []);

  const autoSave = useCallback(
    (questionId: string, optionId?: string, text?: string) => {
      if (saveTimeouts.current[questionId]) clearTimeout(saveTimeouts.current[questionId]);
      saveTimeouts.current[questionId] = setTimeout(async () => {
        try { await saveQuizAnswer(submissionId, questionId, optionId || null, text || null); } catch { }
      }, 800);
    },
    [submissionId]
  );

  const handleOptionSelect = (questionId: string, optionId: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: { ...prev[questionId], optionId } }));
    autoSave(questionId, optionId, undefined);
  };

  const handleTextChange = (questionId: string, text: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: { ...prev[questionId], text } }));
    autoSave(questionId, undefined, text);
  };

  const handleSubmit = async (timedOut = false) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    Object.values(saveTimeouts.current).forEach((t) => clearTimeout(t));
    for (const [qId, ans] of Object.entries(answers)) {
      await saveQuizAnswer(submissionId, qId, ans.optionId || null, ans.text || null).catch(() => { });
    }
    try {
      const result = await submitQuiz(submissionId, quiz.id, timedOut);
      setSubmissionResult(result);
      setSubmitted(true);
      if (timerInterval.current) clearTimeout(timerInterval.current);
    } catch (e: any) {
      toast.error(e.message);
      setIsSubmitting(false);
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const answeredCount = Object.values(answers).filter((a) => a.optionId || (a.text && a.text.trim())).length;
  const timerState: "normal" | "warning" | "critical" =
    secondsLeft === null ? "normal" : secondsLeft <= 10 ? "critical" : secondsLeft <= 60 ? "warning" : "normal";

  // --- RESULTS SCREEN ---
  if (submitted && submissionResult) {
    const hasWritten = submissionResult.hasWrittenQuestions;
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <div className="max-w-md w-full">
          <div className="w-20 h-20 rounded-full bg-green-500/10 border-2 border-green-500/30 flex items-center justify-center mx-auto mb-6 animate-in zoom-in duration-500">
            <CheckCircle2 className="w-10 h-10 text-green-500" />
          </div>
          <h2 className="text-3xl font-bold text-foreground mb-2">
            {submissionResult.timedOut ? (
              <span className="flex items-center justify-center gap-2"><Clock className="w-7 h-7 text-amber-500" /> {t("player.timesUp")}</span>
            ) : (
              <span className="flex items-center justify-center gap-2"><CheckCircle2 className="w-7 h-7 text-green-500" /> {t("player.submitted")}</span>
            )}
          </h2>
          <p className="text-muted-foreground mb-8">
            {submissionResult.timedOut ? t("player.autoSubmitted") : t("player.greatJob")}
          </p>

          {showGradeImmediately ? (
            <div className="bg-card border border-border rounded-xl p-6 space-y-4">
              <div className="flex justify-between items-center pb-4 border-b border-border">
                <span className="text-muted-foreground">{t("player.mcqScore")}</span>
                <span className="font-bold text-foreground">{submissionResult.mcqScore} / {submissionResult.totalMcqPoints}</span>
              </div>
              {hasWritten && (
                <div className="flex items-start gap-3 text-sm text-amber-700 dark:text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-md p-3">
                  <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>{t("player.writtenPending")}</span>
                </div>
              )}
              {!hasWritten && (
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground font-medium">{t("player.finalScore")}</span>
                  <span className={`text-2xl font-bold ${(submissionResult.mcqScore / submissionResult.totalMcqPoints) >= 0.6 ? "text-green-600" : "text-amber-600"}`}>
                    {submissionResult.mcqScore} / {submissionResult.totalMcqPoints}
                    <span className="text-base text-muted-foreground ms-1">
                      ({Math.round((submissionResult.mcqScore / submissionResult.totalMcqPoints) * 100)}%)
                    </span>
                  </span>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-card border border-border rounded-xl p-6 flex items-start gap-3 text-muted-foreground">
              <EyeOff className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span>{hasWritten ? t("player.writtenHidden") : t("player.resultsHidden")}</span>
            </div>
          )}

          <button
            onClick={() => router.back()}
            className="mt-6 px-6 py-3 bg-primary text-primary-foreground rounded-md font-medium hover:opacity-90 transition-opacity"
          >
            {t("player.backToCourse")}
          </button>
        </div>
      </div>
    );
  }

  // --- QUIZ PLAYER ---
  return (
    <div className="select-none" style={{ userSelect: "none", WebkitUserSelect: "none" }}>
      {/* Sticky timer header */}
      {secondsLeft !== null && (
        <div className={`sticky top-0 z-20 flex items-center justify-between px-6 py-3 border-b transition-all duration-700 ${
          timerState === "critical" ? "bg-red-500/10 border-red-500/20"
          : timerState === "warning" ? "bg-amber-500/10 border-amber-500/20"
          : "bg-card border-border"
        }`}>
          <div className={`flex items-center gap-2 font-mono font-bold text-xl transition-all duration-300 ${
            timerState === "critical" ? "text-red-500 animate-pulse scale-110"
            : timerState === "warning" ? "text-amber-500 animate-pulse"
            : "text-foreground"
          }`}>
            <Clock className={`w-5 h-5 ${
              timerState === "critical" ? "text-red-500"
              : timerState === "warning" ? "text-amber-500"
              : "text-muted-foreground"
            }`} />
            {formatTime(secondsLeft)}
          </div>
          <span className="text-sm text-muted-foreground">
            {answeredCount} / {questions.length} {t("player.answered")}
          </span>
          {timerState === "warning" && (
            <span className="flex items-center gap-1 text-xs text-amber-600 font-medium animate-pulse">
              <AlertTriangle className="w-3.5 h-3.5" /> {t("player.lastMinute")}
            </span>
          )}
          {timerState === "critical" && (
            <span className="flex items-center gap-1 text-xs text-red-500 font-semibold">
              <AlertCircle className="w-3.5 h-3.5" /> {t("player.hurryUp")}
            </span>
          )}
        </div>
      )}

      {/* Progress bar */}
      <div className="w-full h-1.5 bg-muted">
        <div
          className="h-full bg-primary transition-all duration-500"
          style={{ width: `${(answeredCount / questions.length) * 100}%` }}
        />
      </div>

      {/* Questions */}
      <div className="p-6 space-y-8 max-w-3xl mx-auto">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{quiz.title}</h1>
          {quiz.description && <p className="text-muted-foreground mt-1">{quiz.description}</p>}
          {quiz.time_limit_minutes && (
            <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {t("player.timeLimitNote").replace("{n}", String(quiz.time_limit_minutes))}
            </p>
          )}
        </div>

        {questions.map((q, i) => {
          const answer = answers[q.id] || {};
          const isAnswered = !!(answer.optionId || (answer.text && answer.text.trim()));

          return (
            <div
              key={q.id}
              className={`bg-card border rounded-xl p-6 transition-all duration-200 ${isAnswered ? "border-primary/30" : "border-border"}`}
            >
              <div className="flex items-start gap-3 mb-4">
                <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5 transition-colors ${isAnswered ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                  {i + 1}
                </span>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 ${q.question_type === "mcq" ? "bg-blue-500/10 text-blue-600" : "bg-purple-500/10 text-purple-600"}`}>
                      {q.question_type === "mcq" ? <CheckCircle2 className="w-3 h-3" /> : <PenLine className="w-3 h-3" />}
                      {t(q.question_type === "mcq" ? "quiz.multipleChoice" : "quiz.written")} · {q.points} {t("quiz.points").toLowerCase()}
                    </span>
                    {isAnswered && <CheckCircle2 className="w-4 h-4 text-primary" />}
                  </div>
                  {q.image_url && (
                    <img
                      src={q.image_url}
                      alt="question"
                      className="mb-3 max-h-48 rounded-lg object-contain border border-border pointer-events-none"
                      draggable={false}
                    />
                  )}
                  <p className="text-foreground font-medium text-base leading-relaxed">{q.question_text}</p>
                </div>
              </div>

              {q.question_type === "mcq" ? (
                <div className="space-y-2 ms-10">
                  {q.quiz_options.map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => handleOptionSelect(q.id, opt.id)}
                      className={`w-full text-left flex items-center gap-3 px-4 py-3 rounded-lg border transition-all duration-150 text-sm ${
                        answer.optionId === opt.id
                          ? "bg-primary/10 border-primary text-foreground font-medium"
                          : "bg-background border-border text-foreground hover:border-primary/50 hover:bg-muted/30"
                      }`}
                    >
                      <span className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${answer.optionId === opt.id ? "border-primary bg-primary" : "border-muted-foreground"}`}>
                        {answer.optionId === opt.id && <span className="w-2 h-2 rounded-full bg-white" />}
                      </span>
                      {opt.option_text}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="ms-10">
                  <textarea
                    value={answer.text || ""}
                    onChange={(e) => handleTextChange(q.id, e.target.value)}
                    placeholder={t("player.writeAnswer")}
                    rows={5}
                    className="w-full bg-background border border-border rounded-lg px-4 py-3 text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                  />
                  {answer.text && (
                    <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                      <Save className="w-3 h-3" /> {t("player.autoSaved")}
                    </p>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {/* Submit section */}
        <div className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="font-semibold text-foreground">{t("player.readyToSubmit")}</p>
              <p className="text-sm text-muted-foreground">{answeredCount} / {questions.length} {t("player.answered_of")}</p>
            </div>
            {answeredCount < questions.length && (
              <div className="flex items-center gap-1 text-amber-600 text-sm">
                <AlertTriangle className="w-4 h-4" />
                <span>{questions.length - answeredCount} {t("player.unanswered")}</span>
              </div>
            )}
          </div>
          <button
            onClick={() => handleSubmit(false)}
            disabled={isSubmitting}
            className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground py-3 rounded-lg font-semibold hover:opacity-90 transition-opacity disabled:opacity-60"
          >
            {isSubmitting ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> {t("player.submitting")}</>
            ) : (
              <><Send className="w-4 h-4" /> {t("player.submit")}</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
