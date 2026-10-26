"use client";

import { useMemo, useState, useTransition } from "react";
import { BarChart2, ChevronDown, ChevronRight, Copy, Eye, EyeOff, NotebookPen, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { buildHomeworkPrompt, parseHomeworkJson, type Difficulty } from "@/lib/homework";
import { confirmToast } from "@/app/manage/payments/confirmToast";
import { deleteHomework, importHomework, setHomeworkPublished } from "./actions";

export interface AdminHomework {
  id: string;
  title: string;
  source: string | null;
  question_count: number;
  is_published: boolean;
  due_date: string | null;
  created_at: string;
}

export interface AdminSubmission {
  homework_id: string;
  student_id: string;
  student_name: string;
  score: number;
  total: number;
  submitted_at: string;
}

const DIFFICULTIES: { id: Difficulty; label: string }[] = [
  { id: "easy", label: "Easy" },
  { id: "mixed", label: "Mixed" },
  { id: "hard", label: "Hard" },
];

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Fallback for browsers that block the async clipboard API
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(ta);
    return ok;
  }
}

export default function HomeworkAdminClient({
  homeworks,
  submissions,
  available,
}: {
  homeworks: AdminHomework[];
  submissions: AdminSubmission[];
  available: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const [count, setCount] = useState("10");
  const [difficulty, setDifficulty] = useState<Difficulty>("mixed");
  const [showPrompt, setShowPrompt] = useState(false);
  const [raw, setRaw] = useState("");
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [published, setPublished] = useState(true);
  const [open, setOpen] = useState<Set<string>>(new Set());

  const prompt = useMemo(() => buildHomeworkPrompt({ count: Number(count), difficulty }), [count, difficulty]);
  const parsed = useMemo(() => (raw.trim() ? parseHomeworkJson(raw) : null), [raw]);

  async function copyPrompt() {
    const ok = await copyText(prompt);
    if (ok) toast.success("Prompt copied — paste it into Claude, then add the lesson text below it");
    else toast.error("Couldn’t copy automatically — open “Show prompt” and copy it by hand");
  }

  function doImport() {
    startTransition(async () => {
      const result = await importHomework({ raw, title, dueDate: dueDate || null, published });
      if (result.success) {
        toast.success(published ? "Homework imported and visible to students" : "Homework imported as hidden");
        setRaw("");
        setTitle("");
        setDueDate("");
      } else {
        toast.error(result.error ?? "Import failed", { duration: 9000 });
      }
    });
  }

  function togglePublished(h: AdminHomework) {
    startTransition(async () => {
      const result = await setHomeworkPublished(h.id, !h.is_published);
      if (result.success) toast.success(h.is_published ? "Hidden from students" : "Now visible to students");
      else toast.error(result.error ?? "Could not update", { duration: 8000 });
    });
  }

  function remove(h: AdminHomework) {
    confirmToast({
      id: `confirm-del-hw-${h.id}`,
      title: `Delete “${h.title}”?`,
      description: "This also deletes every student’s result for it.",
      onConfirm: () =>
        startTransition(async () => {
          const result = await deleteHomework(h.id);
          if (result.success) toast.success("Homework deleted");
          else toast.error(result.error ?? "Could not delete", { duration: 8000 });
        }),
    });
  }

  function toggleOpen(id: string) {
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  // Best attempt per student, per homework
  function resultsFor(homeworkId: string) {
    const byStudent = new Map<string, { name: string; best: AdminSubmission; attempts: number; last: string }>();
    submissions
      .filter((s) => s.homework_id === homeworkId)
      .forEach((s) => {
        const cur = byStudent.get(s.student_id);
        const pct = s.total ? s.score / s.total : 0;
        if (!cur) byStudent.set(s.student_id, { name: s.student_name, best: s, attempts: 1, last: s.submitted_at });
        else {
          cur.attempts += 1;
          if (pct > (cur.best.total ? cur.best.score / cur.best.total : 0)) cur.best = s;
          if (s.submitted_at > cur.last) cur.last = s.submitted_at;
        }
      });
    return [...byStudent.values()].sort((a, b) => a.name.localeCompare(b.name));
  }

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="clean-panel p-5 rounded-xl flex items-center gap-3">
        <div className="p-3 bg-primary/10 text-primary rounded-xl">
          <NotebookPen className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">Homework</h1>
          <p className="text-xs text-muted-foreground">
            Generate MCQs with Claude, paste the JSON, and students get an auto-graded homework.
          </p>
        </div>
      </div>

      {!available && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-700">
          The homework tables don’t exist yet. Run <code className="font-mono text-xs">20261026_homework.sql</code> in the
          Supabase SQL Editor, then refresh.
        </div>
      )}

      {/* Step 1: prompt */}
      <div className="clean-panel rounded-xl p-5 shadow-sm space-y-4">
        <div>
          <h2 className="font-bold text-foreground">1. Copy the prompt for Claude</h2>
          <p className="text-xs text-muted-foreground">
            Paste it into Claude, then put the textbook lesson (text or attached pages) under it.
          </p>
        </div>
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label className="block text-xs font-bold text-muted-foreground mb-1.5">Questions</label>
            <input
              type="number"
              min={1}
              max={100}
              value={count}
              onChange={(e) => setCount(e.target.value)}
              className="w-24 bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-muted-foreground mb-1.5">Difficulty</label>
            <div className="flex gap-1 bg-muted/50 p-1 rounded-lg border border-border">
              {DIFFICULTIES.map((d) => (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => setDifficulty(d.id)}
                  className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                    difficulty === d.id ? "bg-card text-foreground shadow-sm border border-border" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>
          <button
            type="button"
            onClick={copyPrompt}
            className="inline-flex items-center gap-2 rounded-lg bg-primary text-primary-foreground text-sm font-bold px-5 py-2.5 hover:opacity-90"
          >
            <Copy className="w-4 h-4" />
            Copy prompt
          </button>
          <button
            type="button"
            onClick={() => setShowPrompt((v) => !v)}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-foreground py-2.5"
          >
            {showPrompt ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            {showPrompt ? "Hide prompt" : "Show prompt"}
          </button>
        </div>
        {showPrompt && (
          <pre className="max-h-72 overflow-auto rounded-lg border border-border bg-muted/30 p-3 text-xs text-foreground whitespace-pre-wrap">
            {prompt}
          </pre>
        )}
      </div>

      {/* Step 2: import */}
      <div className="clean-panel rounded-xl p-5 shadow-sm space-y-4">
        <div>
          <h2 className="font-bold text-foreground">2. Paste Claude’s JSON</h2>
          <p className="text-xs text-muted-foreground">It’s checked as you paste. Nothing is saved until you click Import.</p>
        </div>
        <textarea
          value={raw}
          onChange={(e) => setRaw(e.target.value)}
          rows={8}
          spellCheck={false}
          placeholder='{ "title": "...", "questions": [ ... ] }'
          className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
        />

        {parsed && !parsed.ok && (
          <ul className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-700 space-y-1">
            {parsed.errors.map((e, i) => (
              <li key={i}>• {e}</li>
            ))}
          </ul>
        )}

        {parsed && parsed.ok && (
          <div className="space-y-3">
            <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-700">
              ✓ Valid — <span className="font-bold">{parsed.data.questions.length} questions</span>
              {parsed.data.title ? ` · “${parsed.data.title}”` : ""}
            </div>
            {parsed.warnings.length > 0 && (
              <ul className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-700 space-y-1">
                {parsed.warnings.map((w, i) => (
                  <li key={i}>• {w}</li>
                ))}
              </ul>
            )}
            <details className="rounded-lg border border-border bg-muted/20">
              <summary className="cursor-pointer px-3 py-2 text-sm font-semibold text-foreground">Preview questions</summary>
              <ol className="px-4 pb-3 space-y-3 text-sm">
                {parsed.data.questions.map((q, i) => (
                  <li key={i}>
                    <p className="font-semibold text-foreground whitespace-pre-wrap">
                      {i + 1}. {q.question}
                    </p>
                    <ul className="mt-1 space-y-0.5">
                      {q.options.map((o, oi) => (
                        <li key={oi} className={oi === q.correct_index ? "text-emerald-600 font-semibold" : "text-muted-foreground"}>
                          {String.fromCharCode(65 + oi)}. {o}
                          {oi === q.correct_index && " ✓"}
                        </li>
                      ))}
                    </ul>
                  </li>
                ))}
              </ol>
            </details>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-muted-foreground mb-1.5">Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={parsed.data.title || "Homework title"}
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-muted-foreground mb-1.5">Due date (optional)</label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
              <input type="checkbox" checked={published} onChange={(e) => setPublished(e.target.checked)} className="w-4 h-4 accent-primary" />
              Show to students immediately
            </label>
            <button
              type="button"
              onClick={doImport}
              disabled={isPending || (!title.trim() && !parsed.data.title)}
              className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-primary text-primary-foreground text-sm font-bold py-2.5 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Upload className="w-4 h-4" />
              {isPending ? "Importing…" : `Import ${parsed.data.questions.length} questions`}
            </button>
          </div>
        )}
      </div>

      {/* Existing homework */}
      <div className="clean-panel rounded-xl overflow-hidden shadow-sm">
        <div className="px-5 py-3 border-b border-border bg-muted/50">
          <h2 className="font-bold text-sm text-foreground">Your homework ({homeworks.length})</h2>
        </div>
        {homeworks.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-muted-foreground">No homework yet — import your first one above.</p>
        ) : (
          <ul className="divide-y divide-border bg-card">
            {homeworks.map((h) => {
              const rows = resultsFor(h.id);
              const avg = rows.length
                ? Math.round((rows.reduce((s, r) => s + (r.best.total ? r.best.score / r.best.total : 0), 0) / rows.length) * 100)
                : null;
              const isOpen = open.has(h.id);
              return (
                <li key={h.id} className="p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold text-foreground">{h.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {h.question_count} questions
                        {h.source ? ` · ${h.source}` : ""}
                        {h.due_date ? ` · due ${h.due_date}` : ""}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        type="button"
                        onClick={() => toggleOpen(h.id)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold bg-muted text-muted-foreground hover:text-foreground"
                      >
                        {isOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                        <BarChart2 className="w-3.5 h-3.5" />
                        {rows.length} done{avg !== null ? ` · avg ${avg}%` : ""}
                      </button>
                      <button
                        type="button"
                        disabled={isPending}
                        onClick={() => togglePublished(h)}
                        className={`px-3 py-1.5 rounded-md text-xs font-bold border disabled:opacity-60 ${
                          h.is_published
                            ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                            : "bg-muted text-muted-foreground border-border"
                        }`}
                      >
                        {h.is_published ? "Visible" : "Hidden"}
                      </button>
                      <button
                        type="button"
                        disabled={isPending}
                        onClick={() => remove(h)}
                        aria-label="Delete homework"
                        className="p-1.5 text-muted-foreground hover:text-red-600 hover:bg-red-500/10 rounded-md disabled:opacity-60"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {isOpen && (
                    <div className="mt-3 overflow-x-auto rounded-lg border border-border">
                      <table className="w-full text-left text-sm">
                        <thead className="bg-muted/40 border-b border-border">
                          <tr>
                            <th className="px-3 py-2 font-semibold text-muted-foreground">Student</th>
                            <th className="px-3 py-2 font-semibold text-muted-foreground">Best score</th>
                            <th className="px-3 py-2 font-semibold text-muted-foreground">Attempts</th>
                            <th className="px-3 py-2 font-semibold text-muted-foreground">Last attempt</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {rows.length === 0 && (
                            <tr>
                              <td colSpan={4} className="px-3 py-6 text-center text-muted-foreground">
                                Nobody has submitted yet.
                              </td>
                            </tr>
                          )}
                          {rows.map((r) => (
                            <tr key={r.best.student_id}>
                              <td className="px-3 py-2 font-medium text-foreground">{r.name}</td>
                              <td className="px-3 py-2 font-mono text-foreground">
                                {r.best.score}/{r.best.total}{" "}
                                <span className="text-muted-foreground">({r.best.total ? Math.round((r.best.score / r.best.total) * 100) : 0}%)</span>
                              </td>
                              <td className="px-3 py-2 text-muted-foreground">{r.attempts}</td>
                              <td className="px-3 py-2 text-xs text-muted-foreground whitespace-nowrap">
                                {new Date(r.last).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
