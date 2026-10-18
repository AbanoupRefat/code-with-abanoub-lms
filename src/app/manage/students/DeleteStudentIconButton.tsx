"use client";

import { Trash2 } from "lucide-react";
import { useTransition } from "react";
import { toast } from "sonner";
import { deleteStudent } from "../actions";

interface DeleteStudentIconButtonProps {
  studentId: string;
  studentName: string;
}

export function DeleteStudentIconButton({ studentId, studentName }: DeleteStudentIconButtonProps) {
  const [isPending, startTransition] = useTransition();

  function runDelete() {
    startTransition(async () => {
      const loadingId = toast.loading(`Deleting ${studentName}…`);
      try {
        await deleteStudent(studentId);
        toast.success(`${studentName} was deleted`, { id: loadingId });
      } catch (err) {
        const message = err instanceof Error ? err.message : "Something went wrong";
        toast.error(`Could not delete ${studentName}: ${message}`, { id: loadingId });
      }
    });
  }

  function handleClick() {
    toast(`Delete ${studentName}?`, {
      id: `confirm-delete-${studentId}`,
      description:
        "This permanently removes their profile, enrollments, payment records, and quiz submissions. Their Google account is not blocked.",
      duration: 10000,
      action: {
        label: "Confirm delete",
        onClick: runDelete,
      },
      actionButtonStyle: { backgroundColor: "#dc2626", color: "#fff" },
      cancel: {
        label: "Cancel",
        onClick: () => {},
      },
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
