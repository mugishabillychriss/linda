"use client";

import { useState, useEffect, useRef } from "react";
import { checkHealth } from "../lib/api";
import Card from "./ui/Card";

// Render's free tier sleeps after 15 minutes of inactivity and takes
// 30-60s to wake back up on the first request. Rather than let the
// dashboard's first API call silently hang, this pings /health up front
// and shows an honest "waking up" screen until the backend actually
// responds -- so the very first thing a user sees is never a mystery.
export default function ServerWakeGate({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [waking, setWaking] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const attempts = useRef(0);

  useEffect(() => {
    let cancelled = false;
    let elapsedTimer: ReturnType<typeof setInterval> | null = null;

    async function ping() {
      try {
        await checkHealth();
        if (!cancelled) setReady(true);
      } catch {
        if (cancelled) return;
        attempts.current += 1;
        // Only show the wake-up screen if the first couple of attempts
        // fail -- a healthy server responds near-instantly, so we don't
        // want to flash this screen on every normal page load.
        if (attempts.current >= 1) {
          setWaking(true);
          if (!elapsedTimer) {
            elapsedTimer = setInterval(() => setElapsed((s) => s + 1), 1000);
          }
        }
        setTimeout(ping, 3000);
      }
    }

    ping();
    return () => {
      cancelled = true;
      if (elapsedTimer) clearInterval(elapsedTimer);
    };
  }, []);

  if (ready) return <>{children}</>;

  if (!waking) {
    // First check hasn't failed yet -- avoid a flash of loading UI for
    // the common case where the server is already awake.
    return <>{children}</>;
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-6 bg-paper">
      <Card className="w-full max-w-sm p-8 text-center">
        <div className="w-8 h-8 border-2 border-signal border-t-transparent rounded-full animate-spin mx-auto mb-5" />
        <p className="font-display text-lg font-semibold mb-2">Waking up the server</p>
        <p className="text-slate text-sm mb-1">
          Our backend sleeps after periods of inactivity to stay free for everyone.
        </p>
        <p className="text-slate text-sm mb-4">This usually takes under a minute.</p>
        <p className="font-mono text-xs text-slate">{elapsed}s elapsed</p>
      </Card>
    </main>
  );
}
