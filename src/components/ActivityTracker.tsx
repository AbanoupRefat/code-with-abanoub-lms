"use client";

import { useEffect, useRef } from "react";
import { updateLastActive } from "@/app/manage/actions";

const THROTTLE_MS = 5 * 60 * 1000; // 5 minutes

export default function ActivityTracker() {
  const lastUpdated = useRef<number>(0);

  const update = async () => {
    const now = Date.now();
    if (now - lastUpdated.current < THROTTLE_MS) return;
    lastUpdated.current = now;
    try {
      await updateLastActive();
    } catch { /* silent */ }
  };

  useEffect(() => {
    update(); // fire on mount
    const handleActivity = () => update();
    window.addEventListener('click', handleActivity, { passive: true });
    window.addEventListener('keydown', handleActivity, { passive: true });
    window.addEventListener('scroll', handleActivity, { passive: true });
    return () => {
      window.removeEventListener('click', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      window.removeEventListener('scroll', handleActivity);
    };
  }, []);

  return null;
}
