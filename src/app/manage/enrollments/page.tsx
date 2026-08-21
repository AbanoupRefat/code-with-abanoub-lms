import AdminNavigation from "@/components/AdminNavigation";
import { Check, X } from "lucide-react";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { approveEnrollment, rejectEnrollment } from "../actions";

export default async function ManageEnrollmentsPage() {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return redirect("/login");
  
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (profile?.role !== 'admin') return redirect("/dashboard");

  const { data: pendingEnrollments } = await supabase
    .from('enrollments')
    .select(`
      id,
      enrolled_at,
      profiles ( full_name, avatar_url, id ),
      courses ( title, id )
    `)
    .eq('status', 'pending')
    .order('enrolled_at', { ascending: true });

  return (
    <div className="flex min-h-screen bg-background">
      <AdminNavigation />
      
      <main className="flex-1 p-8 md:p-12 overflow-y-auto">
        <header className="mb-10">
          <h1 className="text-3xl font-bold mb-2 text-foreground">Pending Enrollments</h1>
          <p className="text-muted-foreground text-sm">Review and approve student course access requests.</p>
        </header>

        <div className="clean-panel rounded-lg overflow-hidden">
          <table className="w-full text-left text-sm border-collapse">
            <thead className="bg-muted border-b border-border">
              <tr>
                <th className="px-6 py-3 font-semibold text-muted-foreground">Student Name</th>
                <th className="px-6 py-3 font-semibold text-muted-foreground">Course Requested</th>
                <th className="px-6 py-3 font-semibold text-muted-foreground">Request Date</th>
                <th className="px-6 py-3 font-semibold text-muted-foreground text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-card">
              {(!pendingEnrollments || pendingEnrollments.length === 0) && (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-muted-foreground">
                    <div className="flex flex-col items-center justify-center">
                      <Check className="w-8 h-8 text-muted-foreground/30 mb-2" />
                      <p>No pending enrollments.</p>
                      <p className="text-xs">All caught up!</p>
                    </div>
                  </td>
                </tr>
              )}
              {pendingEnrollments?.map((enrollment: any) => (
                <tr key={enrollment.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-6 py-4 font-medium text-foreground">
                    {enrollment.profiles?.full_name || "Unknown Student"}
                  </td>
                  <td className="px-6 py-4 text-foreground">
                    {enrollment.courses?.title || "Unknown Course"}
                  </td>
                  <td className="px-6 py-4 text-muted-foreground">
                    {new Date(enrollment.enrolled_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <form action={approveEnrollment.bind(null, enrollment.id)}>
                        <button type="submit" className="bg-green-100 text-green-700 hover:bg-green-200 px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1 transition-colors">
                          <Check className="w-3 h-3" /> Approve
                        </button>
                      </form>
                      <form action={rejectEnrollment.bind(null, enrollment.id)}>
                        <button type="submit" className="bg-red-100 text-red-700 hover:bg-red-200 px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1 transition-colors">
                          <X className="w-3 h-3" /> Reject
                        </button>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
