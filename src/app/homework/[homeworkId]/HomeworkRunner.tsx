"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, RotateCcw, XCircle } from "lucide-react";
import { toast } from "sonner";
import { submitHomework, type HomeworkResultItem } from "../actions";

export interface RunnerQuestion {
  question: string;
  options: string[];
}

interface Summary {
  score: number;
  total: number;
  results: HomeworkResultItem[];
}

export default function HomeworkRunner({
  homeworkId,
  title,
  source,
  questions,
  last,
}: {
  homeworkId: string;
  title: string;
  source: string | null;
  questions: RunnerQuestion[];
  last: Summary | null;
}) {
  const [isPending, startTransition] = useTransition();
  const [summary, setSummary] = useState<Summary | null>(last);
  const [answers, setAnswers] = useState<(number | null)[]>(() => questions.map(() => null));

  const answered = answers.filter((a) => a !== null).length;

  function choose(qi: number, oi: number) {
    setAnswers((prev) => prev.map((a, i) => (i === qi ? oi : a)));
  }

  function submit() {
    startTransition(async () => {
      const res = await submitHomework(homeworkId, answers);
      if (res.success && res.result) {
        setSummary(res.result);
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        toast.error(res.error ?? "Could not submit — please try again", { duration: 8000 });
      }
    });
  }

  function retry() {
    setAnswers(questions.map(() => null));
    setSummary(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const header = (
    <div className="mb-6">
      <Link href="/homework" className="inline-flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-foreground mb-3">
        <ArrowLeft className="w-4 h-4" />
        All homework
      </Link>
      <h1 className="text-2xl sm:text-3xl font-bold text-foreground">{title}</h1>
      {source && <p className="text-sm text-muted-foreground mt-1">{source}</p>}
    </div>
  );

  // ── Results / review ──────────────────────────────────────
  if (summary) {
    const pct = summary.total ? Math.round((summary.score / summary.total) * 100) : 0;
    return (
      <div className="max-w-3xl mx-auto">
        {header}

        <div className="clean-panel rounded-xl p-6 mb-6">
          <p className="text-xs font-bold text-muted-foreground uppercase">Your score</p>
          <p className="text-4xl font-bold text-foreground mt-1">
            {summary.score}
            <span className="text-xl text-muted-foreground"> / {summary.total}</span>
            <span className="ml-3 text-xl font-semibold text-primary">{pct}%</span>
          </p>
          <div className="mt-4 h-2.5 rounded-full bg-muted overflow-hidden">
            <div className={`h-full rounded-full ${pct >= 70 ? "bg-emerald-500" : pct >= 50 ? "bg-amber-500" : "bg-rose-500"}`} style={{ width: `${pct}%` }} />
          </div>
          <button
            type="button"
            onClick={retry}
            className="mt-5 inline-flex items-center gap-2 rounded-lg bg-primary text-primary-foreground text-sm font-bold px-5 py-2.5 hover:opacity-90"
          >
            <RotateCcw className="w-4 h-4" />
            Try again
          </button>
        </div>

        <ol className="space-y-4">
          {questions.map((q, qi) => {
            const r = summary.results[qi];
            if (!r) return null;
            return (
              <li key={qi} className="clean-panel rounded-xl p-4 sm:p-5">
                <div className="flex items-start gap-3">
                  {r.is_correct ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="w-5 h-5 text-rose-500 flex-shrink-0 mt-0.5" />
                  )}
                  <p className="font-semibold text-foreground whitespace-pre-wrap">
                    {qi + 1}. {q.question}
                  </p>
                </div>
                <ul className="mt-3 space-y-2">
                  {q.options.map((o, oi) => {
                    const isCorrect = oi === r.correct_index;
                    const isPicked = oi === r.selected;
                    return (
                      <li
                        key={oi}
                        className={`rounded-lg border px-3 py-2.5 text-sm flex gap-2 ${
                          isCorrect
                            ? "border-emerald-500/40 bg-emerald-500/10 text-foreground"
                            : isPicked
                            ? "border-rose-500/40 bg-rose-500/10 text-foreground"
                            : "border-border text-muted-foreground"
                        }`}
                      >
                        <span className="font-bold">{String.fromCharCode(65 + oi)}.</span>
                        <span className="whitespace-pre-wrap">{o}</span>
                        {isCorrect && <span className="ml-auto text-xs font-bold text-emerald-600 whitespace-nowrap">Correct</span>}
                        {isPicked && !isCorrect && <span className="ml-auto text-xs font-bold text-rose-600 whitespace-nowrap">Your answer</span>}
                      </li>
                    );
                  })}
                </ul>
                {r.selected === null && <p className="mt-2 text-xs font-semibold text-rose-600">You skipped this question.</p>}
                {r.explanation && (
                  <p className="mt-3 text-sm text-muted-foreground bg-muted/40 rounded-lg px-3 py-2">
                    <span className="font-bold text-foreground">Why: </span>
                    {r.explanation}
                  </p>
                )}
              </li>
            );
          })}
        </ol>
      </div>
    );
  }

  // ── Taking the homework ───────────────────────────────────
  return (
    <div className="max-w-3xl mx-auto">
      {header}

      <div className="sticky top-0 z-30 -mx-4 sm:mx-0 px-4 sm:px-0 py-3 bg-background/90 backdrop-blur border-b border-border mb-5">
        <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground mb-1.5">
          <span>
            Answered {answered} / {questions.length}
          </span>
          <span>{questions.length ? Math.round((answered / questions.length) * 100) : 0}%</span>
        </div>
        <div className="h-2 rounded-full bg-muted overflow-hidden">
          <div className="h-full bg-primary transition-all" style={{ width: `${questions.length ? (answered / questions.length) * 100 : 0}%` }} />
        </div>
      </div>

      <ol className="space-y-4">
        {questions.map((q, qi) => (
          <li key={qi} className="clean-panel rounded-xl p-4 sm:p-5">
            <p className="font-semibold text-foreground whitespace-pre-wrap">
              {qi + 1}. {q.question}
            </p>
            <div className="mt-3 space-y-2" role="radiogroup" aria-label={`Question ${qi + 1}`}>
              {q.options.map((o, oi) => {
                const picked = answers[qi] === oi;
                return (
                  <button
                    key={oi}
                    type="button"
                    role="radio"
                    aria-checked={picked}
                    onClick={() => choose(qi, oi)}
                    className={`w-full text-left rounded-lg border px-3 py-3 text-sm flex gap-2.5 transition-colors ${
                      picked ? "border-primary bg-primary/10 text-foreground" : "border-border text-foreground hover:border-primary/50 hover:bg-muted/40"
                    }`}
                  >
                    <span
                      className={`w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold ${
                        picked ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {String.fromCharCode(65 + oi)}
                    </span>
                    <span className="whitespace-pre-wrap pt-0.5">{o}</span>
                  </button>
                );
              })}
            </div>
          </li>
        ))}
      </ol>

      <div className="mt-6">
        <button
          type="button"
          onClick={submit}
          disabled={isPending || answered === 0}
          className="w-full rounded-xl bg-primary text-primary-foreground font-bold py-3 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPending ? "Checking…" : "Submit homework"}
        </button>
        {answered < questions.length && answered > 0 && (
          <p className="text-xs text-muted-foreground text-center mt-2">
            {questions.length - answered} unanswered {questions.length - answered === 1 ? "question counts" : "questions count"} as wrong.
          </p>
        )}
      </div>
    </div>
  );
}
