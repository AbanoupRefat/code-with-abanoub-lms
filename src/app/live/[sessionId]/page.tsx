import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import JitsiClassroomClient from "@/components/JitsiClassroomClient";

export const metadata = {
  title: "Live Classroom — LMS",
};

export default async function LiveClassroomPage({ params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return redirect("/login");

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, full_name')
    .eq('id', user.id)
    .single();

  // Fetch the event
  const { data: event } = await supabase
    .from('calendar_events')
    .select('*')
    .eq('id', sessionId)
    .single();

  if (!event || event.event_type !== 'live_session' || !event.meeting_url) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground flex-col gap-4">
        <h1 className="text-2xl font-bold">Session Not Found</h1>
        <p className="text-muted-foreground">This live session does not exist or has been deleted.</p>
        <a href={profile?.role === 'admin' ? '/manage/calendar' : '/calendar'} className="text-primary hover:underline">
          Return to Calendar
        </a>
      </div>
    );
  }

  const isAdmin = profile?.role === 'admin';

  return (
    <JitsiClassroomClient
      roomName={event.meeting_url}
      userName={profile?.full_name || user.email?.split('@')[0] || "User"}
      userEmail={user.email || ""}
      isAdmin={isAdmin}
      title={event.title}
    />
  );
}
