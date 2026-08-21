import Navigation from "@/components/Navigation";
import Link from "next/link";
import { Search, PlayCircle } from "lucide-react";
import { createClient } from "@/utils/supabase/server";

export default async function CoursesPage() {
  const supabase = await createClient();
  
  // Fetch real courses instead of mock data
  const { data: courses } = await supabase
    .from('courses')
    .select('*')
    .eq('is_published', true)
    .order('created_at', { ascending: false });

  // For MVP, we will assume 0 progress and 0 units if not loaded yet
  return (
    <div className="flex min-h-screen bg-background">
      <Navigation profile={null} /> {/* Will wire up profile properly later or rely on layout */}
      
      <main className="flex-1 p-8 md:p-12 overflow-y-auto">
        <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-2 text-foreground">Course Catalog</h1>
            <p className="text-muted-foreground text-sm">Browse available courses and start learning.</p>
          </div>
          
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input 
              type="text" 
              placeholder="Search courses..." 
              className="w-full bg-background border border-border rounded-md pl-9 pr-4 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses?.length === 0 && (
            <p className="text-muted-foreground text-sm">No courses published yet.</p>
          )}
          {courses?.map(course => (
            <Link href={`/courses/${course.id}`} key={course.id} className="group">
              <div className="clean-panel rounded-lg overflow-hidden h-full flex flex-col transition-transform group-hover:-translate-y-1">
                <div className="h-40 bg-muted border-b border-border relative">
                  {course.thumbnail_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={course.thumbnail_url} alt={course.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/5">
                      <PlayCircle className="w-10 h-10 text-foreground" />
                    </div>
                  )}
                </div>
                
                <div className="p-5 flex-1 flex flex-col">
                  <h3 className="text-lg font-semibold mb-2 text-foreground group-hover:underline underline-offset-4">{course.title}</h3>
                  <p className="text-sm text-muted-foreground mb-6 flex-1 line-clamp-2">{course.description || "No description provided."}</p>
                  
                  <div className="mt-auto pt-4 border-t border-border flex justify-between items-center text-xs text-muted-foreground">
                    <span>Self-paced</span>
                    <span className="font-medium text-foreground">View Course &rarr;</span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
