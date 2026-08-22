"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { BookOpen, Users, LayoutDashboard, FileVideo, Shield, LogOut, ClipboardList } from "lucide-react";

export default function AdminNavigation() {
  const pathname = usePathname();
  
  const navItems = [
    { name: "Overview", href: "/manage", icon: LayoutDashboard },
    { name: "Students", href: "/manage/students", icon: Users },
    { name: "Enrollments", href: "/manage/enrollments", icon: ClipboardList },
    { name: "Courses", href: "/manage/courses", icon: BookOpen },
    { name: "Lessons", href: "/manage/lessons", icon: FileVideo },
  ];

  return (
    <aside className="w-64 bg-card border-r border-border hidden md:flex flex-col h-screen sticky top-0">
      <div className="p-6">
        <Link href="/manage" className="flex items-center gap-3 font-bold text-lg text-foreground tracking-tight">
          <div className="relative w-8 h-8 rounded-md overflow-hidden shadow-sm">
            <Image src="/logo.jpg" alt="Logo" fill className="object-cover" />
          </div>
          <span>LMS Admin</span>
        </Link>
      </div>
      
      <div className="px-4 py-2 flex-1">
        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-2">
          Management
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
        <Link href="/dashboard" className="flex w-full items-center gap-3 px-3 py-2 rounded-md transition-colors text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50">
          <LogOut className="w-4 h-4" />
          Exit Admin
        </Link>
      </div>
    </aside>
  );
}
