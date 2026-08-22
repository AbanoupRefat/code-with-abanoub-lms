"use client";

import { useState, useTransition } from "react";
import { Plus, Trash2, CheckSquare, FileText, Image, Clock, Award, Hash } from "lucide-react";
import Modal from "@/components/Modal";
import { toast } from "sonner";
import { createQuizQuestion, deleteQuizQuestion } from "@/app/manage/actions";
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

export default function QuizBuilderClient({ quiz, courseId }: { quiz: Quiz; courseId: string }) {
  const { t } = useLang();
  const [questions, setQuestions] = useState<QuizQuestion[]>(
    quiz.quiz_questions.slice().sort((a, b) => a.order_index - b.order_index)
  );
  const [isAdding, setIsAdding] = useState(false);
  const [questionType, setQuestionType] = useState<"mcq" | "written">("mcq");
  const [mcqOptions, setMcqOptions] = useState(["", "", "", ""]);
  const [correctIndex, setCorrectIndex] = useState(0);
  const [imageUrl, setImageUrl] = useState("");
  const [isPending, startTransition] = useTransition();

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
                      placeholder={`${t("quiz.answerOptions").replace("Options", "").trim()} ${i + 1}${i === correctIndex ? ` (${t("quiz.correct")})` : ""}`}
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
