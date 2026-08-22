import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import Navigation from "@/components/Navigation";
import StudentCalendarClient from "./StudentCalendarClient";

export const metadata = {
  title: "Curriculum Calendar — LMS",
};

export default async function CalendarPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return redirect("/login");

  // Fetch user profile (needed for Navigation)
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  // Fetch all calendar events, ordered by date
  const { data: events } = await supabase
    .from('calendar_events')
    .select('*')
    .order('event_date', { ascending: true });

  return (
    <div className="flex min-h-screen bg-background">
      <Navigation profile={profile} />
      <main className="flex-1 p-8 md:p-12 overflow-y-auto">
        <StudentCalendarClient events={events || []} />
      </main>
    </div>
  );
}
