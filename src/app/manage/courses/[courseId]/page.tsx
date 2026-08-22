import AdminNavigation from "@/components/AdminNavigation";
import { createUnit, updateCourse, deleteCourse } from "../../actions";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import ServiceAccountHelper from "@/components/ServiceAccountHelper";
import SubmitButton from "@/components/SubmitButton";
import CourseManagerTabs from "@/components/CourseManagerTabs";
import CurriculumTab from "@/components/CurriculumTab";

export default async function ManageCourseDetailsPage({ params }: { params: Promise<{ courseId: string }> }) {
  const supabase = await createClient();
  const { courseId } = await params;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return redirect("/login");
  
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (profile?.role !== 'admin') return redirect("/dashboard");

  const { data: course, error } = await supabase.from('courses').select('*, units(*, lessons(*), quizzes(*))').eq('id', courseId).single();
  
  if (error) {
    console.error("DEBUG ERROR fetching course details:", error);
  }
  
  if (!course) {
    console.log("DEBUG: Course is null, redirecting back to /manage/courses");
    return redirect("/manage/courses");
  }

  const settingsContent = (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
      {course.drive_folder_id && (
        <ServiceAccountHelper email={process.env.GOOGLE_CLIENT_EMAIL} />
      )}
      <div className="clean-panel p-6 rounded-lg space-y-4 shadow-sm border border-border">
        <h2 className="text-xl font-bold text-foreground mb-4">Course Settings</h2>
        <form action={updateCourse.bind(null, courseId)} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Course Title</label>
            <input type="text" name="title" defaultValue={course.title} required className="w-full bg-background border border-border rounded-md px-3 py-2 text-foreground" />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Description</label>
            <textarea name="description" defaultValue={course.description} rows={4} className="w-full bg-background border border-border rounded-md px-3 py-2 text-foreground" />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Thumbnail URL</label>
            <input type="text" name="thumbnail_url" defaultValue={course.thumbnail_url || ""} className="w-full bg-background border border-border rounded-md px-3 py-2 text-foreground" />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Google Drive Folder ID</label>
            <input type="text" name="drive_folder_id" defaultValue={course.drive_folder_id || ""} className="w-full bg-background border border-border rounded-md px-3 py-2 text-foreground" />
          </div>
          <div className="flex items-center gap-2 pt-2 pb-4">
            <input type="checkbox" name="is_published" id="is_published" defaultChecked={course.is_published} className="w-4 h-4 rounded border-border" />
            <label htmlFor="is_published" className="text-sm font-medium text-foreground">Publish Course Immediately</label>
          </div>
          <div className="flex justify-between items-center border-t border-border pt-4 mt-6">
            <SubmitButton 
              variant="destructive" 
              label="Delete Course" 
              loadingLabel="Deleting..." 
              formAction={async () => {
                "use server";
                await deleteCourse(courseId);
              }}
            />
            <SubmitButton label="Save Changes" loadingLabel="Saving..." />
          </div>
        </form>
      </div>
    </div>
  );

  const curriculumContent = <CurriculumTab courseId={courseId} units={course.units || []} />;

  return (
    <div className="flex min-h-screen bg-background">
      <AdminNavigation />
      <main className="flex-1 p-8 md:p-12 overflow-y-auto">
        <div className="max-w-5xl mx-auto">
          <header className="mb-8">
            <p className="text-primary text-sm font-semibold tracking-wider uppercase mb-1">Course Management</p>
            <h1 className="text-3xl font-bold text-foreground">{course.title}</h1>
          </header>
          
          <CourseManagerTabs 
            settingsContent={settingsContent} 
            curriculumContent={curriculumContent} 
          />
        </div>
      </main>
    </div>
  );
}
