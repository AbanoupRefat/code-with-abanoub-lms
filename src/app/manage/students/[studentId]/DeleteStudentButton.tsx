"use client";

import { Trash2 } from "lucide-react";
import { useTransition } from "react";

interface DeleteStudentButtonProps {
  deleteAction: () => Promise<void>;
  studentName: string;
}

export function DeleteStudentButton({ deleteAction, studentName }: DeleteStudentButtonProps) {
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${studentName}"?\n\nThis will permanently remove their profile, enrollments, payment records, and quiz submissions.\nTheir Google account is NOT blocked — they can sign up again.`
    );
    if (!confirmed) return;
    startTransition(() => deleteAction());
  }

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      className="w-full flex justify-center items-center gap-2 bg-red-600 hover:bg-red-700 disabled:opacity-60 disabled:cursor-not-allowed text-white px-4 py-2 rounded-md text-sm font-semibold transition-colors"
    >
      <Trash2 className="w-4 h-4" />
      {isPending ? "Deleting…" : "Delete Student"}
    </button>
  );
}
