"use client";

import { useEffect, useRef, useState } from "react";
import { useLang } from "@/components/LangContext";
import { Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { JaaSMeeting } from "@jitsi/react-sdk"; // We can also use JitsiMeeting if we don't use JaaS

export default function JitsiClassroomClient({
  roomName,
  userName,
  userEmail,
  isAdmin,
  title,
}: {
  roomName: string;
  userName: string;
  userEmail: string;
  isAdmin: boolean;
  title: string;
}) {
  const { t } = useLang();
  const [loading, setLoading] = useState(true);

  // We use JitsiMeeting from react-sdk. Wait, JitsiMeeting is standard, JaaS is for 8x8 enterprise.
  // Actually, @jitsi/react-sdk exports JitsiMeeting.
  const { JitsiMeeting } = require("@jitsi/react-sdk");

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
          <div className="flex items-center gap-2">
            <span className="flex items-center justify-center w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <h1 className="font-bold text-white text-lg">{title}</h1>
          </div>
        </div>
      </header>

      {/* Jitsi Meeting Wrapper */}
      <main className="flex-1 relative bg-[#0f0f0f]">
        {loading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0f0f0f] text-white z-10">
            <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Connecting to Live Classroom...</p>
          </div>
        )}
        <JitsiMeeting
          domain="meet.jit.si"
          roomName={roomName}
          configOverwrite={{
            startWithAudioMuted: !isAdmin,
            startWithVideoMuted: !isAdmin,
            prejoinPageEnabled: false, // Skip prejoin page to jump right in
            disableDeepLinking: true, // Don't prompt to download mobile app
          }}
          interfaceConfigOverwrite={{
            DISABLE_JOIN_LEAVE_NOTIFICATIONS: true,
            SHOW_JITSI_WATERMARK: false,
            SHOW_WATERMARK_FOR_GUESTS: false,
            TOOLBAR_BUTTONS: [
              'microphone', 'camera', 'closedcaptions', 'desktop', 'fullscreen',
              'fodeviceselection', 'hangup', 'profile', 'chat', 'recording',
              'livestreaming', 'etherpad', 'sharedvideo', 'settings', 'raisehand',
              'videoquality', 'filmstrip', 'feedback', 'stats', 'shortcuts',
              'tileview', 'videobackgroundblur', 'download', 'help', 'mute-everyone',
              'security'
            ],
          }}
          userInfo={{
            displayName: userName,
            email: userEmail,
          }}
          onApiReady={(externalApi: any) => {
            setLoading(false);
          }}
          getIFrameRef={(iframeRef: HTMLIFrameElement) => {
            iframeRef.style.height = '100%';
            iframeRef.style.width = '100%';
            iframeRef.style.border = 'none';
          }}
        />
      </main>
    </div>
  );
}
