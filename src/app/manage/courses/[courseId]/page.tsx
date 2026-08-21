import AdminNavigation from "@/components/AdminNavigation";
import { createUnit, createLesson } from "../../actions";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";

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

  return (
    <div className="flex min-h-screen bg-background">
      <AdminNavigation />
      <main className="flex-1 p-8 md:p-12 overflow-y-auto">
        <h1 className="text-3xl font-bold mb-2 text-foreground">{course.title}</h1>
        <p className="text-muted-foreground mb-8 text-sm">Manage curriculum</p>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-foreground">Add Unit</h2>
            <form action={createUnit.bind(null, courseId)} className="clean-panel p-4 rounded-lg space-y-4">
              <input type="text" name="title" placeholder="Unit Title" required className="w-full bg-background border border-border rounded-md px-3 py-2 text-foreground" />
              <input type="number" name="order_index" placeholder="Order (e.g. 1)" required className="w-full bg-background border border-border rounded-md px-3 py-2 text-foreground" />
              <button type="submit" className="w-full bg-primary text-primary-foreground px-4 py-2 rounded-md hover:opacity-90 transition-opacity">Create Unit</button>
            </form>
            
            <h2 className="text-xl font-bold text-foreground mt-8">Add Lesson</h2>
            <form action={async (formData) => {
              "use server";
              const unitId = formData.get("unit_id") as string;
              if(unitId) await createLesson(unitId, courseId, formData);
            }} className="clean-panel p-4 rounded-lg space-y-4">
              <select name="unit_id" required className="w-full bg-background border border-border rounded-md px-3 py-2 text-foreground">
                <option value="">Select Unit...</option>
                {course.units?.map((u: any) => <option key={u.id} value={u.id}>{u.title}</option>)}
              </select>
              <input type="text" name="title" placeholder="Lesson Title" required className="w-full bg-background border border-border rounded-md px-3 py-2 text-foreground" />
              <input type="text" name="video_provider" placeholder="Provider (youtube, vimeo)" className="w-full bg-background border border-border rounded-md px-3 py-2 text-foreground" />
              <input type="text" name="video_url" placeholder="Video URL" className="w-full bg-background border border-border rounded-md px-3 py-2 text-foreground" />
              <input type="number" name="order_index" placeholder="Order (e.g. 1)" required className="w-full bg-background border border-border rounded-md px-3 py-2 text-foreground" />
              <button type="submit" className="w-full bg-primary text-primary-foreground px-4 py-2 rounded-md hover:opacity-90 transition-opacity">Create Lesson</button>
            </form>

            <h2 className="text-xl font-bold text-foreground mt-8">Add Quiz</h2>
            <form action={async (formData) => {
              "use server";
              const { createQuiz } = await import('../../actions');
              const unitId = formData.get("unit_id") as string;
              if(unitId) await createQuiz(unitId, courseId, formData);
            }} className="clean-panel p-4 rounded-lg space-y-4">
              <select name="unit_id" required className="w-full bg-background border border-border rounded-md px-3 py-2 text-foreground">
                <option value="">Select Unit...</option>
                {course.units?.map((u: any) => <option key={u.id} value={u.id}>{u.title}</option>)}
              </select>
              <input type="text" name="title" placeholder="Quiz Title" required className="w-full bg-background border border-border rounded-md px-3 py-2 text-foreground" />
              <textarea name="description" placeholder="Instructions / Description" rows={2} className="w-full bg-background border border-border rounded-md px-3 py-2 text-foreground" />
              <input type="number" name="order_index" placeholder="Order (e.g. 99)" required className="w-full bg-background border border-border rounded-md px-3 py-2 text-foreground" />
              <label className="flex items-center gap-2 text-sm text-foreground">
                <input type="checkbox" name="show_grade_immediately" className="rounded border-border bg-background" />
                Show grade immediately after submission (uncheck to hide)
              </label>
              <button type="submit" className="w-full border border-primary text-primary px-4 py-2 rounded-md hover:bg-primary hover:text-primary-foreground transition-colors">Create Quiz</button>
            </form>
          </div>
          
          <div>
            <h2 className="text-xl font-bold text-foreground mb-4">Curriculum</h2>
            <div className="space-y-4">
              {course.units?.slice().sort((a:any,b:any)=>a.order_index-b.order_index).map((unit: any) => (
                <div key={unit.id} className="clean-panel p-4 rounded-lg">
                  <h3 className="font-bold text-foreground">{unit.title}</h3>
                  <div className="mt-4 space-y-2 pl-4 border-l-2 border-border">
                    {unit.lessons?.slice().sort((a:any,b:any)=>a.order_index-b.order_index).map((lesson: any) => (
                      <div key={lesson.id} className="text-sm text-muted-foreground flex items-center gap-2">
                        <span className="w-4 h-4 bg-muted rounded-sm flex items-center justify-center text-[10px]">{lesson.order_index}</span>
                        {lesson.title}
                      </div>
                    ))}
                    {unit.quizzes?.slice().sort((a:any,b:any)=>a.order_index-b.order_index).map((quiz: any) => (
                      <div key={quiz.id} className="text-sm text-primary font-medium flex items-center gap-2 mt-2">
                        <span className="w-4 h-4 bg-primary/20 text-primary rounded-sm flex items-center justify-center text-[10px]">{quiz.order_index}</span>
                        [Quiz] {quiz.title}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
