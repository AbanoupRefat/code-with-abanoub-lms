"use client";

import { useState } from "react";
import { Settings, BookOpen } from "lucide-react";

interface CourseManagerTabsProps {
  settingsContent: React.ReactNode;
  curriculumContent: React.ReactNode;
}

export default function CourseManagerTabs({ settingsContent, curriculumContent }: CourseManagerTabsProps) {
  const [activeTab, setActiveTab] = useState<"settings" | "curriculum">("curriculum");

  return (
    <div className="w-full">
      <div className="flex border-b border-border mb-8">
        <button
          onClick={() => setActiveTab("settings")}
          className={`px-6 py-3 font-medium text-sm flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === "settings"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Settings className="w-4 h-4" />
          Course Settings
        </button>
        <button
          onClick={() => setActiveTab("curriculum")}
          className={`px-6 py-3 font-medium text-sm flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === "curriculum"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <BookOpen className="w-4 h-4" />
          Curriculum Builder
        </button>
      </div>

      <div className="w-full max-w-3xl">
        {activeTab === "settings" ? settingsContent : curriculumContent}
      </div>
    </div>
  );
}
