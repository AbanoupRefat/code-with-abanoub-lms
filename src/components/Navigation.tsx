"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { BookOpen, Home, Library, User, LogOut, Code2 } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { useLang, LangToggle } from "@/components/LangContext";

export default function Navigation({ profile }: { profile: any }) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  
  const navItems = [
    { name: "Dashboard", href: "/dashboard", icon: Home },
    { name: "My Courses", href: "/courses", icon: Library },
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
        body { padding-bottom: 7rem !important; }
        .admin-sidebar { display: none !important; } 
      `}</style>
      
      <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-card/80 backdrop-blur-2xl border border-border shadow-2xl rounded-full px-4 py-3 flex items-center gap-2 sm:gap-6 w-max max-w-[95vw] overflow-x-auto no-scrollbar transition-all hover:bg-card/90">
        
        {/* Navigation Items */}
        <div className="flex items-center gap-1 sm:gap-2 border-r border-border pr-2 sm:pr-6">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            
            return (
              <Link
                key={item.name}
                href={item.href}
                title={item.name}
                className={`relative flex flex-col items-center justify-center p-3 rounded-full transition-all group ${
                  isActive 
                    ? "text-primary" 
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                }`}
              >
                <Icon className={`w-6 h-6 transition-transform group-hover:scale-110 ${isActive ? "scale-110" : ""}`} />
                {isActive && (
                  <span className="absolute -bottom-1 w-1.5 h-1.5 rounded-full bg-primary" />
                )}
              </Link>
            );
          })}
        </div>

        {/* User Profile & Actions */}
        <div className="flex items-center gap-2 sm:gap-4 pl-0 sm:pl-2">
          {/* Profile Badge */}
          <Link href="/profile" className="flex items-center gap-2 hover:opacity-80 transition-opacity" title="Profile">
            <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold shadow-sm">
              {initial}
            </div>
            <div className="hidden sm:block text-left mr-2">
              <p className="text-sm font-bold text-foreground leading-none">{profile?.full_name?.split(' ')[0] || "Student"}</p>
            </div>
          </Link>
          
          <div className="w-px h-8 bg-border hidden sm:block" />

          {/* Lang Toggle */}
          <div className="hidden sm:block">
            <LangToggle />
          </div>

          {/* Sign Out */}
          <button 
            onClick={handleSignOut}
            title="Sign Out"
            className="flex items-center justify-center p-3 rounded-full transition-all text-muted-foreground hover:text-red-500 hover:bg-red-500/10 group cursor-pointer"
          >
            <LogOut className="w-6 h-6 transition-transform group-hover:scale-110" />
          </button>
        </div>
      </nav>
    </>
  );
}
