"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  CheckCircle2, AlertTriangle, Send, Loader2,
  PenLine, Save, EyeOff, Info, AlertCircle,
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
interface InitialScore {
  mcqScore: number; finalScore: number | null;
  totalMcqPoints: number; totalPoints: number; hasWrittenQuestions: boolean;
}
interface Props {
  quiz: Quiz;
  questions: QuizQuestion[];
  submissionId: string;
  startedAt: string;
  existingAnswers: ExistingAnswer[];
  showGradeImmediately: boolean;
  initialStatus?: "in_progress" | "submitted" | "graded";
  initialScore?: InitialScore;
}

// ── Circular Timer FAB ────────────────────────────────────────────────────────
function CircularTimerFAB({
  secondsLeft,
  totalSeconds,
  state,
}: {
  secondsLeft: number;
  totalSeconds: number;
  state: "normal" | "warning" | "critical";
}) {
  const size = 72;
  const strokeWidth = 5;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.max(0, Math.min(1, secondsLeft / totalSeconds));
  const dashOffset = circumference * (1 - progress);

  const m = Math.floor(secondsLeft / 60);
  const s = secondsLeft % 60;
  const timeStr = `${m}:${s.toString().padStart(2, "0")}`;

  const trackColor =
    state === "critical" ? "#fca5a5"  // red-300
    : state === "warning" ? "#fcd34d"  // amber-300
    : "hsl(var(--muted))";

  const fillColor =
    state === "critical" ? "#ef4444"   // red-500
    : state === "warning" ? "#f59e0b"  // amber-500
    : "hsl(var(--primary))";

  const textColor =
    state === "critical" ? "text-red-500"
    : state === "warning" ? "text-amber-500"
    : "text-foreground";

  return (
    <div
      className={`fixed bottom-6 right-6 z-50 drop-shadow-xl transition-transform duration-200 ${
        state === "critical" ? "animate-bounce" : state === "warning" ? "scale-105" : ""
      }`}
    >
      <div
        className={`relative flex items-center justify-center rounded-full bg-card border-2 transition-colors duration-500 ${
          state === "critical" ? "border-red-500/40"
          : state === "warning" ? "border-amber-500/30"
          : "border-border"
        }`}
        style={{ width: size + 8, height: size + 8 }}
      >
        {/* SVG circle progress */}
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="absolute -rotate-90"
        >
          {/* Background track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={trackColor}
            strokeWidth={strokeWidth}
            opacity={0.3}
          />
          {/* Progress arc */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={fillColor}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            strokeLinecap="round"
            style={{ transition: "stroke-dashoffset 1s linear, stroke 0.5s ease" }}
          />
        </svg>

        {/* Time label */}
        <div className="relative flex flex-col items-center leading-none">
          <span className={`text-sm font-bold font-mono tabular-nums ${textColor}`}>
            {timeStr}
          </span>
          {state === "warning" && (
            <AlertTriangle className="w-3 h-3 text-amber-500 mt-0.5" />
          )}
          {state === "critical" && (
            <AlertCircle className="w-3 h-3 text-red-500 mt-0.5 animate-pulse" />
          )}
        </div>
      </div>
    </div>
  );
}

// ── Results Screen ────────────────────────────────────────────────────────────
function ResultsScreen({
  timedOut,
  mcqScore,
  totalMcqPoints,
  finalScore,
  hasWrittenQuestions,
  showGradeImmediately,
  onBack,
  t,
}: {
  timedOut: boolean;
  mcqScore: number;
  totalMcqPoints: number;
  finalScore: number | null;
  hasWrittenQuestions: boolean;
  showGradeImmediately: boolean;
  onBack: () => void;
  t: (k: string) => string;
}) {
  const displayScore = finalScore ?? mcqScore;
  const displayTotal = totalMcqPoints;
  const pct = displayTotal > 0 ? Math.round((displayScore / displayTotal) * 100) : 0;

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4 py-12">
      <div className="max-w-md w-full">
        <div className="w-20 h-20 rounded-full bg-green-500/10 border-2 border-green-500/30 flex items-center justify-center mx-auto mb-6 animate-in zoom-in duration-500">
          <CheckCircle2 className="w-10 h-10 text-green-500" />
        </div>
        <h2 className="text-3xl font-bold text-foreground mb-2 flex items-center justify-center gap-2">
          {timedOut
            ? <><AlertCircle className="w-7 h-7 text-amber-500" /> {t("player.timesUp")}</>
            : <><CheckCircle2 className="w-7 h-7 text-green-500" /> {t("player.submitted")}</>
          }
        </h2>
        <p className="text-muted-foreground mb-8">
          {timedOut ? t("player.autoSubmitted") : t("player.greatJob")}
        </p>

        {showGradeImmediately ? (
          <div className="bg-card border border-border rounded-xl p-6 space-y-4">
            <div className="flex justify-between items-center pb-4 border-b border-border">
              <span className="text-muted-foreground">{t("player.mcqScore")}</span>
              <span className="font-bold text-foreground">{mcqScore} / {totalMcqPoints}</span>
            </div>
            {hasWrittenQuestions && (
              <div className="flex items-start gap-3 text-sm text-amber-700 dark:text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-md p-3">
                <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{t("player.writtenPending")}</span>
              </div>
            )}
            {!hasWrittenQuestions && (
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground font-medium">{t("player.finalScore")}</span>
                <div className="text-right">
                  <span className={`text-2xl font-bold ${pct >= 60 ? "text-green-600" : "text-amber-600"}`}>
                    {displayScore} / {displayTotal}
                  </span>
                  <p className="text-sm text-muted-foreground">{pct}%</p>
                  <div className="w-32 h-2 bg-muted rounded-full mt-1 ms-auto">
                    <div
                      className={`h-full rounded-full ${pct >= 60 ? "bg-green-500" : "bg-amber-500"}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-card border border-border rounded-xl p-6 flex items-start gap-3 text-muted-foreground">
            <EyeOff className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <span>{hasWrittenQuestions ? t("player.writtenHidden") : t("player.resultsHidden")}</span>
          </div>
        )}

        <button
          onClick={onBack}
          className="mt-6 px-6 py-3 bg-primary text-primary-foreground rounded-md font-medium hover:opacity-90 transition-opacity"
        >
          {t("player.backToCourse")}
        </button>
      </div>
    </div>
  );
}

// ── Quiz Player ───────────────────────────────────────────────────────────────
export default function QuizPlayer({
  quiz, questions, submissionId, startedAt, existingAnswers,
  showGradeImmediately, initialStatus, initialScore,
}: Props) {
  const router = useRouter();
  const { t } = useLang();

  // If already finished, show results immediately
  const isAlreadyDone = initialStatus === "submitted" || initialStatus === "graded";

  const [answers, setAnswers] = useState<Record<string, { optionId?: string; text?: string }>>(() => {
    const init: Record<string, { optionId?: string; text?: string }> = {};
    existingAnswers.forEach((a) => {
      init[a.question_id] = {
        optionId: a.selected_option_id || undefined,
        text: a.text_answer || undefined,
      };
    });
    return init;
  });

  const totalSeconds = quiz.time_limit_minutes ? quiz.time_limit_minutes * 60 : 0;
  const [secondsLeft, setSecondsLeft] = useState<number | null>(() => {
    if (!quiz.time_limit_minutes || isAlreadyDone) return null;
    const elapsed = Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000);
    return Math.max(0, quiz.time_limit_minutes * 60 - elapsed);
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(isAlreadyDone);
  const [submissionResult, setSubmissionResult] = useState<{
    timedOut: boolean; mcqScore: number; totalMcqPoints: number;
    finalScore: number | null; hasWrittenQuestions: boolean;
  } | null>(
    isAlreadyDone && initialScore
      ? {
          timedOut: false,
          mcqScore: initialScore.mcqScore,
          totalMcqPoints: initialScore.totalMcqPoints,
          finalScore: initialScore.finalScore,
          hasWrittenQuestions: initialScore.hasWrittenQuestions,
        }
      : null
  );

  const saveTimeouts = useRef<Record<string, NodeJS.Timeout>>({});
  const timerInterval = useRef<NodeJS.Timeout | null>(null);
  const hasAutoSubmitted = useRef(false);

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
    timerInterval.current = setTimeout(
      () => setSecondsLeft((s) => (s !== null ? s - 1 : null)),
      1000
    );
    return () => { if (timerInterval.current) clearTimeout(timerInterval.current); };
  }, [secondsLeft]);

  // Anti-copy protection
  useEffect(() => {
    if (isAlreadyDone || submitted) return;
    const prevent = (e: Event) => e.preventDefault();
    const preventKeyboard = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && ["c", "a", "u", "s"].includes(e.key.toLowerCase()))
        e.preventDefault();
    };
    document.addEventListener("copy", prevent);
    document.addEventListener("contextmenu", prevent);
    document.addEventListener("keydown", preventKeyboard);
    return () => {
      document.removeEventListener("copy", prevent);
      document.removeEventListener("contextmenu", prevent);
      document.removeEventListener("keydown", preventKeyboard);
    };
  }, [isAlreadyDone, submitted]);

  const autoSave = useCallback(
    (questionId: string, optionId?: string, text?: string) => {
      if (saveTimeouts.current[questionId]) clearTimeout(saveTimeouts.current[questionId]);
      saveTimeouts.current[questionId] = setTimeout(async () => {
        try {
          await saveQuizAnswer(submissionId, questionId, optionId || null, text || null);
        } catch { }
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
    if (isSubmitting || submitted) return;
    setIsSubmitting(true);
    Object.values(saveTimeouts.current).forEach((t) => clearTimeout(t));
    for (const [qId, ans] of Object.entries(answers)) {
      await saveQuizAnswer(submissionId, qId, ans.optionId || null, ans.text || null).catch(() => { });
    }
    try {
      const result = await submitQuiz(submissionId, quiz.id, timedOut);
      setSubmissionResult({
        timedOut,
        mcqScore: result.mcqScore,
        totalMcqPoints: result.totalMcqPoints,
        finalScore: result.hasWrittenQuestions ? null : result.mcqScore,
        hasWrittenQuestions: result.hasWrittenQuestions,
      });
      setSubmitted(true);
      if (timerInterval.current) clearTimeout(timerInterval.current);
    } catch (e: any) {
      toast.error(e.message);
      setIsSubmitting(false);
    }
  };

  const timerState: "normal" | "warning" | "critical" =
    secondsLeft === null ? "normal"
    : secondsLeft <= 10 ? "critical"
    : secondsLeft <= 60 ? "warning"
    : "normal";

  const answeredCount = Object.values(answers).filter(
    (a) => a.optionId || (a.text && a.text.trim())
  ).length;

  // ── Results ────────────────────────────────────────────────────────────────
  if (submitted && submissionResult) {
    return (
      <ResultsScreen
        timedOut={submissionResult.timedOut}
        mcqScore={submissionResult.mcqScore}
        totalMcqPoints={submissionResult.totalMcqPoints}
        finalScore={submissionResult.finalScore}
        hasWrittenQuestions={submissionResult.hasWrittenQuestions}
        showGradeImmediately={showGradeImmediately}
        onBack={() => router.back()}
        t={t}
      />
    );
  }

  // ── Quiz Form ───────────────────────────────────────────────────────────────
  return (
    <div className="select-none relative" style={{ userSelect: "none", WebkitUserSelect: "none" }}>
      {/* Floating Circular Timer */}
      {secondsLeft !== null && !submitted && (
        <CircularTimerFAB
          secondsLeft={secondsLeft}
          totalSeconds={totalSeconds}
          state={timerState}
        />
      )}

      {/* Progress bar */}
      <div className="w-full h-1.5 bg-muted sticky top-[57px] z-20">
        <div
          className="h-full bg-primary transition-all duration-500"
          style={{ width: `${questions.length > 0 ? (answeredCount / questions.length) * 100 : 0}%` }}
        />
      </div>

      {/* Questions */}
      <div className="p-6 space-y-8 max-w-3xl mx-auto pb-40">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{quiz.title}</h1>
          {quiz.description && <p className="text-muted-foreground mt-1">{quiz.description}</p>}
          <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
            <span>{answeredCount} / {questions.length} {t("player.answered")}</span>
            {quiz.time_limit_minutes && (
              <span className={`font-medium ${timerState === "critical" ? "text-red-500" : timerState === "warning" ? "text-amber-500" : ""}`}>
                {timerState === "warning" && <><AlertTriangle className="inline w-3.5 h-3.5 me-1" />{t("player.lastMinute")}</>}
                {timerState === "critical" && <><AlertCircle className="inline w-3.5 h-3.5 me-1" />{t("player.hurryUp")}</>}
              </span>
            )}
          </div>
        </div>

        {questions.map((q, i) => {
          const answer = answers[q.id] || {};
          const isAnswered = !!(answer.optionId || (answer.text && answer.text.trim()));

          return (
            <div
              key={q.id}
              className={`bg-card border rounded-xl p-6 transition-all duration-200 ${
                isAnswered ? "border-primary/30 shadow-sm" : "border-border"
              }`}
            >
              <div className="flex items-start gap-3 mb-4">
                <span
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5 transition-colors ${
                    isAnswered ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                  }`}
                >
                  {i + 1}
                </span>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span
                      className={`text-xs font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                        q.question_type === "mcq"
                          ? "bg-blue-500/10 text-blue-600"
                          : "bg-purple-500/10 text-purple-600"
                      }`}
                    >
                      {q.question_type === "mcq"
                        ? <CheckCircle2 className="w-3 h-3" />
                        : <PenLine className="w-3 h-3" />}
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
                  <p className="text-foreground font-medium text-base leading-relaxed">
                    {q.question_text}
                  </p>
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
                      <span
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                          answer.optionId === opt.id
                            ? "border-primary bg-primary"
                            : "border-muted-foreground"
                        }`}
                      >
                        {answer.optionId === opt.id && (
                          <span className="w-2 h-2 rounded-full bg-white" />
                        )}
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

        {/* Submit */}
        <div className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="font-semibold text-foreground">{t("player.readyToSubmit")}</p>
              <p className="text-sm text-muted-foreground">
                {answeredCount} / {questions.length} {t("player.answered_of")}
              </p>
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
