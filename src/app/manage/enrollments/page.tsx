import AdminNavigation from "@/components/AdminNavigation";
import { Users } from "lucide-react";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import EnrollmentToggle from "@/components/EnrollmentToggle";

export default async function ManageEnrollmentsPage() {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return redirect("/login");
  
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (profile?.role !== 'admin') return redirect("/dashboard");

  const { data: enrollments } = await supabase
    .from('enrollments')
    .select(`
      id,
      status,
      enrolled_at,
      profiles ( full_name, avatar_url, id ),
      courses ( title, id )
    `)
    .order('enrolled_at', { ascending: false });

  return (
    <div className="flex min-h-screen bg-background">
      <AdminNavigation />
      
      <main className="flex-1 p-8 md:p-12 overflow-y-auto">
        <header className="mb-10">
          <h1 className="text-3xl font-bold mb-2 text-foreground">Course Approvals</h1>
          <p className="text-muted-foreground text-sm">Toggle student access to courses and Google Drive folders.</p>
        </header>

        <div className="clean-panel rounded-lg overflow-hidden">
          <table className="w-full text-left text-sm border-collapse">
            <thead className="bg-muted border-b border-border">
              <tr>
                <th className="px-6 py-3 font-semibold text-muted-foreground">Student Name</th>
                <th className="px-6 py-3 font-semibold text-muted-foreground">Course</th>
                <th className="px-6 py-3 font-semibold text-muted-foreground">Date</th>
                <th className="px-6 py-3 font-semibold text-muted-foreground">Status</th>
                <th className="px-6 py-3 font-semibold text-muted-foreground text-right">Access</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-card">
              {(!enrollments || enrollments.length === 0) && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                    <div className="flex flex-col items-center justify-center">
                      <Users className="w-8 h-8 text-muted-foreground/30 mb-2" />
                      <p>No enrollments found.</p>
                    </div>
                  </td>
                </tr>
              )}
              {enrollments?.map((enrollment: any) => {
                const isActive = enrollment.status === 'active';
                
                return (
                  <tr key={enrollment.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4 font-medium text-foreground">
                      {enrollment.profiles?.full_name || "Unknown Student"}
                    </td>
                    <td className="px-6 py-4 text-foreground">
                      {enrollment.courses?.title || "Unknown Course"}
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">
                      {new Date(enrollment.enrolled_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td className="px-6 py-4">
                      {enrollment.status === 'pending' && (
                        <span className="bg-yellow-100 text-yellow-800 text-xs font-semibold px-2 py-1 rounded-full dark:bg-yellow-900/30 dark:text-yellow-500">
                          Pending
                        </span>
                      )}
                      {enrollment.status === 'active' && (
                        <span className="bg-green-100 text-green-800 text-xs font-semibold px-2 py-1 rounded-full dark:bg-green-900/30 dark:text-green-500">
                          Active
                        </span>
                      )}
                      {enrollment.status === 'revoked' && (
                        <span className="bg-red-100 text-red-800 text-xs font-semibold px-2 py-1 rounded-full dark:bg-red-900/30 dark:text-red-500">
                          Revoked
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 flex justify-end">
                      <EnrollmentToggle enrollmentId={enrollment.id} initialIsActive={isActive} />
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
