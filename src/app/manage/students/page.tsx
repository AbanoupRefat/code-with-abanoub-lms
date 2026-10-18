import AdminNavigation from "@/components/AdminNavigation";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { StudentsTable, type StudentRow } from "./StudentsTable";

function getActivityStatus(lastActiveAt: string | null) {
  if (!lastActiveAt) return { label: 'Never', color: 'text-muted-foreground', dot: 'bg-muted-foreground' };
  const diff = Date.now() - new Date(lastActiveAt).getTime();
  const minutes = diff / 1000 / 60;
  const hours = minutes / 60;
  const days = hours / 24;
  if (minutes < 15) return { label: 'Active now', color: 'text-green-600', dot: 'bg-green-500 animate-pulse' };
  if (hours < 24) return { label: `${Math.floor(hours)}h ago`, color: 'text-green-600/70', dot: 'bg-green-400' };
  if (days < 7) return { label: `${Math.floor(days)}d ago`, color: 'text-amber-600', dot: 'bg-amber-500' };
  return { label: `${Math.floor(days)}d ago`, color: 'text-red-500/80', dot: 'bg-red-400' };
}

export default async function ManageStudentsPage() {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return redirect("/login");
  
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (profile?.role !== 'admin') return redirect("/dashboard");

  const { data: students } = await supabase
    .from('profiles')
    .select('*')
    .eq('role', 'student')
    .order('last_active_at', { ascending: false, nullsFirst: false });

  const rows: StudentRow[] = (students ?? []).map((student) => {
    const lastActiveAt = (student as any).last_active_at as string | null;
    const activity = getActivityStatus(lastActiveAt);
    return {
      id: student.id,
      fullName: student.full_name || "Unknown User",
      email: (student as any).email || "—",
      avatarUrl: student.avatar_url || null,
      activityLabel: activity.label,
      activityColor: activity.color,
      activityDot: activity.dot,
      lastActiveText: lastActiveAt
        ? new Date(lastActiveAt).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })
        : null,
      joinedText: new Date(student.created_at).toLocaleDateString(),
    };
  });

  return (
    <div className="flex min-h-screen bg-background">
      <AdminNavigation />
      
      <main className="flex-1 p-8 md:p-12 overflow-y-auto">
        <header className="mb-10">
          <h1 className="text-3xl font-bold mb-2 text-foreground">Students</h1>
          <p className="text-muted-foreground text-sm">Manage enrolled students. Sorted by most recent activity.</p>
        </header>

        <StudentsTable students={rows} />
      </main>
    </div>
  );
}
