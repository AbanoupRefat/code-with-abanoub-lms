export type FeeType = "notes" | "printing" | "other";

export interface OneTimePayment {
  id: string;
  student_id: string | null;
  student_name?: string | null;
  fee_type: FeeType;
  amount: number;
  payment_method: string | null;
  paid_at: string;
  notes: string | null;
}

export interface PrivateSession {
  id: string;
  student_id: string | null;
  student_name?: string | null;
  session_date: string;
  price: number;
  status: "paid" | "unpaid";
  payment_method: string | null;
  paid_at: string | null;
  notes: string | null;
}

// Default monthly tuition, used by the quick-pay buttons and as the edit-modal default
export const DEFAULT_PAYMENT_AMOUNT = 500;

export const QUICK_METHODS = ["Cash", "InstaPay"] as const;
export type QuickMethod = (typeof QUICK_METHODS)[number];

export const FEE_LABELS: Record<FeeType, string> = {
  notes: "Notes",
  printing: "Printing",
  other: "Other",
};

export const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

// Consistent colours across all charts
export const COLORS = {
  tuition: "#10b981",
  notes: "#f59e0b",
  printing: "#0ea5e9",
  other: "#94a3b8",
  private: "#8b5cf6",
  paid: "#10b981",
  pending: "#f59e0b",
  unpaid: "#f43f5e",
  Cash: "#10b981",
  InstaPay: "#8b5cf6",
  "Vodafone Cash": "#ef4444",
  "Bank Transfer": "#0ea5e9",
  Other: "#94a3b8",
  Unspecified: "#cbd5e1",
} as const;

export const PALETTE = ["#8b5cf6", "#10b981", "#f59e0b", "#0ea5e9", "#f43f5e", "#14b8a6", "#6366f1", "#94a3b8"];

export function formatEgp(n: number): string {
  const v = Math.round((Number(n) || 0) * 100) / 100;
  return `${v.toLocaleString("en-US")} EGP`;
}

/** Month (1-12) and year of an ISO timestamp, in the viewer's local time. */
export function monthYearOf(iso: string | null | undefined): { month: number; year: number } | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return { month: d.getMonth() + 1, year: d.getFullYear() };
}

export function todayInputValue(): string {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mm}-${dd}`;
}
