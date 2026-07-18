"use client";

import { useEffect } from "react";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Logged client-side for now. Wire this up to an error monitoring
    // service (e.g. Sentry) once one is connected -- see progress notes.
    console.error(error);
  }, [error]);

  return (
    <main className="min-h-screen flex items-center justify-center px-6 bg-paper">
      <Card className="w-full max-w-md p-8 text-center">
        <p className="font-mono text-xs uppercase tracking-widest text-alert mb-3">
          Something went wrong
        </p>
        <h1 className="font-display text-2xl font-semibold mb-3">
          That didn&apos;t work as expected
        </h1>
        <p className="text-slate text-sm mb-6">
          This is usually temporary. Try again, and if it keeps happening, let us know
          what you were doing when it broke.
        </p>
        <div className="flex gap-3 justify-center">
          <Button onClick={reset}>Try again</Button>
          <a href="/dashboard">
            <Button variant="secondary">Back to dashboard</Button>
          </a>
        </div>
      </Card>
    </main>
  );
}
