import Navigation from "@/components/Navigation";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { updateProfile } from "./actions";
import { User, Mail, Shield, BookOpen, Clock, Trophy, Lock } from "lucide-react";
import Link from "next/link";

export default async function ProfilePage() {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return redirect("/login");

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  // Fetch enrollments
  const { data: enrollments } = await supabase
    .from('enrollments')
    .select(`
      status,
      courses ( title, id )
    `)
    .eq('student_id', user.id);

  // Fetch all lesson_progress for the user
  const { data: lessonProgressList } = await supabase
    .from('lesson_progress')
    .select('lesson_id, is_completed, completed_at')
    .eq('student_id', user.id)
    .eq('is_completed', true);

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
    .order('submitted_at', { ascending: false });

  const activeEnrollments = enrollments?.filter(e => e.status === 'active') || [];
  const pendingEnrollments = enrollments?.filter(e => e.status === 'pending') || [];

  return (
    <div className="flex min-h-screen bg-background">
      <Navigation profile={profile} />
      
      <main className="flex-1 p-8 md:p-12 overflow-y-auto">
        <header className="mb-10">
          <h1 className="text-3xl font-bold mb-2 text-foreground">My Profile</h1>
          <p className="text-muted-foreground text-sm">Manage your personal information and view your learning record.</p>
        </header>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Left Column: Profile & Settings */}
          <div className="xl:col-span-1 space-y-8">
            <div className="clean-panel rounded-lg overflow-hidden">
              <div className="p-8 border-b border-border flex flex-col items-center text-center bg-muted/20">
                <div className="w-24 h-24 rounded-full bg-primary/10 border-2 border-primary flex items-center justify-center text-primary text-3xl font-bold mb-4">
                  {profile?.full_name ? profile.full_name.charAt(0).toUpperCase() : "S"}
                </div>
                <h2 className="text-2xl font-bold text-foreground mb-1">{profile?.full_name || "Student"}</h2>
                <div className="flex items-center gap-2 text-muted-foreground text-sm justify-center mb-1">
                  <Mail className="w-4 h-4" />
                  {user.email}
                </div>
                <div className="flex items-center gap-2 text-muted-foreground text-sm justify-center">
                  <Shield className="w-4 h-4" />
                  Role: <span className="uppercase font-semibold text-primary">{profile?.role || "student"}</span>
                </div>
              </div>

              <div className="p-6">
                <h3 className="text-lg font-bold mb-4 text-foreground">Edit Details</h3>
                <form action={updateProfile} className="space-y-4">
                  <div>
                    <label htmlFor="full_name" className="block text-sm font-medium text-foreground mb-2">
                      Full Name
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <User className="w-5 h-5 text-muted-foreground" />
                      </div>
                      <input
                        type="text"
                        id="full_name"
                        name="full_name"
                        defaultValue={profile?.full_name || ""}
                        className="w-full bg-background border border-border rounded-md pl-10 pr-3 py-2 text-foreground focus:border-primary focus:outline-none transition-colors"
                        placeholder="Enter your full name"
                        required
                      />
                    </div>
                  </div>

                  <div className="pt-2">
                    <button 
                      type="submit" 
                      className="w-full bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium transition-opacity hover:opacity-90"
                    >
                      Save Changes
                    </button>
                  </div>
                </form>
              </div>
            </div>

            {/* Quick Stats Summary */}
            <div className="grid grid-cols-2 gap-4">
              <div className="clean-panel p-4 rounded-lg text-center">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-2 text-primary">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div className="text-2xl font-bold">{activeEnrollments.length}</div>
                <div className="text-xs text-muted-foreground uppercase tracking-wider">Active</div>
              </div>
              <div className="clean-panel p-4 rounded-lg text-center">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-2 text-primary">
                  <Clock className="w-5 h-5" />
                </div>
                <div className="text-2xl font-bold">{lessonProgressList?.length || 0}</div>
                <div className="text-xs text-muted-foreground uppercase tracking-wider">Lessons</div>
              </div>
            </div>
          </div>

          {/* Right Column: Academic Record */}
          <div className="xl:col-span-2 space-y-8">
            {/* Enrollment Status */}
            <div className="clean-panel rounded-lg overflow-hidden">
              <div className="p-6 border-b border-border">
                <h3 className="text-lg font-bold text-foreground">Enrollment Status</h3>
              </div>
              <div className="p-6">
                {!enrollments || enrollments.length === 0 ? (
                  <p className="text-muted-foreground text-sm text-center py-4">You have no course enrollments.</p>
                ) : (
                  <div className="space-y-3">
                    {enrollments.map((enr: any, idx: number) => (
                      <div key={idx} className="flex items-center justify-between p-3 border border-border rounded-md bg-muted/10">
                        <div className="flex items-center gap-3">
                          <BookOpen className="w-5 h-5 text-muted-foreground" />
                          <span className="font-medium">{enr.courses?.title || 'Unknown Course'}</span>
                        </div>
                        {enr.status === 'active' ? (
                          <span className="text-xs font-bold px-2.5 py-1 bg-green-100 text-green-700 rounded-full">ACTIVE</span>
                        ) : enr.status === 'pending' ? (
                          <span className="flex items-center gap-1 text-xs font-bold px-2.5 py-1 bg-yellow-100 text-yellow-700 rounded-full">
                            <Lock className="w-3 h-3" /> PENDING
                          </span>
                        ) : (
                          <span className="text-xs font-bold px-2.5 py-1 bg-red-100 text-red-700 rounded-full uppercase">{enr.status}</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Quiz Grades */}
            <div className="clean-panel rounded-lg overflow-hidden">
              <div className="p-6 border-b border-border flex items-center justify-between">
                <h3 className="text-lg font-bold text-foreground">Quiz Transcript</h3>
                <span className="text-sm text-muted-foreground">{quizSubmissions?.length || 0} Total</span>
              </div>
              
              {(!quizSubmissions || quizSubmissions.length === 0) ? (
                <div className="p-12 text-center text-muted-foreground">
                  <Trophy className="w-12 h-12 mx-auto mb-4 opacity-20" />
                  <p>You haven't taken any quizzes yet.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs text-muted-foreground uppercase bg-muted/30">
                      <tr>
                        <th className="px-6 py-3 font-medium">Course</th>
                        <th className="px-6 py-3 font-medium">Quiz Name</th>
                        <th className="px-6 py-3 font-medium">Date</th>
                        <th className="px-6 py-3 font-medium text-right">Score</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {quizSubmissions.map((sub: any, idx: number) => {
                        const courseTitle = sub.quizzes?.units?.courses?.title || 'Course';
                        const quizTitle = sub.quizzes?.title || 'Quiz';
                        const isGoodScore = sub.score >= 80;
                        
                        return (
                          <tr key={idx} className="hover:bg-muted/10 transition-colors">
                            <td className="px-6 py-4 text-muted-foreground">{courseTitle}</td>
                            <td className="px-6 py-4 font-medium text-foreground">{quizTitle}</td>
                            <td className="px-6 py-4 text-muted-foreground whitespace-nowrap">
                              {new Date(sub.submitted_at).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 text-right">
                              <span className={`inline-flex font-bold px-2.5 py-1 rounded-md ${isGoodScore ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                {sub.score}%
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            
          </div>
        </div>
      </main>
    </div>
  );
}
