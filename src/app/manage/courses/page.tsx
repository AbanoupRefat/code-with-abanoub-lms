import AdminNavigation from "@/components/AdminNavigation";
import { BookOpen, PlusCircle } from "lucide-react";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function ManageCoursesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return redirect("/login");
  
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (profile?.role !== 'admin') return redirect("/dashboard");

  const { data: courses } = await supabase.from('courses').select('*').order('created_at', { ascending: false });

  return (
    <div className="flex min-h-screen bg-background">
      <AdminNavigation />
      <main className="flex-1 p-8 md:p-12 overflow-y-auto">
        <header className="mb-10 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold mb-2 text-foreground">Courses</h1>
            <p className="text-muted-foreground text-sm">Manage your course catalog.</p>
          </div>
          <Link href="/manage/courses/new" className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md hover:opacity-90 transition-opacity">
            <PlusCircle className="w-4 h-4" /> Create Course
          </Link>
        </header>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses?.length === 0 && <p className="text-muted-foreground">No courses created yet.</p>}
          {courses?.map(course => (
            <Link href={`/manage/courses/${course.id}`} key={course.id} className="clean-panel p-6 rounded-lg block hover:border-primary transition-colors">
              <h3 className="font-bold text-foreground mb-2">{course.title}</h3>
              <p className="text-sm text-muted-foreground mb-4">{course.is_published ? "Published" : "Draft"}</p>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
