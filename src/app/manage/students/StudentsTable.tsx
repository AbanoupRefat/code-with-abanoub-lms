"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { ArrowRight, Trash2, User, X } from "lucide-react";
import { toast } from "sonner";
import { deleteStudents } from "../actions";
import { DeleteStudentIconButton } from "./DeleteStudentIconButton";

export interface StudentRow {
  id: string;
  fullName: string;
  email: string;
  avatarUrl: string | null;
  activityLabel: string;
  activityColor: string;
  activityDot: string;
  lastActiveText: string | null;
  joinedText: string;
}

export function StudentsTable({ students }: { students: StudentRow[] }) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [isPending, startTransition] = useTransition();
  const headerCheckbox = useRef<HTMLInputElement>(null);

  const allIds = useMemo(() => students.map((s) => s.id), [students]);
  // Only count selections that still exist in the list (e.g. after a delete refresh)
  const selectedIds = useMemo(() => allIds.filter((id) => selected.has(id)), [allIds, selected]);
  const selectedCount = selectedIds.length;
  const allSelected = allIds.length > 0 && selectedCount === allIds.length;
  const someSelected = selectedCount > 0 && !allSelected;

  useEffect(() => {
    if (headerCheckbox.current) headerCheckbox.current.indeterminate = someSelected;
  }, [someSelected]);

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    setSelected(allSelected ? new Set() : new Set(allIds));
  }

  function runBulkDelete(ids: string[]) {
    startTransition(async () => {
      const loadingId = toast.loading(`Deleting ${ids.length} student${ids.length === 1 ? "" : "s"}…`);
      try {
        const result = await deleteStudents(ids);
        if (result.success) {
          toast.success(`${result.deletedCount} student${result.deletedCount === 1 ? "" : "s"} deleted`, { id: loadingId });
          setSelected(new Set());
        } else {
          toast.error(result.error ?? "Could not delete the selected students", { id: loadingId, duration: 10000 });
          if (result.deletedCount > 0) setSelected(new Set());
        }
      } catch {
        toast.error("Could not delete the selected students. Please try again.", { id: loadingId });
      }
    });
  }

  function handleBulkDelete() {
    const ids = selectedIds;
    if (ids.length === 0) return;
    toast(`Delete ${ids.length} selected student${ids.length === 1 ? "" : "s"}?`, {
      id: "confirm-bulk-delete",
      description:
        "This permanently removes their profiles, enrollments, payment records, and quiz submissions. Their Google accounts are not blocked.",
      duration: 10000,
      action: { label: "Confirm delete", onClick: () => runBulkDelete(ids) },
      actionButtonStyle: { backgroundColor: "#dc2626", color: "#fff" },
      cancel: { label: "Cancel", onClick: () => {} },
    });
  }

  return (
    <div>
      {selectedCount > 0 && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-muted px-4 py-3">
          <span className="text-sm font-medium text-foreground">
            {selectedCount} selected
          </span>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setSelected(new Set())}
              disabled={isPending}
              className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground disabled:opacity-60"
            >
              <X className="w-4 h-4" />
              Clear
            </button>
            <button
              type="button"
              onClick={handleBulkDelete}
              disabled={isPending}
              className="inline-flex items-center gap-2 rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Trash2 className="w-4 h-4" />
              {isPending ? "Deleting…" : `Delete selected (${selectedCount})`}
            </button>
          </div>
        </div>
      )}

      <div className="clean-panel rounded-lg overflow-hidden">
        <table className="w-full text-left text-sm border-collapse">
          <thead className="bg-muted border-b border-border">
            <tr>
              <th className="px-6 py-3 w-10">
                <input
                  ref={headerCheckbox}
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleAll}
                  disabled={students.length === 0 || isPending}
                  aria-label="Select all students"
                  className="w-4 h-4 cursor-pointer accent-primary"
                />
              </th>
              <th className="px-6 py-3 font-semibold text-muted-foreground">Student Name</th>
              <th className="px-6 py-3 font-semibold text-muted-foreground">Email</th>
              <th className="px-6 py-3 font-semibold text-muted-foreground">Last Active</th>
              <th className="px-6 py-3 font-semibold text-muted-foreground">Joined</th>
              <th className="px-6 py-3 font-semibold text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border bg-card">
            {students.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">
                  No students found.
                </td>
              </tr>
            )}
            {students.map((student) => {
              const isSelected = selected.has(student.id);
              return (
                <tr
                  key={student.id}
                  className={`transition-colors ${isSelected ? "bg-muted/60" : "hover:bg-muted/30"}`}
                >
                  <td className="px-6 py-4">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleOne(student.id)}
                      disabled={isPending}
                      aria-label={`Select ${student.fullName}`}
                      className="w-4 h-4 cursor-pointer accent-primary"
                    />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground overflow-hidden">
                        {student.avatarUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={student.avatarUrl} alt={student.fullName} className="w-full h-full object-cover" />
                        ) : (
                          <User className="w-4 h-4" />
                        )}
                      </div>
                      <span className="font-medium text-foreground">{student.fullName}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-muted-foreground text-xs">{student.email}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${student.activityDot}`} />
                      <span className={`text-sm font-medium ${student.activityColor}`}>{student.activityLabel}</span>
                    </div>
                    {student.lastActiveText && (
                      <p className="text-xs text-muted-foreground mt-0.5">{student.lastActiveText}</p>
                    )}
                  </td>
                  <td className="px-6 py-4 text-muted-foreground">{student.joinedText}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                      <Link
                        href={`/manage/students/${student.id}`}
                        className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                      >
                        Manage <ArrowRight className="w-4 h-4" />
                      </Link>
                      <DeleteStudentIconButton studentId={student.id} studentName={student.fullName} />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
