import Navigation from "@/components/Navigation";
import Link from "next/link";
import { PlayCircle, FileText, CheckCircle2, ChevronLeft, Video } from "lucide-react";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { toggleLessonComplete } from "@/app/courses/actions";

export default async function CoursePlayerPage(props: { 
  params: Promise<{ courseId: string }>,
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const params = await props.params;
  const searchParams = await props.searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return redirect("/login");

  const courseId = params.courseId;
  const activeLessonId = typeof searchParams.lessonId === 'string' ? searchParams.lessonId : undefined;

  // Fetch course, units, and lessons
  const { data: course } = await supabase
    .from('courses')
    .select('*, units(*, lessons(*), quizzes(*))')
    .eq('id', courseId)
    .single();

  if (!course || !course.is_published) return redirect("/courses");

  // Check enrollment (admins bypass this)
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();
    
  if (profile?.role !== 'admin') {
    const { data: enrollment } = await supabase
      .from('enrollments')
      .select('id, status')
      .eq('course_id', courseId)
      .eq('student_id', user.id)
      .single();
      
    if (!enrollment) {
      return (
        <div className="flex min-h-screen bg-background">
          <Navigation profile={null} />
          <main className="flex-1 p-8 md:p-12 flex flex-col items-center justify-center text-center">
            <h1 className="text-3xl font-bold mb-4 text-foreground">Enroll in {course.title}</h1>
            <p className="text-muted-foreground mb-8">You must be enrolled in this course to view its content.</p>
            <form action={async () => {
              "use server";
              const { requestEnrollment } = await import('@/app/courses/actions');
              await requestEnrollment(courseId);
            }}>
              <button type="submit" className="bg-primary text-primary-foreground px-8 py-3 rounded-md font-bold hover:opacity-90 transition-opacity">
                Request Enrollment
              </button>
            </form>
            <Link href="/courses" className="mt-6 text-sm text-muted-foreground hover:text-foreground underline">
              Back to Catalog
            </Link>
          </main>
        </div>
      );
    } else if (enrollment.status === 'pending') {
      return (
        <div className="flex min-h-screen bg-background">
          <Navigation profile={null} />
          <main className="flex-1 p-8 md:p-12 flex flex-col items-center justify-center text-center">
            <div className="bg-muted/50 p-8 rounded-lg max-w-lg w-full border border-border">
              <h1 className="text-2xl font-bold mb-4 text-foreground">Enrollment Pending</h1>
              <p className="text-foreground mb-4">
                Please send the receipt of payment to WhatsApp number <strong className="text-primary">01017747943</strong>.
              </p>
              <p className="text-sm text-muted-foreground">
                Your acceptance might take up to 1 working day.
              </p>
            </div>
            <Link href="/courses" className="mt-8 text-primary hover:underline">Back to Catalog</Link>
          </main>
        </div>
      );
    }
  }

  // Fetch user progress for this course's lessons
  const { data: progressList } = await supabase
    .from('lesson_progress')
    .select('lesson_id, is_completed')
    .eq('student_id', user.id);
    
  const completedLessonIds = new Set(progressList?.filter(p => p.is_completed).map(p => p.lesson_id));

  // Sort units and lessons
  const units = course.units?.slice().sort((a: any, b: any) => a.order_index - b.order_index) || [];
  
  // Flatten all lessons to calculate overall progress and find active lesson
  let allLessons: any[] = [];
  units.forEach((u: any) => {
    u.lessons = u.lessons?.slice().sort((a: any, b: any) => a.order_index - b.order_index) || [];
    allLessons = allLessons.concat(u.lessons);
  });

  // Calculate locked status for each lesson
  allLessons.forEach((lesson, index) => {
    if (index === 0) {
      lesson.isLocked = false;
    } else {
      const prevLesson = allLessons[index - 1];
      lesson.isLocked = !completedLessonIds.has(prevLesson.id);
    }
  });

  const totalLessons = allLessons.length;
  const completedCount = completedLessonIds.size;
  const progressPercentage = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;

  // Determine active lesson (either from URL param or the first incomplete one, or first overall)
  let activeLesson = allLessons.find(l => l.id === activeLessonId);
  if (!activeLesson && allLessons.length > 0 && !searchParams.quizId) {
    activeLesson = allLessons.find(l => !completedLessonIds.has(l.id)) || allLessons[0];
  }

  const isActiveLessonCompleted = activeLesson ? completedLessonIds.has(activeLesson.id) : false;

  return (
    <div className="flex min-h-screen bg-background">
      <Navigation profile={null} />
      
      <main className="flex-1 flex flex-col md:flex-row h-screen">
        {/* Left Side: Video/Content Player */}
        <div className="flex-1 flex flex-col bg-muted/20 border-r border-border overflow-y-auto">
          <div className="p-4 flex items-center justify-between border-b border-border bg-card">
            <div className="flex items-center gap-4">
              <Link href="/courses" className="text-muted-foreground hover:text-foreground transition-colors">
                <ChevronLeft className="w-5 h-5" />
              </Link>
              <h2 className="font-semibold text-lg text-foreground">{course.title}</h2>
            </div>
            
            {activeLesson && !searchParams.quizId && !activeLesson.isLocked && (
              <form action={toggleLessonComplete.bind(null, activeLesson.id, courseId, isActiveLessonCompleted)}>
                <button type="submit" className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${isActiveLessonCompleted ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-primary text-primary-foreground hover:opacity-90'}`}>
                  {isActiveLessonCompleted && <CheckCircle2 className="w-4 h-4" />}
                  {isActiveLessonCompleted ? 'Completed' : 'Mark as Complete'}
                </button>
              </form>
            )}
          </div>
          
          {!searchParams.quizId && (
            <div className="w-full aspect-video bg-black flex items-center justify-center relative">
              {activeLesson?.isLocked ? (
                 <div className="text-center text-white p-8">
                   <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
                     <span className="text-2xl">🔒</span>
                   </div>
                   <h2 className="text-xl font-bold mb-2">Lesson Locked</h2>
                   <p className="text-white/60">You must complete the previous lesson before accessing this one.</p>
                 </div>
              ) : activeLesson?.video_url ? (
                <>
                  <iframe 
                    src={(() => {
                      const url = activeLesson.video_url;
                      if (url.includes('youtube.com/watch?v=')) return url.replace('watch?v=', 'embed/');
                      if (url.includes('youtu.be/')) return url.replace('youtu.be/', 'youtube.com/embed/');
                      if (url.includes('drive.google.com/file/d/')) return url.replace(/\/view.*$/, '/preview');
                      return url;
                    })()}
                    className="w-full h-full border-0"
                    allowFullScreen
                  />
                  {activeLesson.video_url.includes('drive.google.com') && (
                    <div 
                      className="absolute top-0 right-0 w-[60px] h-[60px] z-10 bg-transparent"
                    />
                  )}
                </>
              ) : (
                <div className="text-center">
                  <Video className="w-12 h-12 text-white/30 mx-auto mb-4" />
                  <p className="text-white/50">{activeLesson ? 'No video provided' : 'No lessons available'}</p>
                </div>
              )}
            </div>
          )}

          <div className="p-8 max-w-4xl mx-auto w-full bg-card min-h-full flex-1">
            {searchParams.quizId ? (() => {
               // @ts-ignore
               const activeQuiz = course.units.flatMap((u:any) => u.quizzes || []).find((q:any) => q.id === searchParams.quizId);
               if (!activeQuiz) return <p>Quiz not found.</p>;
               return (
                 <div className="flex flex-col items-center justify-center h-full text-center py-20">
                   <h1 className="text-4xl font-bold mb-4 text-foreground">{activeQuiz.title}</h1>
                   <p className="text-xl text-muted-foreground mb-8">{activeQuiz.description || 'Test your knowledge!'}</p>
                   <div className="bg-muted p-8 rounded-lg max-w-md w-full border border-border">
                     <p className="text-foreground mb-6 font-medium">Interactive quiz player UI is under construction!</p>
                     <button disabled className="w-full bg-primary text-primary-foreground py-3 rounded-md font-bold opacity-50 cursor-not-allowed">
                       Start Quiz
                     </button>
                   </div>
                 </div>
               );
            })() : activeLesson ? (
              <>
                <h1 className="text-3xl font-bold mb-6 text-foreground">{activeLesson.title}</h1>
                <div className="prose prose-zinc max-w-none text-foreground">
                  <p>{activeLesson.content || activeLesson.description || 'No additional content provided for this lesson.'}</p>
                </div>
              </>
            ) : (
              <div className="text-center py-12">
                <h2 className="text-xl font-medium text-muted-foreground">Select a lesson to begin.</h2>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Course Curriculum Sidebar */}
        <div className="w-full md:w-80 lg:w-[400px] bg-card flex flex-col h-full overflow-y-auto border-l border-border">
          <div className="p-6 border-b border-border">
            <h3 className="font-bold text-lg mb-3 text-foreground">Course Content</h3>
            <div className="w-full bg-muted h-2 rounded-full overflow-hidden">
              <div className="bg-primary h-full rounded-full transition-all duration-500" style={{ width: `${progressPercentage}%` }} />
            </div>
            <p className="text-xs text-muted-foreground mt-2 font-medium">{progressPercentage}% Completed</p>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            {units.length === 0 && (
              <p className="text-sm text-muted-foreground">No units available.</p>
            )}
            {units.map((unit: any) => (
              <div key={unit.id}>
                <h4 className="font-semibold text-xs text-muted-foreground mb-3 uppercase tracking-wider">{unit.title}</h4>
                <div className="space-y-2">
                  {unit.lessons.length === 0 && (!unit.quizzes || unit.quizzes.length === 0) && (
                    <p className="text-xs text-muted-foreground italic px-2">No content in this unit.</p>
                  )}
                  {unit.lessons.map((lesson: any) => {
                    const isCompleted = completedLessonIds.has(lesson.id);
                    const isCurrent = activeLesson?.id === lesson.id && !searchParams.quizId;
                    
                    if (lesson.isLocked) {
                      return (
                        <div key={lesson.id} className="block p-3 rounded-md flex items-center gap-3 border border-transparent opacity-60 cursor-not-allowed">
                          <div className="flex-shrink-0">
                            <div className="w-5 h-5 rounded-full border-2 border-muted-foreground flex items-center justify-center">
                              <span className="text-[10px]">🔒</span>
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate text-muted-foreground">
                              {lesson.title}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs text-muted-foreground">Locked</span>
                            </div>
                          </div>
                        </div>
                      );
                    }

                    return (
                      <Link href={`/courses/${courseId}?lessonId=${lesson.id}`} key={lesson.id} className="block">
                        <div 
                          className={`p-3 rounded-md flex items-center gap-3 transition-colors ${
                            isCurrent ? "bg-muted border border-border" : "hover:bg-muted/50 border border-transparent"
                          }`}
                        >
                          <div className="flex-shrink-0">
                            {isCompleted ? (
                              <CheckCircle2 className="w-5 h-5 text-green-500" />
                            ) : (
                              <div className="w-5 h-5 rounded-full border-2 border-muted-foreground" />
                            )}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-medium truncate ${isCurrent ? "text-foreground" : "text-muted-foreground"}`}>
                              {lesson.title}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              {lesson.video_provider ? (
                                <PlayCircle className="w-3 h-3 text-muted-foreground" />
                              ) : (
                                <FileText className="w-3 h-3 text-muted-foreground" />
                              )}
                              <span className="text-xs text-muted-foreground capitalize">{lesson.video_provider || 'Text'}</span>
                            </div>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                  
                  {unit.quizzes?.slice().sort((a:any,b:any)=>a.order_index-b.order_index).map((quiz: any) => {
                    const isCurrentQuiz = searchParams.quizId === quiz.id;
                    return (
                      <Link href={`/courses/${courseId}?quizId=${quiz.id}`} key={quiz.id} className="block mt-2">
                        <div 
                          className={`p-3 rounded-md flex items-center gap-3 transition-colors ${
                            isCurrentQuiz ? "bg-primary/10 border border-primary/30" : "hover:bg-muted/50 border border-transparent"
                          }`}
                        >
                          <div className="flex-shrink-0">
                            <div className="w-5 h-5 rounded-full border-2 border-primary flex items-center justify-center text-[10px] text-primary font-bold">Q</div>
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-medium truncate ${isCurrentQuiz ? "text-foreground" : "text-primary"}`}>
                              {quiz.title}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">Assignment / Quiz</p>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
