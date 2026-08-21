import AdminNavigation from "@/components/AdminNavigation";
import { Users, User, ArrowRight } from "lucide-react";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function ManageStudentsPage() {
  const supabase = await createClient();
  
  // Ensure the user is an admin
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return redirect("/login");
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();
    
  if (profile?.role !== 'admin') {
    return redirect("/dashboard");
  }

  // Fetch students
  const { data: students } = await supabase
    .from('profiles')
    .select('*')
    .eq('role', 'student')
    .order('created_at', { ascending: false });

  return (
    <div className="flex min-h-screen bg-background">
      <AdminNavigation />
      
      <main className="flex-1 p-8 md:p-12 overflow-y-auto">
        <header className="mb-10">
          <h1 className="text-3xl font-bold mb-2 text-foreground">Students</h1>
          <p className="text-muted-foreground text-sm">Manage enrolled students and access control.</p>
        </header>

        <div className="clean-panel rounded-lg overflow-hidden">
          <table className="w-full text-left text-sm border-collapse">
            <thead className="bg-muted border-b border-border">
              <tr>
                <th className="px-6 py-3 font-semibold text-muted-foreground">Student Name</th>
                <th className="px-6 py-3 font-semibold text-muted-foreground">ID</th>
                <th className="px-6 py-3 font-semibold text-muted-foreground">Joined</th>
                <th className="px-6 py-3 font-semibold text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-card">
              {students?.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-muted-foreground">
                    No students found.
                  </td>
                </tr>
              )}
              {students?.map(student => (
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
                  <td className="px-6 py-4 font-mono text-xs text-muted-foreground">
                    {student.id.substring(0, 8)}...
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
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
