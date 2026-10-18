"use client";

import { Trash2 } from "lucide-react";
import { useTransition } from "react";
import { deleteStudent } from "../actions";

interface DeleteStudentIconButtonProps {
  studentId: string;
  studentName: string;
}

export function DeleteStudentIconButton({ studentId, studentName }: DeleteStudentIconButtonProps) {
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${studentName}"?\n\nThis will permanently remove their profile, enrollments, payment records, and quiz submissions.\nTheir Google account is NOT blocked — they can sign up again.`
    );
    if (!confirmed) return;
    startTransition(async () => {
      await deleteStudent(studentId);
    });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      title={`Delete ${studentName}`}
      aria-label={`Delete ${studentName}`}
      className="inline-flex items-center gap-1 text-sm font-medium text-red-600 hover:text-red-700 hover:underline disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
    >
      <Trash2 className="w-4 h-4" />
      {isPending ? "Deleting…" : "Delete"}
    </button>
  );
}
