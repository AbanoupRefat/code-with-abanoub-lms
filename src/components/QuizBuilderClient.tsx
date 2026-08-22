"use client";

import { useState, useTransition } from "react";
import {
  Plus, Trash2, CheckSquare, FileText, Image, Clock, Award, Hash,
  FileJson, ChevronDown, ChevronUp, Copy, Check, Upload, AlertCircle, Loader2,
} from "lucide-react";
import Modal from "@/components/Modal";
import { toast } from "sonner";
import { createQuizQuestion, deleteQuizQuestion, importQuestionsFromJson } from "@/app/manage/actions";
import { useLang } from "@/components/LangContext";

interface QuizOption { id: string; option_text: string; is_correct: boolean; }
interface QuizQuestion {
  id: string; question_text: string; question_type: "mcq" | "written";
  image_url: string | null; points: number; order_index: number;
  quiz_options: QuizOption[];
}
interface Quiz {
  id: string; title: string; description: string | null;
  time_limit_minutes: number | null; show_grade_immediately: boolean;
  quiz_questions: QuizQuestion[];
}

// ── The canonical JSON schema prompt ─────────────────────────────────────────
const JSON_PROMPT = `You are a quiz question generator. Generate questions in the following JSON format ONLY.
Return a JSON array (or an object with a "questions" key) with this exact structure:

[
  {
    "question_text": "What is 2 + 2?",
    "question_type": "mcq",
    "points": 1,
    "image_url": null,
    "options": ["2", "3", "4", "5"],
    "correct_index": 2
  },
  {
    "question_text": "Explain the concept of recursion in programming.",
    "question_type": "written",
    "points": 5,
    "image_url": null
  }
]

RULES:
- "question_type" must be either "mcq" or "written"
- For "mcq" questions: include "options" (array of strings, min 2) and "correct_index" (0-based index of the correct answer)
- For "written" questions: omit "options" and "correct_index"
- "points" must be a number (integer, e.g. 1, 2, 5)
- "image_url" is optional — set to null if no image
- Do NOT include any explanation or markdown outside the JSON array
- Return ONLY valid JSON`;

// ── Example JSON shown in the import panel ────────────────────────────────────
const EXAMPLE_JSON = `[
  {
    "question_text": "What is the capital of France?",
    "question_type": "mcq",
    "points": 1,
    "image_url": null,
    "options": ["Berlin", "Madrid", "Paris", "Rome"],
    "correct_index": 2
  },
  {
    "question_text": "What is the time complexity of binary search?",
    "question_type": "mcq",
    "points": 2,
    "image_url": null,
    "options": ["O(n)", "O(log n)", "O(n²)", "O(1)"],
    "correct_index": 1
  },
  {
    "question_text": "Describe the difference between SQL and NoSQL databases.",
    "question_type": "written",
    "points": 5,
    "image_url": null
  }
]`;

export default function QuizBuilderClient({ quiz, courseId }: { quiz: Quiz; courseId: string }) {
  const { t } = useLang();
  const [questions, setQuestions] = useState<QuizQuestion[]>(
    quiz.quiz_questions.slice().sort((a, b) => a.order_index - b.order_index)
  );

  // Add question modal state
  const [isAdding, setIsAdding] = useState(false);
  const [questionType, setQuestionType] = useState<"mcq" | "written">("mcq");
  const [mcqOptions, setMcqOptions] = useState(["", "", "", ""]);
  const [correctIndex, setCorrectIndex] = useState(0);
  const [imageUrl, setImageUrl] = useState("");

  // JSON import panel state
  const [showImport, setShowImport] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);
  const [jsonInput, setJsonInput] = useState("");
  const [promptCopied, setPromptCopied] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [isImporting, setIsImporting] = useState(false);

  const handleAdd = async (formData: FormData) => {
    formData.set("options", JSON.stringify(mcqOptions.filter((o) => o.trim())));
    formData.set("correct_index", String(correctIndex));
    formData.set("question_type", questionType);
    formData.set("order_index", String(questions.length + 1));
    if (imageUrl) formData.set("image_url", imageUrl);

    startTransition(async () => {
      try {
        await createQuizQuestion(quiz.id, courseId, formData);
        toast.success(t("quiz.addQuestion"));
        setIsAdding(false);
        setMcqOptions(["", "", "", ""]);
        setCorrectIndex(0);
        setImageUrl("");
        window.location.reload();
      } catch (e: any) {
        toast.error(e.message);
      }
    });
  };

  const handleDelete = async (questionId: string) => {
    if (!confirm(t("quiz.delete") + "?")) return;
    startTransition(async () => {
      try {
        await deleteQuizQuestion(questionId, quiz.id, courseId);
        setQuestions((q) => q.filter((x) => x.id !== questionId));
        toast.success(t("quiz.delete"));
      } catch (e: any) {
        toast.error(e.message);
      }
    });
  };

  const handleImport = async () => {
    if (!jsonInput.trim()) { toast.error("Please paste your JSON first."); return; }
    setIsImporting(true);
    try {
      const result = await importQuestionsFromJson(quiz.id, courseId, jsonInput);
      toast.success(`${result.imported} question${result.imported !== 1 ? "s" : ""} imported successfully!`);
      setJsonInput("");
      setShowImport(false);
      window.location.reload();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setIsImporting(false);
    }
  };

  const handleCopyPrompt = async () => {
    await navigator.clipboard.writeText(JSON_PROMPT);
    setPromptCopied(true);
    toast.success("Prompt copied to clipboard!");
    setTimeout(() => setPromptCopied(false), 2500);
  };

  const totalPoints = questions.reduce((sum, q) => sum + q.points, 0);

  return (
    <div className="space-y-6">
      {/* Stats bar */}
      <div className="flex flex-wrap gap-4 p-4 bg-muted/30 rounded-lg border border-border">
        {[
          { icon: <Hash className="w-4 h-4" />, value: questions.length, label: t("quiz.questions") },
          { icon: <Award className="w-4 h-4" />, value: totalPoints, label: t("quiz.totalPoints") },
          { icon: <Clock className="w-4 h-4" />, value: quiz.time_limit_minutes ?? "∞", label: t("quiz.minutes") },
          { icon: <CheckSquare className="w-4 h-4" />, value: questions.filter((q) => q.question_type === "mcq").length, label: t("quiz.mcq") },
          { icon: <FileText className="w-4 h-4" />, value: questions.filter((q) => q.question_type === "written").length, label: t("quiz.written") },
        ].map((stat, i) => (
          <div key={i} className="text-center min-w-[80px]">
            <div className="flex items-center justify-center gap-1 text-muted-foreground mb-0.5">{stat.icon}</div>
            <p className="text-2xl font-bold text-foreground">{stat.value}</p>
            <p className="text-xs text-muted-foreground uppercase tracking-wider">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* ── JSON Import Panel ─────────────────────────────────────────────── */}
      <div className="rounded-xl border border-primary/30 bg-primary/5 overflow-hidden">
        <button
          onClick={() => setShowImport(!showImport)}
          className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-primary/10 transition-colors"
        >
          <div className="flex items-center gap-3">
            <FileJson className="w-5 h-5 text-primary" />
            <div>
              <p className="font-semibold text-foreground">Import Questions from JSON</p>
              <p className="text-xs text-muted-foreground mt-0.5">استيراد أسئلة من ملف JSON · Paste AI-generated JSON to bulk-import all questions at once</p>
            </div>
          </div>
          {showImport ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </button>

        {showImport && (
          <div className="border-t border-primary/20 p-5 space-y-5">

            {/* Pinned Prompt Section */}
            <div className="rounded-lg border border-border bg-card overflow-hidden">
              <button
                onClick={() => setShowPrompt(!showPrompt)}
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/30 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  <p className="text-sm font-semibold text-foreground">
                    Step 1 — Copy this prompt into ChatGPT / Claude / Gemini
                  </p>
                  <span className="text-xs text-muted-foreground">الخطوة ١ · انسخ هذا البرومبت إلى الذكاء الاصطناعي</span>
                </div>
                {showPrompt ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
              </button>

              {showPrompt && (
                <div className="border-t border-border">
                  <div className="flex items-center justify-between px-4 py-2 bg-muted/40 border-b border-border">
                    <span className="text-xs text-muted-foreground font-mono">AI Prompt — JSON Schema</span>
                    <button
                      onClick={handleCopyPrompt}
                      className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-md transition-all ${promptCopied ? "bg-green-500/10 text-green-600 border border-green-500/20" : "bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20"}`}
                    >
                      {promptCopied ? <><Check className="w-3.5 h-3.5" /> Copied!</> : <><Copy className="w-3.5 h-3.5" /> Copy Prompt</>}
                    </button>
                  </div>
                  <pre className="p-4 text-xs text-foreground font-mono whitespace-pre-wrap leading-relaxed bg-muted/20 max-h-64 overflow-y-auto">
                    {JSON_PROMPT}
                  </pre>
                </div>
              )}
            </div>

            {/* JSON Example */}
            <div className="rounded-lg border border-border bg-card overflow-hidden">
              <div className="px-4 py-3 bg-muted/30 border-b border-border flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-500" />
                <p className="text-sm font-semibold text-foreground">
                  Step 2 — Expected JSON structure
                  <span className="text-xs text-muted-foreground font-normal ms-2">الخطوة ٢ · هيكل JSON المتوقع</span>
                </p>
              </div>
              <pre className="p-4 text-xs text-muted-foreground font-mono whitespace-pre-wrap leading-relaxed bg-muted/10 max-h-52 overflow-y-auto">
                {EXAMPLE_JSON}
              </pre>
            </div>

            {/* Paste & Import */}
            <div className="space-y-3">
              <label className="block text-sm font-semibold text-foreground">
                Step 3 — Paste your JSON here
                <span className="text-xs text-muted-foreground font-normal ms-2">الخطوة ٣ · الصق JSON هنا</span>
              </label>
              <textarea
                value={jsonInput}
                onChange={(e) => setJsonInput(e.target.value)}
                placeholder={`Paste the JSON array from your AI here...\n[\n  { "question_text": "...", "question_type": "mcq", ... }\n]`}
                rows={10}
                className="w-full bg-background border border-border rounded-lg px-4 py-3 text-sm text-foreground font-mono resize-none focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all placeholder:text-muted-foreground/50"
              />
              {jsonInput.trim() && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/30 px-3 py-2 rounded-md">
                  <Check className="w-3.5 h-3.5 text-green-500" />
                  {jsonInput.trim().length} characters pasted
                </div>
              )}
              <button
                onClick={handleImport}
                disabled={isImporting || !jsonInput.trim()}
                className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground py-3 rounded-lg font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {isImporting ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Importing...</>
                ) : (
                  <><Upload className="w-4 h-4" /> Import All Questions</>
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Questions List */}
      <div className="space-y-3">
        {questions.length === 0 && (
          <div className="text-center py-12 bg-muted/20 rounded-lg border border-dashed border-border">
            <p className="text-muted-foreground">{t("quiz.noQuestions")}</p>
          </div>
        )}
        {questions.map((q, i) => (
          <div key={q.id} className="clean-panel p-5 rounded-lg border border-border bg-card">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <span className="text-xs font-bold bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
                    Q{i + 1}
                  </span>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 ${q.question_type === "mcq" ? "bg-blue-500/10 text-blue-600" : "bg-purple-500/10 text-purple-600"}`}>
                    {q.question_type === "mcq" ? <CheckSquare className="w-3 h-3" /> : <FileText className="w-3 h-3" />}
                    {t(q.question_type === "mcq" ? "quiz.multipleChoice" : "quiz.written")}
                  </span>
                  <span className="text-xs text-muted-foreground flex items-center gap-0.5">
                    <Award className="w-3 h-3" /> {q.points}
                  </span>
                </div>
                {q.image_url && (
                  <img src={q.image_url} alt="question" className="mb-3 max-h-40 rounded-md object-contain border border-border" />
                )}
                <p className="font-medium text-foreground">{q.question_text}</p>
                {q.question_type === "mcq" && (
                  <ul className="mt-3 space-y-1">
                    {q.quiz_options.map((opt) => (
                      <li key={opt.id} className={`text-sm flex items-center gap-2 px-2 py-1 rounded-md ${opt.is_correct ? "bg-green-500/10 text-green-700 dark:text-green-400 font-medium" : "text-muted-foreground"}`}>
                        {opt.is_correct ? <CheckSquare className="w-3.5 h-3.5 flex-shrink-0" /> : <span className="w-3.5 h-3.5 flex-shrink-0 rounded-full border border-current inline-block" />}
                        {opt.option_text}
                      </li>
                    ))}
                  </ul>
                )}
                {q.question_type === "written" && (
                  <p className="text-sm text-muted-foreground mt-2 italic flex items-center gap-1">
                    <FileText className="w-3.5 h-3.5" /> {t("quiz.openEnded")}
                  </p>
                )}
              </div>
              <button onClick={() => handleDelete(q.id)} className="text-muted-foreground hover:text-red-500 transition-colors flex-shrink-0" title={t("quiz.delete")}>
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add Question Button */}
      <button
        onClick={() => setIsAdding(true)}
        className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-border rounded-lg text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors"
      >
        <Plus className="w-4 h-4" /> {t("quiz.addQuestion")}
      </button>

      {/* Add Question Modal */}
      <Modal isOpen={isAdding} onClose={() => setIsAdding(false)} title={t("quiz.addQuestion")}>
        <form action={handleAdd} className="space-y-4">
          {/* Type Toggle */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">{t("quiz.questionType")}</label>
            <div className="flex rounded-lg border border-border overflow-hidden">
              {(["mcq", "written"] as const).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setQuestionType(type)}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium transition-colors ${questionType === type ? "bg-primary text-primary-foreground" : "bg-background text-muted-foreground hover:bg-muted"}`}
                >
                  {type === "mcq" ? <CheckSquare className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                  {t(type === "mcq" ? "quiz.multipleChoice" : "quiz.written")}
                </button>
              ))}
            </div>
          </div>

          {/* Question Text */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">{t("quiz.questionText")}</label>
            <textarea name="question_text" required rows={3} placeholder={t("quiz.questionPlaceholder")} className="w-full bg-background border border-border rounded-md px-3 py-2 text-foreground resize-none" />
          </div>

          {/* Image URL */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1 flex items-center gap-1">
              <Image className="w-3 h-3" /> {t("quiz.imageUrl")} <span className="text-muted-foreground font-normal">{t("quiz.imageOptional")}</span>
            </label>
            <input type="url" placeholder="https://..." value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} className="w-full bg-background border border-border rounded-md px-3 py-2 text-foreground" />
            {imageUrl && <img src={imageUrl} alt="preview" className="mt-2 max-h-24 rounded-md object-contain" />}
          </div>

          {/* Points */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1 flex items-center gap-1">
              <Award className="w-3.5 h-3.5" /> {t("quiz.points")}
            </label>
            <input type="number" name="points" defaultValue={1} min={1} className="w-full bg-background border border-border rounded-md px-3 py-2 text-foreground" />
          </div>

          {/* MCQ Options */}
          {questionType === "mcq" && (
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">{t("quiz.answerOptions")}</label>
              <div className="space-y-2">
                {mcqOptions.map((opt, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input type="radio" name="correct_radio" checked={correctIndex === i} onChange={() => setCorrectIndex(i)} className="flex-shrink-0 accent-green-500" />
                    <input
                      type="text"
                      value={opt}
                      onChange={(e) => {
                        const next = [...mcqOptions];
                        next[i] = e.target.value;
                        setMcqOptions(next);
                      }}
                      placeholder={`Option ${i + 1}${i === correctIndex ? ` (${t("quiz.correct")})` : ""}`}
                      className={`flex-1 bg-background border rounded-md px-3 py-2 text-sm text-foreground ${i === correctIndex ? "border-green-500" : "border-border"}`}
                    />
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-1">{t("quiz.correctHint")}</p>
            </div>
          )}

          <div className="flex justify-end pt-2">
            <button type="submit" disabled={isPending} className="w-full bg-primary text-primary-foreground py-2.5 rounded-md font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2">
              <Plus className="w-4 h-4" /> {isPending ? t("quiz.adding") : t("quiz.addQuestion")}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
