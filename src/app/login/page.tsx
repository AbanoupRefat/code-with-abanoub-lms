"use client";

import { useState } from "react";
import Link from "next/link";
import { BookOpen, Loader2, LogIn } from "lucide-react";
import { createClient } from "@/utils/supabase/client";

export default function LoginPage() {
  const supabase = createClient();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      });
      if (error) throw error;
    } catch (err: any) {
      setError(err.message || "Authentication failed");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-muted/30">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8">
          <Link href="/" className="flex items-center gap-2 font-bold text-xl text-foreground">
            <BookOpen className="w-6 h-6" />
            <span>Code With Abanoub</span>
          </Link>
        </div>

        <div className="bg-card border border-border p-8 rounded-lg shadow-sm w-full text-center">
          <h1 className="text-2xl font-bold mb-2 text-foreground">
            Welcome to the LMS
          </h1>
          <p className="text-muted-foreground mb-8 text-sm">
            To ensure secure access to your course materials, please sign in with your Google Account.
          </p>
          
          {error && (
            <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-500 text-sm px-4 py-3 rounded-md mb-6 text-left">
              {error}
            </div>
          )}

          <button
            onClick={handleGoogleLogin}
            disabled={isLoading}
            className="w-full bg-foreground text-background font-medium py-3 px-4 rounded-md transition-opacity hover:opacity-90 disabled:opacity-50 flex justify-center items-center gap-3"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <LogIn className="w-5 h-5" />
            )}
            {isLoading ? "Redirecting to Google..." : "Continue with Google"}
          </button>
          
          <div className="mt-8 text-xs text-muted-foreground">
            <p>By continuing, you agree to our Terms of Service and Privacy Policy.</p>
            <p className="mt-2 text-primary font-medium">Important: You must use the same Google Account that will be granted access to the course videos.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
