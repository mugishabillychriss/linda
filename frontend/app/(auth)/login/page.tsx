"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "../../../lib/supabase/client";
import Button from "../../../components/ui/Button";
import Card from "../../../components/ui/Card";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-6 bg-paper">
      <Card className="w-full max-w-sm p-8">
        <p className="font-mono text-xs uppercase tracking-widest text-signal mb-2">
          Doctor Linda
        </p>
        <h1 className="font-display text-2xl font-semibold mb-6">Log in</h1>
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
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-ink/15 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-signal/40 focus:border-signal"
            />
          </div>
          {error && <p className="text-sm text-alert">{error}</p>}
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Logging in..." : "Log in"}
          </Button>
        </form>
        <p className="mt-5 text-sm text-slate">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="text-signal font-medium hover:underline">
            Sign up
          </Link>
        </p>
      </Card>
    </main>
  );
}
