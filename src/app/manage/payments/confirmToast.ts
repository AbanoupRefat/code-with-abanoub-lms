"use client";

import { toast } from "sonner";

/** Shows a toast with a red confirm button; runs onConfirm only if it's clicked. */
export function confirmToast(opts: {
  id: string;
  title: string;
  description?: string;
  confirmLabel?: string;
  onConfirm: () => void;
}) {
  toast(opts.title, {
    id: opts.id,
    description: opts.description,
    duration: 10000,
    action: { label: opts.confirmLabel ?? "Confirm delete", onClick: opts.onConfirm },
    actionButtonStyle: { backgroundColor: "#dc2626", color: "#fff" },
    cancel: { label: "Cancel", onClick: () => {} },
  });
}
