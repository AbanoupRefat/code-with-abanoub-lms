import AdminNavigation from "@/components/AdminNavigation";
import { Users, BookOpen, PlusCircle, TrendingUp } from "lucide-react";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import EnrollmentChart from "@/components/EnrollmentChart";

export default async function AdminDashboardPage() {
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

  // Fetch basic counts
  const { count: studentsCount } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('role', 'student');
    
  const { count: coursesCount } = await supabase
    .from('courses')
    .select('*', { count: 'exact', head: true });

  // Fetch recent enrollments for table
  const { data: recentEnrollments } = await supabase
    .from('enrollments')
    .select(`
      id,
      enrolled_at,
      profiles ( full_name, avatar_url ),
      courses ( title )
    `)
    .order('enrolled_at', { ascending: false })
    .limit(5);

  // Fetch all enrollments for chart data aggregation
  const { data: allEnrollments } = await supabase
    .from('enrollments')
    .select('enrolled_at')
    .order('enrolled_at', { ascending: true });

  // Process data for the chart (group by date)
  const chartDataMap = new Map<string, number>();
  
  // Initialize last 7 days with 0
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    chartDataMap.set(dateStr, 0);
  }

  // Aggregate actual data
  if (allEnrollments) {
    allEnrollments.forEach((e) => {
      const d = new Date(e.enrolled_at);
      const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      if (chartDataMap.has(dateStr)) {
        chartDataMap.set(dateStr, chartDataMap.get(dateStr)! + 1);
      }
    });
  }

  const chartData = Array.from(chartDataMap.entries()).map(([date, enrollments]) => ({
    date,
    enrollments
  }));

  return (
    <div className="flex min-h-screen bg-background">
      <AdminNavigation />
      
      <main className="flex-1 p-8 md:p-12 overflow-y-auto">
        <header className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-2 text-foreground">Admin Overview</h1>
            <p className="text-muted-foreground text-sm">Manage your students and courses.</p>
          </div>
          
          <Link href="/manage/courses/new" className="flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-md text-sm font-medium transition-opacity hover:opacity-90">
            <PlusCircle className="w-4 h-4" />
            Create Course
          </Link>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <div className="clean-panel p-6 rounded-lg flex flex-col gap-4 border-l-4 border-l-foreground">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Total Students</h3>
              <Users className="w-5 h-5 text-muted-foreground" />
            </div>
            <p className="text-4xl font-bold text-foreground">{studentsCount || 0}</p>
          </div>
          
          <div className="clean-panel p-6 rounded-lg flex flex-col gap-4 border-l-4 border-l-muted-foreground">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Total Courses</h3>
              <BookOpen className="w-5 h-5 text-muted-foreground" />
            </div>
            <p className="text-4xl font-bold text-foreground">{coursesCount || 0}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          <div className="lg:col-span-2 clean-panel p-6 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-5 h-5 text-foreground" />
              <h2 className="text-lg font-bold text-foreground">Enrollments Over Time</h2>
            </div>
            <p className="text-sm text-muted-foreground mb-4">New student enrollments in the last 7 days.</p>
            <EnrollmentChart data={chartData} />
          </div>
          
          <div className="clean-panel p-6 rounded-lg flex flex-col">
            <h2 className="text-lg font-bold mb-4 text-foreground">Quick Actions</h2>
            <div className="space-y-3 flex-1">
              <Link href="/manage/students" className="block w-full text-left px-4 py-3 bg-muted/50 hover:bg-muted rounded-md text-sm font-medium transition-colors border border-transparent hover:border-border">
                Manage Enrollments
              </Link>
              <Link href="/manage/lessons" className="block w-full text-left px-4 py-3 bg-muted/50 hover:bg-muted rounded-md text-sm font-medium transition-colors border border-transparent hover:border-border">
                Global Lesson Library
              </Link>
              <Link href="/manage/courses" className="block w-full text-left px-4 py-3 bg-muted/50 hover:bg-muted rounded-md text-sm font-medium transition-colors border border-transparent hover:border-border">
                Update Course Catalog
              </Link>
            </div>
          </div>
        </div>

        <h2 className="text-lg font-bold mb-4 text-foreground">Recent Enrollments</h2>
        <div className="clean-panel rounded-lg overflow-hidden">
          <table className="w-full text-left text-sm border-collapse">
            <thead className="bg-muted border-b border-border">
              <tr>
                <th className="px-6 py-3 font-semibold text-muted-foreground">Student Name</th>
                <th className="px-6 py-3 font-semibold text-muted-foreground">Course</th>
                <th className="px-6 py-3 font-semibold text-muted-foreground">Enrollment Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-card">
              {(!recentEnrollments || recentEnrollments.length === 0) && (
                <tr>
                  <td colSpan={3} className="px-6 py-8 text-center text-muted-foreground">
                    No enrollments to display yet.
                  </td>
                </tr>
              )}
              {recentEnrollments?.map((enrollment: any) => (
                <tr key={enrollment.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-6 py-4 font-medium text-foreground">
                    {enrollment.profiles?.full_name || "Unknown Student"}
                  </td>
                  <td className="px-6 py-4 text-muted-foreground">
                    {enrollment.courses?.title || "Unknown Course"}
                  </td>
                  <td className="px-6 py-4 text-muted-foreground">
                    {new Date(enrollment.enrolled_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
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
