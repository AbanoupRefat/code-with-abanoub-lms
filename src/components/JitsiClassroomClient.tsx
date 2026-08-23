"use client";

import { useLang } from "@/components/LangContext";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function JitsiClassroomClient({
  roomName,
  userName,
  userEmail,
  isAdmin,
  title,
}: {
  roomName: string;
  userName?: string;
  userEmail?: string;
  isAdmin?: boolean;
  title?: string;
}) {
  const { t } = useLang();
  
  // Format the meeting URL to automatically inject user details if we want
  const meetingUrl = `https://meet.jit.si/${encodeURIComponent(roomName)}`;

  return (
    <div className="flex flex-col h-screen bg-black">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 bg-[#1e1e1e] border-b border-[#3e3e42] flex-shrink-0 z-50">
        <div className="flex items-center gap-4">
          <Link
            href={isAdmin ? "/manage/calendar" : "/calendar"}
            className="flex items-center justify-center p-2 rounded-full text-muted-foreground hover:text-white hover:bg-white/10 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="font-bold text-white text-lg">{title || 'Live Classroom'}</h1>
        </div>
      </header>

      {/* Jitsi Bypass UI */}
      <main className="flex flex-col items-center justify-center w-full h-full min-h-[70vh] bg-zinc-950 p-8 text-center rounded-2xl">
        <div className="bg-zinc-900 p-10 rounded-3xl shadow-2xl max-w-lg w-full border-t-4 border-t-primary transform transition-all hover:shadow-primary/20">
          <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-12 h-12 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </div>
          <h2 className="text-3xl font-bold text-white mb-3">Live Classroom Ready</h2>
          <p className="text-zinc-400 mb-8 text-lg">
            To ensure the highest quality connection and unlimited meeting time, the classroom will open in a secure dedicated window.
          </p>
          
          <a 
            href={meetingUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center w-full px-8 py-4 text-lg font-bold text-primary-foreground transition-all bg-primary rounded-xl hover:opacity-90 hover:shadow-lg hover:-translate-y-1"
          >
            <span>Join Live Class Now</span>
            <svg className="w-6 h-6 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        </div>
      </main>
    </div>
  );
}
