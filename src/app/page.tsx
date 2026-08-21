import Link from "next/link";
import { BookOpen, ArrowRight } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="px-6 py-4 flex items-center justify-between w-full max-w-6xl mx-auto border-b border-border">
        <div className="flex items-center gap-2 font-bold text-lg tracking-tight">
          <BookOpen className="w-5 h-5" />
          <span>Code With Abanoub</span>
        </div>
        <nav className="flex items-center gap-4">
          <Link
            href="/login"
            className="text-sm font-medium hover:text-muted-foreground transition-colors"
          >
            Sign In
          </Link>
          <Link
            href="/login"
            className="text-sm font-medium bg-primary text-primary-foreground px-4 py-2 rounded-md hover:opacity-90 transition-opacity"
          >
            Get Started
          </Link>
        </nav>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-6 text-center max-w-4xl mx-auto py-24">
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6 text-foreground">
          Master Software Engineering.
        </h1>
        
        <p className="text-lg text-muted-foreground max-w-2xl mb-10 leading-relaxed">
          A focused, no-nonsense curriculum designed to take you from beginner to professional. 
          Learn the fundamentals, build real projects, and master the craft.
        </p>

        <div className="flex flex-col sm:flex-row gap-4">
          <Link
            href="/login"
            className="flex items-center justify-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-md font-medium transition-opacity hover:opacity-90"
          >
            Start Learning
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/courses"
            className="flex items-center justify-center gap-2 bg-muted text-foreground px-6 py-3 rounded-md font-medium hover:bg-border transition-colors"
          >
            View Curriculum
          </Link>
        </div>
      </main>

      <footer className="py-6 text-center text-muted-foreground text-sm border-t border-border mt-auto">
        &copy; {new Date().getFullYear()} Code With Abanoub. All rights reserved.
      </footer>
    </div>
  );
}
