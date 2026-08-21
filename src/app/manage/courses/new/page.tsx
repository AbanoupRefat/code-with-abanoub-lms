import AdminNavigation from "@/components/AdminNavigation";
import { createCourse } from "../../actions";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";

export default async function NewCoursePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return redirect("/login");
  
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (profile?.role !== 'admin') return redirect("/dashboard");

  return (
    <div className="flex min-h-screen bg-background">
      <AdminNavigation />
      <main className="flex-1 p-8 md:p-12 overflow-y-auto">
        <h1 className="text-3xl font-bold mb-6 text-foreground">Create New Course</h1>
        <div className="max-w-2xl clean-panel p-6 rounded-lg">
          <form action={createCourse} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1 text-foreground">Title</label>
              <input type="text" name="title" required className="w-full bg-background border border-border rounded-md px-3 py-2 text-foreground" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-foreground">Description</label>
              <textarea name="description" rows={4} className="w-full bg-background border border-border rounded-md px-3 py-2 text-foreground" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-foreground">Thumbnail URL</label>
              <input type="text" name="thumbnail_url" className="w-full bg-background border border-border rounded-md px-3 py-2 text-foreground" />
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" name="is_published" id="is_published" />
              <label htmlFor="is_published" className="text-sm text-foreground">Publish immediately</label>
            </div>
            <button type="submit" className="bg-primary text-primary-foreground px-4 py-2 rounded-md font-medium hover:opacity-90 transition-opacity">Create Course</button>
          </form>
        </div>
      </main>
    </div>
  );
}
