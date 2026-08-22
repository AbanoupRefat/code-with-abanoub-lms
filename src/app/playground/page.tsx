import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import PlaygroundClient from "@/components/code/PlaygroundClient";
import Link from "next/link";
import { Code2, ChevronLeft } from "lucide-react";
import { LangToggle } from "@/components/LangContext";

export const metadata = {
  title: "Code Playground — LMS",
  description: "Write and run Python or JavaScript code directly in your browser.",
};

export default async function PlaygroundPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return redirect("/login");

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top nav */}
      <nav className="flex items-center justify-between px-6 py-3 border-b border-border bg-card flex-shrink-0 sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-2 font-bold text-foreground">
            <Code2 className="w-5 h-5 text-primary" />
            <span>Code Playground</span>
            <span className="text-muted-foreground font-normal"> / ساحة البرمجة</span>
          </div>
        </div>
        <LangToggle />
      </nav>

      {/* Main content */}
      <main className="flex-1 p-4 md:p-6 overflow-hidden">
        <PlaygroundClient />
      </main>
    </div>
  );
}
