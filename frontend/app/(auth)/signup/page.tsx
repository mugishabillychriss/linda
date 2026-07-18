"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "../../../lib/supabase/client";
import Button from "../../../components/ui/Button";
import Card from "../../../components/ui/Card";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [resent, setResent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signUp({ email, password });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    setDone(true);
  }

  async function handleResend() {
    setResent(false);
    const supabase = createClient();
    await supabase.auth.resend({ type: "signup", email });
    setResent(true);
  }

  if (done) {
    return (
      <main className="min-h-screen flex items-center justify-center px-6 bg-paper">
        <Card className="w-full max-w-sm p-8 text-center">
          <h1 className="font-display text-2xl font-semibold mb-3">Check your email</h1>
          <p className="text-slate text-sm mb-4">
            We sent a confirmation link to <strong className="text-ink">{email}</strong>. Click
            it to activate your account, then log in.
          </p>
          <button
            onClick={handleResend}
            className="text-sm text-signal font-medium hover:underline"
          >
            Didn&apos;t get it? Resend email
          </button>
          {resent && <p className="text-xs text-mint mt-2">Email resent.</p>}
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
        <h1 className="font-display text-2xl font-semibold mb-2">Create your account</h1>
        <p className="text-slate text-sm mb-6">
          Start your 14-day free trial. No credit card required.
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
          <div>
            <label className="block text-sm font-medium mb-1.5">Password</label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-ink/15 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-signal/40 focus:border-signal"
            />
          </div>
          {error && <p className="text-sm text-alert">{error}</p>}
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Creating account..." : "Sign up"}
          </Button>
        </form>
        <p className="mt-5 text-sm text-slate">
          Already have an account?{" "}
          <Link href="/login" className="text-signal font-medium hover:underline">
            Log in
          </Link>
        </p>
      </Card>
    </main>
  );
}
