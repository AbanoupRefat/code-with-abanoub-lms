"use client";

import { useState } from "react";
import { Edit2, Trash2, X } from "lucide-react";
import SubmitButton from "./SubmitButton";
import Modal from "./Modal";
import { toast } from "sonner";
import { deleteUnit, updateUnit, deleteLesson, updateLesson, deleteQuiz, updateQuiz } from "@/app/manage/actions";

export function EditableUnit({ unit, courseId, children }: { unit: any, courseId: string, children?: React.ReactNode }) {
  const [isEditing, setIsEditing] = useState(false);
  const [isAddingLesson, setIsAddingLesson] = useState(false);
  const [isAddingQuiz, setIsAddingQuiz] = useState(false);

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this unit and all its lessons/quizzes?")) return;
    try {
      await deleteUnit(unit.id, courseId);
      toast.success("Unit deleted");
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleUpdate = async (formData: FormData) => {
    try {
      await updateUnit(unit.id, courseId, formData);
      toast.success("Unit updated");
      setIsEditing(false);
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleCreateLesson = async (formData: FormData) => {
    try {
      const { createLesson } = await import('@/app/manage/actions');
      await createLesson(unit.id, courseId, formData);
      toast.success("Lesson created");
      setIsAddingLesson(false);
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleCreateQuiz = async (formData: FormData) => {
    try {
      const { createQuiz } = await import('@/app/manage/actions');
      await createQuiz(unit.id, courseId, formData);
      toast.success("Quiz created");
      setIsAddingQuiz(false);
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  return (
    <div className="clean-panel p-4 rounded-lg border border-border bg-card">
      <Modal isOpen={isEditing} onClose={() => setIsEditing(false)} title="Edit Unit">
        <form action={handleUpdate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Unit Title</label>
            <input type="text" name="title" defaultValue={unit.title} required className="w-full bg-background border border-border rounded-md px-3 py-2 text-foreground" />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Order Index</label>
            <input type="number" name="order_index" defaultValue={unit.order_index} required className="w-full bg-background border border-border rounded-md px-3 py-2 text-foreground" />
          </div>
          <div className="flex justify-end pt-2">
            <SubmitButton label="Save Changes" loadingLabel="Saving..." className="w-full" />
          </div>
        </form>
      </Modal>

      <div className="flex justify-between items-center group mb-4">
        <h3 className="font-bold text-lg text-foreground">{unit.title}</h3>
        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
          <button type="button" onClick={() => setIsEditing(true)} className="text-muted-foreground hover:text-primary"><Edit2 className="w-4 h-4" /></button>
          <button type="button" onClick={handleDelete} className="text-muted-foreground hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
        </div>
      </div>

      {/* Children (Lessons/Quizzes list) goes here */}
      <div className="pl-4 border-l-2 border-border/50 space-y-2 mb-4">
        {children}
      </div>

      {/* Contextual Add Buttons */}
      <div className="flex gap-2 mt-4 pt-4 border-t border-border/50">
        <button type="button" onClick={() => setIsAddingLesson(true)} className="text-sm font-medium text-green-600 hover:text-green-700 transition-colors flex items-center gap-1">+ Add Lesson</button>
        <button type="button" onClick={() => setIsAddingQuiz(true)} className="text-sm font-medium text-green-600 hover:text-green-700 transition-colors flex items-center gap-1 ml-4">+ Add Quiz</button>
      </div>

      {/* Add Lesson Modal */}
      <Modal isOpen={isAddingLesson} onClose={() => setIsAddingLesson(false)} title="Add New Lesson">
        <form action={handleCreateLesson} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Lesson Title</label>
            <input type="text" name="title" placeholder="e.g. Setting up your environment" required className="w-full bg-background border border-border rounded-md px-3 py-2 text-foreground" />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Video Provider</label>
            <input type="text" name="video_provider" placeholder="e.g. youtube" className="w-full bg-background border border-border rounded-md px-3 py-2 text-foreground" />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Video URL</label>
            <input type="text" name="video_url" placeholder="https://..." className="w-full bg-background border border-border rounded-md px-3 py-2 text-foreground" />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Order Index</label>
            <input type="number" name="order_index" placeholder="e.g. 1" required className="w-full bg-background border border-border rounded-md px-3 py-2 text-foreground" />
          </div>
          <div className="flex justify-end pt-2">
            <SubmitButton label="Create Lesson" loadingLabel="Creating..." className="w-full" />
          </div>
        </form>
      </Modal>

      {/* Add Quiz Modal */}
      <Modal isOpen={isAddingQuiz} onClose={() => setIsAddingQuiz(false)} title="Add New Quiz">
        <form action={handleCreateQuiz} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Quiz Title</label>
            <input type="text" name="title" placeholder="e.g. Final Review" required className="w-full bg-background border border-border rounded-md px-3 py-2 text-foreground" />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Description</label>
            <textarea name="description" placeholder="Instructions for the student" rows={2} className="w-full bg-background border border-border rounded-md px-3 py-2 text-foreground" />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Order Index</label>
            <input type="number" name="order_index" placeholder="e.g. 99" required className="w-full bg-background border border-border rounded-md px-3 py-2 text-foreground" />
          </div>
          <div className="flex items-center gap-2 pt-2 pb-2">
            <input type="checkbox" name="show_grade_immediately" id="show_grade_immediately" className="w-4 h-4 rounded border-border" />
            <label htmlFor="show_grade_immediately" className="text-sm text-foreground">Show grade immediately after submission</label>
          </div>
          <div className="flex justify-end">
            <SubmitButton label="Create Quiz" loadingLabel="Creating..." className="w-full" />
          </div>
        </form>
      </Modal>
    </div>
  );
}

export function EditableLesson({ lesson, courseId }: { lesson: any, courseId: string }) {
  const [isEditing, setIsEditing] = useState(false);

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this lesson?")) return;
    try {
      await deleteLesson(lesson.id, courseId);
      toast.success("Lesson deleted");
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleUpdate = async (formData: FormData) => {
    try {
      await updateLesson(lesson.id, courseId, formData);
      toast.success("Lesson updated");
      setIsEditing(false);
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  return (
    <>
      <Modal isOpen={isEditing} onClose={() => setIsEditing(false)} title="Edit Lesson">
        <form action={handleUpdate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Lesson Title</label>
            <input type="text" name="title" defaultValue={lesson.title} required className="w-full bg-background border border-border rounded-md px-3 py-2 text-foreground" />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Video Provider</label>
            <input type="text" name="video_provider" defaultValue={lesson.video_provider || ""} className="w-full bg-background border border-border rounded-md px-3 py-2 text-foreground" />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Video URL</label>
            <input type="text" name="video_url" defaultValue={lesson.video_url || ""} className="w-full bg-background border border-border rounded-md px-3 py-2 text-foreground" />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Order Index</label>
            <input type="number" name="order_index" defaultValue={lesson.order_index} required className="w-full bg-background border border-border rounded-md px-3 py-2 text-foreground" />
          </div>
          <div className="flex justify-end pt-2">
            <SubmitButton label="Save Changes" loadingLabel="Saving..." className="w-full" />
          </div>
        </form>
      </Modal>

      <div className="text-sm text-muted-foreground flex items-center justify-between group py-1">
        <div className="flex items-center gap-2">
          <span className="w-4 h-4 bg-muted rounded-sm flex items-center justify-center text-[10px]">{lesson.order_index}</span>
          {lesson.title}
        </div>
        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
          <button type="button" onClick={() => setIsEditing(true)} className="text-muted-foreground hover:text-primary"><Edit2 className="w-3.5 h-3.5" /></button>
          <button type="button" onClick={handleDelete} className="text-muted-foreground hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
        </div>
      </div>
    </>
  );
}

export function EditableQuiz({ quiz, courseId }: { quiz: any, courseId: string }) {
  const [isEditing, setIsEditing] = useState(false);

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this quiz?")) return;
    try {
      await deleteQuiz(quiz.id, courseId);
      toast.success("Quiz deleted");
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleUpdate = async (formData: FormData) => {
    try {
      await updateQuiz(quiz.id, courseId, formData);
      toast.success("Quiz updated");
      setIsEditing(false);
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  return (
    <>
      <Modal isOpen={isEditing} onClose={() => setIsEditing(false)} title="Edit Quiz">
        <form action={handleUpdate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Quiz Title</label>
            <input type="text" name="title" defaultValue={quiz.title} required className="w-full bg-background border border-border rounded-md px-3 py-2 text-foreground" />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Description</label>
            <textarea name="description" defaultValue={quiz.description} rows={2} className="w-full bg-background border border-border rounded-md px-3 py-2 text-foreground" />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Order Index</label>
            <input type="number" name="order_index" defaultValue={quiz.order_index} required className="w-full bg-background border border-border rounded-md px-3 py-2 text-foreground" />
          </div>
          <div className="flex items-center gap-2 pt-2 pb-2">
            <input type="checkbox" name="show_grade_immediately" id={`edit-quiz-grade-${quiz.id}`} defaultChecked={quiz.show_grade_immediately} className="w-4 h-4 rounded border-border" />
            <label htmlFor={`edit-quiz-grade-${quiz.id}`} className="text-sm text-foreground">Show grade immediately after submission</label>
          </div>
          <div className="flex justify-end">
            <SubmitButton label="Save Changes" loadingLabel="Saving..." className="w-full" />
          </div>
        </form>
      </Modal>

      <div className="text-sm text-primary font-medium flex items-center justify-between group py-1 mt-1">
        <div className="flex items-center gap-2">
          <span className="w-4 h-4 bg-primary/20 text-primary rounded-sm flex items-center justify-center text-[10px]">{quiz.order_index}</span>
          [Quiz] {quiz.title}
        </div>
        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
          <button type="button" onClick={() => setIsEditing(true)} className="text-primary hover:text-primary/70"><Edit2 className="w-3.5 h-3.5" /></button>
          <button type="button" onClick={handleDelete} className="text-primary hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
        </div>
      </div>
    </>
  );
}
