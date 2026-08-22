import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import AdminNavigation from "@/components/AdminNavigation";
import AdminCalendarClient from "./AdminCalendarClient";

export const metadata = {
  title: "Manage Curriculum Calendar — Admin LMS",
};

export default async function ManageCalendarPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return redirect("/login");

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (profile?.role !== 'admin') return redirect("/dashboard");

  // Fetch all events
  const { data: events } = await supabase
    .from('calendar_events')
    .select('*')
    .order('event_date', { ascending: true });

  // Fetch courses and quizzes for linking
  const { data: courses } = await supabase.from('courses').select('id, title');
  const { data: quizzes } = await supabase.from('quizzes').select('id, title');

  return (
    <div className="flex min-h-screen bg-background">
      <AdminNavigation />
      <main className="flex-1 p-8 md:p-12 overflow-y-auto">
        <AdminCalendarClient 
          events={events || []} 
          courses={courses || []} 
          quizzes={quizzes || []} 
        />
      </main>
    </div>
  );
}
