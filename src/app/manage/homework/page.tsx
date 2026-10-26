import AdminNavigation from "@/components/AdminNavigation";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import HomeworkAdminClient, { type AdminHomework, type AdminSubmission } from "./HomeworkAdminClient";

export const metadata = { title: "Homework — LMS" };

export default async function ManageHomeworkPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return redirect("/dashboard");

  // If the migration hasn't been run these queries error; the UI then shows a banner.
  const [hwRes, subRes] = await Promise.all([
    supabase.from("homeworks").select("id, title, source, questions, is_published, due_date, created_at").order("created_at", { ascending: false }),
    supabase.from("homework_submissions").select("homework_id, student_id, score, total, submitted_at, profiles(full_name)"),
  ]);

  const homeworks: AdminHomework[] = (hwRes.error ? [] : hwRes.data ?? []).map((h) => ({
    id: h.id,
    title: h.title,
    source: h.source,
    question_count: Array.isArray(h.questions) ? h.questions.length : 0,
    is_published: h.is_published,
    due_date: h.due_date,
    created_at: h.created_at,
  }));

  const submissions: AdminSubmission[] = (subRes.error ? [] : subRes.data ?? []).map((s) => {
    const prof = s.profiles as unknown as { full_name: string | null } | { full_name: string | null }[] | null;
    const name = Array.isArray(prof) ? prof[0]?.full_name : prof?.full_name;
    return {
      homework_id: s.homework_id,
      student_id: s.student_id,
      student_name: name || "Unknown",
      score: s.score,
      total: s.total,
      submitted_at: s.submitted_at,
    };
  });

  return (
    <div className="flex min-h-screen bg-background">
      <AdminNavigation />
      <main className="flex-1 min-w-0 p-4 sm:p-6 md:p-10 overflow-y-auto">
        <HomeworkAdminClient homeworks={homeworks} submissions={submissions} available={!hwRes.error} />
      </main>
    </div>
  );
}
