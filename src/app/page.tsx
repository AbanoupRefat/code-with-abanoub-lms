import Link from "next/link";
import { ArrowRight, Github, Linkedin, Mail } from "lucide-react";
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
            <Github className="w-5 h-5" />
          </a>
          <a href="https://linkedin.com/in/abanouprefat" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors" title="LinkedIn">
            <Linkedin className="w-5 h-5" />
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
