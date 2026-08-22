"use client";

import { useState } from "react";
import { useLang } from "@/components/LangContext";
import { Calendar as CalendarIcon, Clock, ChevronRight, BookOpen, FileQuestion } from "lucide-react";
import Link from "next/link";

export default function StudentCalendarClient({ events }: { events: any[] }) {
  const { t, dir } = useLang();
  
  // Optional: Group events by month/week in a more complex view. For now, a clean chronological list.
  const now = new Date();
  
  // Filter events: don't show past events by default
  const upcomingEvents = events.filter(e => new Date(e.event_date) >= new Date(new Date().setHours(0,0,0,0)));
  const pastEvents = events.filter(e => new Date(e.event_date) < new Date(new Date().setHours(0,0,0,0)));

  const getEventBadge = (type: string) => {
    switch (type) {
      case 'quiz': return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-700 uppercase tracking-wider">{t("calendar.typeQuiz")}</span>;
      case 'lecture': return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700 uppercase tracking-wider">{t("calendar.typeLecture")}</span>;
      case 'assignment': return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-700 uppercase tracking-wider">{t("calendar.typeAssignment")}</span>;
      case 'holiday': return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-100 text-green-700 uppercase tracking-wider">{t("calendar.typeHoliday")}</span>;
      case 'live_session': return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700 uppercase tracking-wider flex items-center gap-1"><span className="w-1.5 h-1.5 bg-rose-600 rounded-full animate-pulse" /> Live</span>;
      default: return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 text-gray-700 uppercase tracking-wider">{t("calendar.typeOther")}</span>;
    }
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'quiz': return <FileQuestion className="w-5 h-5 text-red-500" />;
      case 'lecture': return <BookOpen className="w-5 h-5 text-blue-500" />;
      default: return <CalendarIcon className="w-5 h-5 text-muted-foreground" />;
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <header>
        <h1 className="text-3xl font-bold mb-2 text-foreground">{t("calendar.title")}</h1>
        <p className="text-muted-foreground text-sm">{t("calendar.subtitle")}</p>
      </header>

      <div className="space-y-6">
        {upcomingEvents.length === 0 ? (
          <div className="clean-panel p-16 rounded-2xl border border-border text-center text-muted-foreground">
            <CalendarIcon className="w-12 h-12 mx-auto mb-4 opacity-20" />
            <p>{t("calendar.noEvents")}</p>
          </div>
        ) : (
          <div className="relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-border before:to-transparent">
            {upcomingEvents.map((evt, idx) => {
              const dateObj = new Date(evt.event_date);
              const month = dateObj.toLocaleString(dir === 'rtl' ? 'ar-EG' : 'en-US', { month: 'short' });
              const day = dateObj.getDate();
              const time = dateObj.toLocaleString(dir === 'rtl' ? 'ar-EG' : 'en-US', { hour: 'numeric', minute: '2-digit' });
              
              const isLinked = evt.quiz_id || evt.course_id;
              const linkUrl = evt.quiz_id 
                  ? (evt.course_id ? `/courses/${evt.course_id}/quiz/${evt.quiz_id}` : `#`)
                  : (evt.course_id ? `/courses/${evt.course_id}` : `#`);

              return (
                <div key={evt.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active mb-8">
                  {/* Timeline dot */}
                  <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-background bg-muted text-slate-500 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 relative z-10">
                    {getEventIcon(evt.event_type)}
                  </div>
                  
                  {/* Event Card */}
                  <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl border border-border bg-card shadow-sm transition-all hover:shadow-md hover:border-primary/30">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{month} {day} • {time}</span>
                      </div>
                      {getEventBadge(evt.event_type)}
                    </div>
                    <h3 className="text-lg font-bold text-foreground mb-1">{evt.title}</h3>
                    {evt.description && (
                      <p className="text-sm text-muted-foreground mb-4">{evt.description}</p>
                    )}
                    
                    {evt.event_type === 'live_session' && evt.meeting_url ? (
                      <Link 
                        href={`/live/${evt.id}`}
                        className="inline-flex items-center justify-center gap-2 w-full mt-4 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-sm font-bold rounded-lg transition-colors shadow-sm shadow-rose-900/20"
                      >
                        <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
                        Join Live Class
                      </Link>
                    ) : (
                      isLinked && linkUrl !== '#' && (
                        <Link 
                          href={linkUrl}
                          className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline underline-offset-4 mt-2"
                        >
                          {evt.quiz_id ? "Take Quiz" : "View Course"} <ChevronRight className="w-4 h-4" />
                        </Link>
                      )
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
