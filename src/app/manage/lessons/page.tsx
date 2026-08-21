import AdminNavigation from "@/components/AdminNavigation";
import { FileVideo, Search, ExternalLink } from "lucide-react";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function ManageLessonsPage() {
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

  // Fetch all lessons with their parent unit and course
  const { data: lessons } = await supabase
    .from('lessons')
    .select(`
      id,
      title,
      video_provider,
      created_at,
      units (
        id,
        title,
        courses (
          id,
          title
        )
      )
    `)
    .order('created_at', { ascending: false });

  return (
    <div className="flex min-h-screen bg-background">
      <AdminNavigation />
      
      <main className="flex-1 p-8 md:p-12 overflow-y-auto">
        <header className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-2 text-foreground">All Lessons</h1>
            <p className="text-muted-foreground text-sm">Global view of all lessons across all courses.</p>
          </div>
          
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input 
              type="text" 
              placeholder="Search lessons..." 
              className="w-full bg-background border border-border rounded-md pl-9 pr-4 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        </header>

        <div className="clean-panel rounded-lg overflow-hidden">
          <table className="w-full text-left text-sm border-collapse">
            <thead className="bg-muted border-b border-border">
              <tr>
                <th className="px-6 py-3 font-semibold text-muted-foreground">Lesson Title</th>
                <th className="px-6 py-3 font-semibold text-muted-foreground">Course / Unit</th>
                <th className="px-6 py-3 font-semibold text-muted-foreground">Type</th>
                <th className="px-6 py-3 font-semibold text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-card">
              {lessons?.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-muted-foreground">
                    No lessons found. Create some inside a course!
                  </td>
                </tr>
              )}
              {lessons?.map((lesson: any) => (
                <tr key={lesson.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <FileVideo className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium text-foreground">{lesson.title}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-foreground font-medium">{lesson.units?.courses?.title || "Unknown Course"}</span>
                      <span className="text-xs text-muted-foreground">{lesson.units?.title || "Unknown Unit"}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-muted-foreground capitalize">
                    {lesson.video_provider || 'Text / Doc'}
                  </td>
                  <td className="px-6 py-4">
                    {lesson.units?.courses?.id && (
                      <Link href={`/manage/courses/${lesson.units.courses.id}`} className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
                        Edit Course <ExternalLink className="w-4 h-4" />
                      </Link>
                    )}
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
