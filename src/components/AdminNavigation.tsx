"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { BookOpen, Users, LayoutDashboard, FileVideo, LogOut, ClipboardList, ClipboardCheck, BarChart2, Calendar } from "lucide-react";
import { useLang, LangToggle } from "@/components/LangContext";

export default function AdminNavigation() {
  const pathname = usePathname();
  const { t } = useLang();

  const navItems = [
    { key: "nav.overview", href: "/manage", icon: LayoutDashboard },
    { key: "nav.calendar", href: "/manage/calendar", icon: Calendar },
    { key: "nav.students", href: "/manage/students", icon: Users },
    { key: "nav.enrollments", href: "/manage/enrollments", icon: ClipboardList },
    { key: "nav.courses", href: "/manage/courses", icon: BookOpen },
    { key: "nav.lessons", href: "/manage/lessons", icon: FileVideo },
    { key: "nav.grading", href: "/manage/grading", icon: ClipboardCheck },
    { key: "nav.analytics", href: "/manage/analytics", icon: BarChart2 },
  ];

  return (
    <>
      <style>{`
        body { padding-bottom: 6rem !important; }
        .admin-sidebar { display: none !important; } 
      `}</style>
      
      <nav className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 bg-card/85 backdrop-blur-2xl border border-border shadow-2xl rounded-full px-2 sm:px-4 py-2 sm:py-3 flex items-center gap-1 sm:gap-3 w-max max-w-[97vw] transition-all hover:bg-card/95">
        
        {/* Logo — desktop only */}
        <Link href="/manage" className="hidden sm:flex items-center justify-center w-8 h-8 rounded-full overflow-hidden shadow-sm hover:opacity-80 transition-opacity flex-shrink-0 border border-border">
          <Image src="/logo.jpg" alt="Logo" width={32} height={32} className="object-cover" />
        </Link>
        <div className="w-px h-6 bg-border hidden sm:block" />

        {/* Navigation Items */}
        <div className="flex items-center gap-0.5 sm:gap-1 border-r border-border pr-2 sm:pr-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");

            return (
              <Link
                key={item.key}
                href={item.href}
                title={t(item.key)}
                className={`relative flex flex-col items-center justify-center p-1.5 sm:p-2.5 rounded-full transition-all group ${
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                }`}
              >
                <Icon className={`w-5 h-5 transition-transform group-hover:scale-110 ${isActive ? "scale-110" : ""}`} />
                {isActive && (
                  <span className="absolute -bottom-0.5 w-1 h-1 rounded-full bg-primary" />
                )}
              </Link>
            );
          })}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 sm:gap-3 pl-0">
          {/* Lang Toggle */}
          <div className="hidden sm:block">
            <LangToggle />
          </div>

          <Link 
            href="/dashboard" 
            title={t("nav.exit")}
            className="flex items-center justify-center p-1.5 sm:p-2.5 rounded-full transition-all text-muted-foreground hover:text-foreground hover:bg-muted/50 group"
          >
            <LogOut className="w-5 h-5 transition-transform group-hover:scale-110" />
          </Link>
        </div>
      </nav>
    </>
  );
}
