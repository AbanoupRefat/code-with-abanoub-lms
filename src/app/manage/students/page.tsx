import AdminNavigation from "@/components/AdminNavigation";
import { Users, User, ArrowRight } from "lucide-react";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";

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

  return (
    <div className="flex min-h-screen bg-background">
      <AdminNavigation />
      
      <main className="flex-1 p-8 md:p-12 overflow-y-auto">
        <header className="mb-10">
          <h1 className="text-3xl font-bold mb-2 text-foreground">Students</h1>
          <p className="text-muted-foreground text-sm">Manage enrolled students. Sorted by most recent activity.</p>
        </header>

        <div className="clean-panel rounded-lg overflow-hidden">
          <table className="w-full text-left text-sm border-collapse">
            <thead className="bg-muted border-b border-border">
              <tr>
                <th className="px-6 py-3 font-semibold text-muted-foreground">Student Name</th>
                <th className="px-6 py-3 font-semibold text-muted-foreground">Email</th>
                <th className="px-6 py-3 font-semibold text-muted-foreground">Last Active</th>
                <th className="px-6 py-3 font-semibold text-muted-foreground">Joined</th>
                <th className="px-6 py-3 font-semibold text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-card">
              {students?.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">
                    No students found.
                  </td>
                </tr>
              )}
              {students?.map(student => {
                const activity = getActivityStatus((student as any).last_active_at);
                return (
                  <tr key={student.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground overflow-hidden">
                          {student.avatar_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={student.avatar_url} alt={student.full_name || "User"} className="w-full h-full object-cover" />
                          ) : (
                            <User className="w-4 h-4" />
                          )}
                        </div>
                        <span className="font-medium text-foreground">{student.full_name || "Unknown User"}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground text-xs">{(student as any).email || '—'}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${activity.dot}`} />
                        <span className={`text-sm font-medium ${activity.color}`}>{activity.label}</span>
                      </div>
                      {(student as any).last_active_at && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {new Date((student as any).last_active_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </p>
                      )}
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">
                      {new Date(student.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <Link href={`/manage/students/${student.id}`} className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
                        Manage <ArrowRight className="w-4 h-4" />
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
