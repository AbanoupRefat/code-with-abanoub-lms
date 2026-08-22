import Link from "next/link";
import { ArrowRight, Mail } from "lucide-react";
import Image from "next/image";

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="px-6 py-4 flex items-center justify-between w-full max-w-6xl mx-auto border-b border-border">
        <Link href="/" className="flex items-center gap-3 font-bold text-lg tracking-tight">
          <div className="relative w-8 h-8 md:w-10 md:h-10 rounded-md overflow-hidden shadow-sm">
            <Image src="/logo.jpg" alt="Code With Abanoub Logo" fill className="object-cover" />
          </div>
          <span className="hidden sm:inline-block">Code With Abanoub</span>
        </Link>
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
        
        <div className="mb-8 relative w-48 h-48 md:w-64 md:h-64 rounded-xl overflow-hidden shadow-2xl border border-border/50">
          <Image src="/logo.jpg" alt="Code With Abanoub" fill className="object-cover" priority />
        </div>

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

      <footer className="py-8 text-center border-t border-border mt-auto">
        <div className="flex justify-center gap-6 mb-4">
          <a href="https://github.com/AbanoupRefat" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors" title="GitHub">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
            </svg>
          </a>
          <a href="https://linkedin.com/in/abanouprefat" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors" title="LinkedIn">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
            </svg>
          </a>
          <a href="mailto:abanoupr83@gmail.com" className="text-muted-foreground hover:text-foreground transition-colors" title="Email">
            <Mail className="w-5 h-5" />
          </a>
        </div>
        <p className="text-muted-foreground text-sm">
          &copy; {new Date().getFullYear()} Code With Abanoub. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
