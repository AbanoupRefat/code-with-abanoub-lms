"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { BookOpen, Home, Library, User, LogOut, Code2, Calendar, BarChart2 } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { useLang, LangToggle } from "@/components/LangContext";

export default function Navigation({ profile }: { profile: any }) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  
  const navItems = [
    { name: "Dashboard", href: "/dashboard", icon: Home },
    { name: "My Courses", href: "/courses", icon: Library },
    { name: "Calendar", href: "/calendar", icon: Calendar },
    { name: "My Results", href: "/my-results", icon: BarChart2 },
    { name: "Playground", href: "/playground", icon: Code2 },
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
    <>
      {/* Inject padding so content doesn't hide behind the floating navbar */}
      <style>{`
        body { padding-bottom: 6rem !important; }
        .admin-sidebar { display: none !important; } 
      `}</style>
      
      <nav className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 bg-card/85 backdrop-blur-2xl border border-border shadow-2xl rounded-full px-2 sm:px-4 py-2 sm:py-3 flex items-center gap-1 sm:gap-4 w-max max-w-[97vw] transition-all hover:bg-card/95">
        
        {/* Navigation Items */}
        <div className="flex items-center gap-0.5 sm:gap-1 border-r border-border pr-2 sm:pr-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`relative flex flex-col items-center justify-center p-2 sm:p-2.5 rounded-full transition-all group ${
                  isActive 
                    ? "text-primary" 
                    : "text-muted-foreground hover:text-primary hover:bg-primary/10"
                }`}
              >
                <Icon className={`w-5 h-5 sm:w-[22px] sm:h-[22px] transition-all duration-300 group-hover:-translate-y-1 group-hover:scale-125 ${isActive ? "scale-110" : ""}`} />
                {isActive && (
                  <span className="absolute -bottom-0.5 w-1 h-1 rounded-full bg-primary" />
                )}
                {/* Hover Tooltip */}
                <span className="absolute -top-10 left-1/2 -translate-x-1/2 scale-0 group-hover:scale-100 transition-all duration-300 bg-primary text-primary-foreground text-xs font-bold px-2.5 py-1 rounded-md shadow-lg pointer-events-none whitespace-nowrap z-50 origin-bottom">
                  {item.name}
                  {/* Tooltip arrow */}
                  <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-primary rotate-45"></span>
                </span>
              </Link>
            );
          })}
        </div>

        {/* User Profile & Actions */}
        <div className="flex items-center gap-1 sm:gap-3 pl-0">
          {/* Profile Badge */}
          <Link href="/profile" className="flex items-center gap-2 hover:opacity-80 transition-opacity" title="Profile">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold shadow-sm text-sm">
              {initial}
            </div>
            <div className="hidden sm:block text-left mr-2">
              <p className="text-sm font-bold text-foreground leading-none">{profile?.full_name?.split(' ')[0] || "Student"}</p>
            </div>
          </Link>
          
          <div className="w-px h-6 bg-border hidden sm:block" />

          {/* Lang Toggle */}
          <div className="hidden sm:block">
            <LangToggle />
          </div>

          {/* Sign Out */}
          <button 
            onClick={handleSignOut}
            className="relative flex flex-col items-center justify-center p-2 sm:p-2.5 rounded-full transition-all text-muted-foreground hover:text-red-500 hover:bg-red-500/10 group cursor-pointer"
          >
            <LogOut className="w-5 h-5 sm:w-[22px] sm:h-[22px] transition-all duration-300 group-hover:-translate-y-1 group-hover:scale-125" />
            {/* Hover Tooltip */}
            <span className="absolute -top-10 left-1/2 -translate-x-1/2 scale-0 group-hover:scale-100 transition-all duration-300 bg-red-600 text-white text-xs font-bold px-2.5 py-1 rounded-md shadow-lg pointer-events-none whitespace-nowrap z-50 origin-bottom">
              Sign Out
              {/* Tooltip arrow */}
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-red-600 rotate-45"></span>
            </span>
          </button>
        </div>
      </nav>
    </>
  );
}
