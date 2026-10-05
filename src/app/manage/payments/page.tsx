import AdminNavigation from "@/components/AdminNavigation";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import PaymentsClient from "./PaymentsClient";

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

  return (
    <div className="flex min-h-screen bg-background">
      <AdminNavigation />

      <main className="flex-1 p-6 md:p-10 overflow-y-auto">
        <PaymentsClient
          initialStudents={students || []}
          initialPayments={payments}
          currentMonth={currentMonth}
          currentYear={currentYear}
        />
      </main>
    </div>
  );
}
