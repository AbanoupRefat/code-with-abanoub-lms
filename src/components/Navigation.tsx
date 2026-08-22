"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { BookOpen, Home, Library, User, LogOut } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { useLang, LangToggle } from "@/components/LangContext";

export default function Navigation({ profile }: { profile: any }) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  
  const navItems = [
    { name: "Dashboard", href: "/dashboard", icon: Home },
    { name: "My Courses", href: "/courses", icon: Library },
    { name: "Profile", href: "/profile", icon: User },
  ];

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  const initial = profile?.full_name ? profile.full_name.charAt(0).toUpperCase() : "S";
  const { t } = useLang();

  return (
    <aside className="w-64 bg-card border-r border-border hidden md:flex flex-col h-screen sticky top-0">
      <div className="p-6">
        <Link href="/dashboard" className="flex items-center gap-2 font-bold text-lg text-foreground">
          <BookOpen className="w-5 h-5" />
          <span>LMS Portal</span>
        </Link>
      </div>
      
      <div className="px-4 py-2 flex-1">
        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-2">
          Menu
        </div>
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors text-sm font-medium ${
                  isActive 
                    ? "bg-muted text-foreground" 
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                }`}
              >
                <Icon className="w-4 h-4" />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="p-4 border-t border-border">
        <div className="flex items-center gap-3 px-3 py-2 mb-2">
          <div className="w-8 h-8 rounded-full bg-muted border border-border flex items-center justify-center text-foreground font-medium text-sm">
            {initial}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">{profile?.full_name || "Student"}</p>
            <p className="text-xs text-muted-foreground truncate">{profile?.role || "student"}</p>
          </div>
        </div>
        <div className="space-y-2">
          <LangToggle />
          <button 
            onClick={handleSignOut}
            className="flex w-full items-center gap-3 px-3 py-2 rounded-md transition-colors text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </div>
    </aside>
  );
}
