import Navigation from "@/components/Navigation";
import { BookOpen, Clock, Trophy, PlayCircle, Lock } from "lucide-react";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function DashboardPage() {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return redirect("/login");

  // Fetch user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  // Fetch enrolled courses
  const { data: enrollments } = await supabase
    .from('enrollments')
    .select(`
      status,
      courses (
        id,
        title,
        thumbnail_url,
        description,
        units (
          lessons ( id )
        )
      )
    `)
    .eq('student_id', user.id);

  // Fetch all lesson_progress for the user
  const { data: lessonProgressList } = await supabase
    .from('lesson_progress')
    .select('lesson_id, is_completed, completed_at')
    .eq('student_id', user.id);
    
  const completedLessonIds = new Set(lessonProgressList?.filter(p => p.is_completed).map(p => p.lesson_id));

  // Process courses and calculate progress
  const processedCourses = (enrollments || []).map(enrollment => {
    const course: any = enrollment.courses;
    if (!course) return null;
    
    let totalLessons = 0;
    let completedLessons = 0;
    
    (course.units || []).forEach((unit: any) => {
      (unit.lessons || []).forEach((lesson: any) => {
        totalLessons++;
        if (completedLessonIds.has(lesson.id)) {
          completedLessons++;
        }
      });
    });
    
    const progressPercentage = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
    
    return {
      id: course.id,
      title: course.title,
      description: course.description,
      thumbnail_url: course.thumbnail_url,
      status: enrollment.status,
      progressPercentage,
      totalLessons,
      completedLessons,
    };
  }).filter(Boolean) as any[];

  const activeCoursesCount = processedCourses.filter(c => c.status === 'active').length;
  const firstName = profile?.full_name?.split(' ')[0] || "Student";

  // Fetch quiz submissions
  const { data: quizSubmissions } = await supabase
    .from('quiz_submissions')
    .select(`
      score,
      submitted_at,
      quizzes (
        title,
        units (
          courses ( title )
        )
      )
    `)
    .eq('student_id', user.id)
    .order('submitted_at', { ascending: false })
    .limit(5);

  // Determine course for "Resume Learning"
  // For simplicity, find the first active course that is not 100% completed
  const resumeCourse = processedCourses.find(c => c.status === 'active' && c.progressPercentage < 100) 
                    || processedCourses.find(c => c.status === 'active');

  return (
    <div className="flex min-h-screen bg-background">
      <Navigation profile={profile} />
      
      <main className="flex-1 p-8 md:p-12 overflow-y-auto">
        <header className="mb-10">
          <h1 className="text-3xl font-bold mb-2 text-foreground">Welcome back, {firstName}!</h1>
          <p className="text-muted-foreground text-sm">Here is what's happening with your courses today.</p>
        </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="clean-panel p-6 rounded-lg flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-muted border border-border flex items-center justify-center text-foreground">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{activeCoursesCount}</p>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Active Courses</p>
            </div>
          </div>
          
          <div className="clean-panel p-6 rounded-lg flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-muted border border-border flex items-center justify-center text-foreground">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{completedLessonIds.size}</p>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Lessons Completed</p>
            </div>
          </div>

          <div className="clean-panel p-6 rounded-lg flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-muted border border-border flex items-center justify-center text-foreground">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{quizSubmissions?.length || 0}</p>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Quizzes Taken</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          <div className="xl:col-span-2 space-y-8">
            {/* Resume Learning Section */}
            {resumeCourse && (
              <section>
                <h2 className="text-lg font-bold mb-4 text-foreground">Resume Learning</h2>
                <div className="clean-panel p-1 rounded-lg">
                  <div className="flex flex-col sm:flex-row gap-6 p-5">
                    <div className="w-full sm:w-48 h-32 bg-muted border border-border rounded-md flex-shrink-0 relative overflow-hidden group">
                      {resumeCourse.thumbnail_url ? (
                        <img src={resumeCourse.thumbnail_url} alt={resumeCourse.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/5">
                          <PlayCircle className="w-10 h-10 text-foreground" />
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1 py-1 flex flex-col">
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                          {resumeCourse.title}
                        </div>
                        <span className="text-xs font-medium bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                          {resumeCourse.progressPercentage}%
                        </span>
                      </div>
                      
                      <h3 className="text-lg font-bold mb-3 text-foreground">Continue where you left off</h3>
                      
                      <div className="w-full bg-muted h-1.5 rounded-full overflow-hidden mb-4">
                        <div className="bg-primary h-full rounded-full transition-all duration-500" style={{ width: `${resumeCourse.progressPercentage}%` }} />
                      </div>
                      
                      <div className="mt-auto">
                        <Link href={`/courses/${resumeCourse.id}`} className="bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium transition-opacity hover:opacity-90 inline-block">
                          Continue Learning
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* All Courses Section */}
            <section>
              <h2 className="text-lg font-bold mb-4 text-foreground">My Courses</h2>
              {processedCourses.length === 0 ? (
                <div className="clean-panel p-12 rounded-lg text-center">
                  <div className="w-16 h-16 bg-muted border border-border rounded-full flex items-center justify-center mx-auto mb-4">
                    <BookOpen className="w-6 h-6 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-bold mb-2 text-foreground">No courses yet</h3>
                  <p className="text-sm text-muted-foreground mb-6">You aren't enrolled in any courses at the moment.</p>
                  <Link href="/courses" className="bg-primary text-primary-foreground px-6 py-2.5 rounded-md text-sm font-medium transition-opacity hover:opacity-90 inline-block">
                    Browse Catalog
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {processedCourses.map(course => (
                    <Link href={`/courses/${course.id}`} key={course.id} className="group">
                      <div className="clean-panel rounded-lg overflow-hidden h-full flex flex-col transition-transform group-hover:-translate-y-1 relative">
                        {course.status === 'pending' && (
                          <div className="absolute top-3 right-3 bg-yellow-500 text-white text-[10px] font-bold px-2 py-1 rounded-md z-10 flex items-center gap-1 shadow-sm">
                            <Lock className="w-3 h-3" /> PENDING APPROVAL
                          </div>
                        )}
                        
                        <div className="h-32 bg-muted border-b border-border relative">
                          {course.thumbnail_url ? (
                            <img src={course.thumbnail_url} alt={course.title} className={`w-full h-full object-cover ${course.status === 'pending' ? 'grayscale opacity-70' : ''}`} />
                          ) : (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <BookOpen className="w-8 h-8 text-muted-foreground/30" />
                            </div>
                          )}
                        </div>
                        
                        <div className="p-4 flex-1 flex flex-col">
                          <h3 className={`font-bold mb-2 group-hover:underline underline-offset-4 ${course.status === 'pending' ? 'text-muted-foreground' : 'text-foreground'}`}>
                            {course.title}
                          </h3>
                          
                          <div className="mt-auto pt-4">
                            <div className="flex justify-between text-xs mb-1.5">
                              <span className="text-muted-foreground">{course.completedLessons} / {course.totalLessons} Lessons</span>
                              <span className="font-medium text-foreground">{course.progressPercentage}%</span>
                            </div>
                            <div className="w-full bg-muted h-1.5 rounded-full overflow-hidden">
                              <div className={`h-full rounded-full transition-all duration-500 ${course.status === 'pending' ? 'bg-muted-foreground' : 'bg-primary'}`} style={{ width: `${course.progressPercentage}%` }} />
                            </div>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </section>
          </div>

          <div className="xl:col-span-1">
            <section className="sticky top-6">
              <h2 className="text-lg font-bold mb-4 text-foreground">Recent Quiz Scores</h2>
              <div className="clean-panel rounded-lg overflow-hidden">
                {(!quizSubmissions || quizSubmissions.length === 0) ? (
                  <div className="p-8 text-center text-muted-foreground text-sm">
                    <Trophy className="w-8 h-8 mx-auto mb-3 opacity-20" />
                    No quiz attempts yet.
                  </div>
                ) : (
                  <div className="divide-y divide-border">
                    {quizSubmissions.map((sub: any, idx: number) => {
                      const courseTitle = sub.quizzes?.units?.courses?.title || 'Course';
                      const quizTitle = sub.quizzes?.title || 'Quiz';
                      const isGoodScore = sub.score >= 80;
                      
                      return (
                        <div key={idx} className="p-4 hover:bg-muted/30 transition-colors">
                          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
                            {courseTitle}
                          </p>
                          <p className="text-sm font-semibold text-foreground mb-2">
                            {quizTitle}
                          </p>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">
                              {new Date(sub.submitted_at).toLocaleDateString()}
                            </span>
                            <span className={`text-xs font-bold px-2 py-1 rounded-md ${isGoodScore ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                              {sub.score}%
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
