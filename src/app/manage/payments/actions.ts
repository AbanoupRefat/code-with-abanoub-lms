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
