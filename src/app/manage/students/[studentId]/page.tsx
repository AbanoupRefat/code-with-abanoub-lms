import AdminNavigation from "@/components/AdminNavigation";
import { User, BookOpen, PlusCircle, Trash2, ArrowLeft } from "lucide-react";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { enrollStudent, unenrollStudent } from "../../actions";

export default async function StudentManagementPage({ params }: { params: Promise<{ studentId: string }> }) {
  const supabase = await createClient();
  const { studentId } = await params;
  
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

  // Fetch the specific student
  const { data: student } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', studentId)
    .single();

  if (!student) {
    return (
      <div className="flex min-h-screen bg-background">
        <AdminNavigation />
        <main className="flex-1 p-8 md:p-12"><p>Student not found.</p></main>
      </div>
    );
  }

  // Fetch enrollments with course details
  const { data: enrollments } = await supabase
    .from('enrollments')
    .select(`
      id,
      enrolled_at,
      courses (
        id,
        title,
        is_published
      )
    `)
    .eq('student_id', studentId);

  // Fetch all published courses to populate the enrollment dropdown
  const { data: allCourses } = await supabase
    .from('courses')
    .select('id, title')
    .eq('is_published', true);

  const enrolledCourseIds = (enrollments as any[])?.map(e => e.courses.id) || [];
  const availableCourses = allCourses?.filter(c => !enrolledCourseIds.includes(c.id)) || [];

  return (
    <div className="flex min-h-screen bg-background">
      <AdminNavigation />
      
      <main className="flex-1 p-8 md:p-12 overflow-y-auto">
        <div className="mb-6">
          <Link href="/manage/students" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to Students
          </Link>
        </div>

        <header className="mb-10 flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center text-muted-foreground overflow-hidden border-2 border-border">
            {student.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={student.avatar_url} alt={student.full_name || "User"} className="w-full h-full object-cover" />
            ) : (
              <User className="w-8 h-8" />
            )}
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">{student.full_name || "Unknown User"}</h1>
            <p className="text-muted-foreground text-sm font-mono">ID: {student.id}</p>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          <div className="lg:col-span-2 space-y-6">
            <h2 className="text-xl font-bold flex items-center gap-2 text-foreground">
              <BookOpen className="w-5 h-5" /> Enrolled Courses
            </h2>
            
            <div className="clean-panel rounded-lg overflow-hidden">
              <table className="w-full text-left text-sm border-collapse">
                <thead className="bg-muted border-b border-border">
                  <tr>
                    <th className="px-6 py-3 font-semibold text-muted-foreground">Course Title</th>
                    <th className="px-6 py-3 font-semibold text-muted-foreground">Enrolled On</th>
                    <th className="px-6 py-3 font-semibold text-muted-foreground text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border bg-card">
                  {enrollments?.length === 0 && (
                    <tr>
                      <td colSpan={3} className="px-6 py-8 text-center text-muted-foreground">
                        Not enrolled in any courses.
                      </td>
                    </tr>
                  )}
                  {(enrollments as any[])?.map(enrollment => (
                    <tr key={enrollment.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-6 py-4 font-medium text-foreground">
                        {enrollment.courses.title}
                        {!enrollment.courses.is_published && (
                          <span className="ml-2 text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">Draft</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">
                        {new Date(enrollment.enrolled_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <form action={async () => {
                          "use server";
                          await unenrollStudent(studentId, enrollment.courses.id);
                        }}>
                          <button type="submit" className="text-red-500 hover:text-red-600 transition-colors p-2 rounded-md hover:bg-red-500/10" title="Unenroll">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </form>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <div className="clean-panel p-6 rounded-lg sticky top-8">
              <h3 className="font-bold text-foreground mb-4">Enroll in Course</h3>
              <form action={async (formData: FormData) => {
                "use server";
                const courseId = formData.get("course_id") as string;
                if (courseId) await enrollStudent(studentId, courseId);
              }} className="space-y-4">
                <div>
                  <label htmlFor="course_id" className="block text-sm font-medium text-muted-foreground mb-2">Select a Course</label>
                  <select 
                    id="course_id" 
                    name="course_id" 
                    className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    required
                  >
                    <option value="">-- Choose Course --</option>
                    {availableCourses.map(course => (
                      <option key={course.id} value={course.id}>{course.title}</option>
                    ))}
                  </select>
                </div>
                
                <button 
                  type="submit" 
                  disabled={availableCourses.length === 0}
                  className="w-full flex justify-center items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <PlusCircle className="w-4 h-4" /> 
                  Enroll Student
                </button>
                
                {availableCourses.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center">Student is enrolled in all available courses.</p>
                )}
              </form>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
