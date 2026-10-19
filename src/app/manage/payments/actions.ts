"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export async function updateStudentPaymentStatus({
  studentId,
  month,
  year,
  status,
  amount = 0,
  paymentMethod = "Vodafone Cash",
  paidAt = null,
  notes = null,
}: {
  studentId: string;
  month: number;
  year: number;
  status: "paid" | "unpaid" | "pending";
  amount?: number;
  paymentMethod?: string;
  paidAt?: string | null;
  notes?: string | null;
}) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    throw new Error("Admin privileges required");
  }

  const effectivePaidAt = status === "paid" ? (paidAt || new Date().toISOString()) : null;

  const { error } = await supabase
    .from("student_payments")
    .upsert(
      {
        student_id: studentId,
        month,
        year,
        status,
        amount,
        payment_method: paymentMethod,
        paid_at: effectivePaidAt,
        notes,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "student_id,month,year",
      }
    );

  if (error) {
    console.error("Error updating payment:", error);
    throw new Error(error.message);
  }

  revalidatePath("/manage/payments");
  revalidatePath(`/manage/students/${studentId}`);
  revalidatePath("/dashboard");
  return { success: true };
}

export async function batchUpdateStudentPayments({
  studentIds,
  month,
  year,
  status,
  amount = 0,
  paymentMethod = "Vodafone Cash",
}: {
  studentIds: string[];
  month: number;
  year: number;
  status: "paid" | "unpaid" | "pending";
  amount?: number;
  paymentMethod?: string;
}) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    throw new Error("Admin privileges required");
  }

  if (!studentIds || studentIds.length === 0) return { success: true };

  const effectivePaidAt = status === "paid" ? new Date().toISOString() : null;

  const records = studentIds.map((studentId) => ({
    student_id: studentId,
    month,
    year,
    status,
    amount,
    payment_method: paymentMethod,
    paid_at: effectivePaidAt,
    updated_at: new Date().toISOString(),
  }));

  const { error } = await supabase.from("student_payments").upsert(records, {
    onConflict: "student_id,month,year",
  });

  if (error) {
    console.error("Error batch updating payments:", error);
    throw new Error(error.message);
  }

  revalidatePath("/manage/payments");
  revalidatePath("/dashboard");
  return { success: true };
}

// ─────────────────────────────────────────────────────────────
// One-time fees, private sessions, monthly exemptions
// These return { success, error } instead of throwing, because Next.js hides the
// message of errors thrown from server actions in production.
// ─────────────────────────────────────────────────────────────

type ActionResult = { success: boolean; error?: string };

const FEE_TYPES = ["notes", "printing", "other"] as const;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const MAX_AMOUNT = 100000;

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { supabase, error: "Unauthorized" };
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return { supabase, error: "Admin privileges required" };
  return { supabase, error: null as string | null };
}

function friendlyDbError(message: string): string {
  if (/relation .* does not exist|Could not find the table/i.test(message)) {
    return "Database tables are missing — run the 20261018_one_time_fees_and_private_sessions.sql migration in Supabase.";
  }
  return message;
}

function noonUtc(date?: string | null): string {
  return date && DATE_RE.test(date) ? `${date}T12:00:00Z` : new Date().toISOString();
}

export async function addOneTimePayment(input: {
  studentId: string;
  feeType: string;
  amount: number;
  paymentMethod: string;
  paidDate?: string | null;
  notes?: string | null;
}): Promise<ActionResult> {
  const { supabase, error: authError } = await requireAdmin();
  if (authError) return { success: false, error: authError };

  if (!input.studentId) return { success: false, error: "Choose a student first" };
  if (!(FEE_TYPES as readonly string[]).includes(input.feeType)) return { success: false, error: "Invalid fee type" };
  if (!Number.isFinite(input.amount) || input.amount <= 0 || input.amount > MAX_AMOUNT) {
    return { success: false, error: "Enter a valid amount" };
  }

  const { error } = await supabase.from("one_time_payments").insert({
    student_id: input.studentId,
    fee_type: input.feeType,
    amount: input.amount,
    payment_method: input.paymentMethod || null,
    paid_at: noonUtc(input.paidDate),
    notes: input.notes?.trim() || null,
  });
  if (error) return { success: false, error: friendlyDbError(error.message) };

  revalidatePath("/manage/payments");
  return { success: true };
}

export async function deleteOneTimePayment(id: string): Promise<ActionResult> {
  const { supabase, error: authError } = await requireAdmin();
  if (authError) return { success: false, error: authError };

  const { data, error } = await supabase.from("one_time_payments").delete().eq("id", id).select("id");
  if (error) return { success: false, error: friendlyDbError(error.message) };
  if (!data || data.length === 0) return { success: false, error: "Nothing was deleted (permissions?)" };

  revalidatePath("/manage/payments");
  return { success: true };
}

export async function addPrivateSessions(input: {
  studentId: string;
  count: number;
  pricePerSession: number;
  paid: boolean;
  paymentMethod?: string | null;
  date?: string | null;
  notes?: string | null;
  privateOnly?: boolean;
}): Promise<ActionResult & { added?: number }> {
  const { supabase, error: authError } = await requireAdmin();
  if (authError) return { success: false, error: authError };

  if (!input.studentId) return { success: false, error: "Choose a student first" };
  if (!Number.isInteger(input.count) || input.count < 1 || input.count > 50) {
    return { success: false, error: "Sessions must be a whole number between 1 and 50" };
  }
  if (!Number.isFinite(input.pricePerSession) || input.pricePerSession < 0 || input.pricePerSession > MAX_AMOUNT) {
    return { success: false, error: "Enter a valid price per session" };
  }

  const sessionDate = input.date && DATE_RE.test(input.date) ? input.date : new Date().toISOString().slice(0, 10);
  const paidAt = input.paid ? noonUtc(input.date) : null;

  const rows = Array.from({ length: input.count }, () => ({
    student_id: input.studentId,
    session_date: sessionDate,
    price: input.pricePerSession,
    status: input.paid ? "paid" : "unpaid",
    payment_method: input.paid ? input.paymentMethod || null : null,
    paid_at: paidAt,
    notes: input.notes?.trim() || null,
  }));

  const { error } = await supabase.from("private_sessions").insert(rows);
  if (error) return { success: false, error: friendlyDbError(error.message) };

  if (input.privateOnly) {
    await supabase.from("monthly_exemptions").upsert({ student_id: input.studentId }, { onConflict: "student_id" });
  }

  revalidatePath("/manage/payments");
  return { success: true, added: input.count };
}

export async function setPrivateSessionStatus(input: {
  id: string;
  status: "paid" | "unpaid";
  paymentMethod?: string | null;
}): Promise<ActionResult> {
  const { supabase, error: authError } = await requireAdmin();
  if (authError) return { success: false, error: authError };

  const paid = input.status === "paid";
  const { data, error } = await supabase
    .from("private_sessions")
    .update({
      status: input.status,
      payment_method: paid ? input.paymentMethod || null : null,
      paid_at: paid ? new Date().toISOString() : null,
    })
    .eq("id", input.id)
    .select("id");
  if (error) return { success: false, error: friendlyDbError(error.message) };
  if (!data || data.length === 0) return { success: false, error: "Nothing was updated (permissions?)" };

  revalidatePath("/manage/payments");
  return { success: true };
}

export async function markAllPrivateSessionsPaid(input: {
  studentId: string;
  paymentMethod: string;
}): Promise<ActionResult & { updated?: number }> {
  const { supabase, error: authError } = await requireAdmin();
  if (authError) return { success: false, error: authError };

  const { data, error } = await supabase
    .from("private_sessions")
    .update({ status: "paid", payment_method: input.paymentMethod || null, paid_at: new Date().toISOString() })
    .eq("student_id", input.studentId)
    .eq("status", "unpaid")
    .select("id");
  if (error) return { success: false, error: friendlyDbError(error.message) };

  revalidatePath("/manage/payments");
  return { success: true, updated: data?.length ?? 0 };
}

export async function deletePrivateSession(id: string): Promise<ActionResult> {
  const { supabase, error: authError } = await requireAdmin();
  if (authError) return { success: false, error: authError };

  const { data, error } = await supabase.from("private_sessions").delete().eq("id", id).select("id");
  if (error) return { success: false, error: friendlyDbError(error.message) };
  if (!data || data.length === 0) return { success: false, error: "Nothing was deleted (permissions?)" };

  revalidatePath("/manage/payments");
  return { success: true };
}

export async function setMonthlyExempt(input: { studentId: string; exempt: boolean }): Promise<ActionResult> {
  const { supabase, error: authError } = await requireAdmin();
  if (authError) return { success: false, error: authError };

  const { error } = input.exempt
    ? await supabase.from("monthly_exemptions").upsert({ student_id: input.studentId }, { onConflict: "student_id" })
    : await supabase.from("monthly_exemptions").delete().eq("student_id", input.studentId);
  if (error) return { success: false, error: friendlyDbError(error.message) };

  revalidatePath("/manage/payments");
  return { success: true };
}
