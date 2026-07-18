"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "../../../lib/supabase/client";
import Button from "../../../components/ui/Button";
import Card from "../../../components/ui/Card";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/update-password`,
    });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    setSent(true);
  }

  if (sent) {
    return (
      <main className="min-h-screen flex items-center justify-center px-6 bg-paper">
        <Card className="w-full max-w-sm p-8 text-center">
          <h1 className="font-display text-2xl font-semibold mb-3">Check your email</h1>
          <p className="text-slate text-sm">
            If an account exists for <strong className="text-ink">{email}</strong>, we sent a
            link to reset your password.
          </p>
        </Card>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-6 bg-paper">
      <Card className="w-full max-w-sm p-8">
        <p className="font-mono text-xs uppercase tracking-widest text-signal mb-2">
          Doctor Linda
        </p>
        <h1 className="font-display text-2xl font-semibold mb-2">Reset your password</h1>
        <p className="text-slate text-sm mb-6">
          Enter your email and we&apos;ll send you a link to reset it.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-ink/15 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-signal/40 focus:border-signal"
            />
          </div>
          {error && <p className="text-sm text-alert">{error}</p>}
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Sending..." : "Send reset link"}
          </Button>
        </form>
        <p className="mt-5 text-sm text-slate">
          <Link href="/login" className="text-signal font-medium hover:underline">
            Back to log in
          </Link>
        </p>
      </Card>
    </main>
  );
}
