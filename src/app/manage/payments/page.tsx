import AdminNavigation from "@/components/AdminNavigation";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import PaymentsHub from "./PaymentsHub";
import type { OneTimePayment, PrivateSession } from "./types";

export default async function ManagePaymentsPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") return redirect("/dashboard");

  const now = new Date();
  const currentMonth = now.getMonth() + 1; // 1-12
  const currentYear = now.getFullYear();

  // Fetch all students
  const { data: students } = await supabase
    .from("profiles")
    .select("id, full_name, avatar_url, email, created_at")
    .eq("role", "student")
    .order("full_name", { ascending: true });

  // Fetch payment records safely
  let payments: any[] = [];
  try {
    const { data: fetchedPayments, error } = await supabase
      .from("student_payments")
      .select("*");

    if (!error && fetchedPayments) {
      payments = fetchedPayments;
    }
  } catch (err) {
    console.warn("student_payments table query fallback:", err);
  }

  // One-time fees, private sessions and "private only" flags.
  // If the migration hasn't been run yet these tables don't exist, so we fall back to
  // empty lists and tell the UI (it shows a banner pointing at the migration file).
  const [oneTimeRes, sessionsRes, exemptRes] = await Promise.all([
    supabase.from("one_time_payments").select("*").order("paid_at", { ascending: false }),
    supabase.from("private_sessions").select("*").order("session_date", { ascending: false }),
    supabase.from("monthly_exemptions").select("student_id"),
  ]);

  const oneTimePayments = (oneTimeRes.error ? [] : oneTimeRes.data ?? []) as OneTimePayment[];
  const privateSessions = (sessionsRes.error ? [] : sessionsRes.data ?? []) as PrivateSession[];
  const exemptIds = (exemptRes.error ? [] : exemptRes.data ?? []).map((r) => r.student_id as string);

  return (
    <div className="flex min-h-screen bg-background">
      <AdminNavigation />

      <main className="flex-1 min-w-0 p-4 sm:p-6 md:p-10 overflow-y-auto">
        <PaymentsHub
          students={students || []}
          payments={payments}
          oneTimePayments={oneTimePayments}
          privateSessions={privateSessions}
          exemptIds={exemptIds}
          oneTimeAvailable={!oneTimeRes.error}
          sessionsAvailable={!sessionsRes.error}
          currentMonth={currentMonth}
          currentYear={currentYear}
        />
      </main>
    </div>
  );
}
