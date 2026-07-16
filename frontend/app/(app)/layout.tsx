import { redirect } from "next/navigation";
import { createClient } from "../../lib/supabase/server";
import LogoutButton from "./logout-button";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-paper">
      <nav className="border-b border-ink/10 px-6 py-4 flex justify-between items-center bg-white">
        <span className="font-display font-semibold text-lg">Doctor Linda</span>
        <div className="flex items-center gap-4 text-sm text-slate">
          <span className="font-mono text-[10px] uppercase tracking-wide px-2 py-1 rounded bg-signal/10 text-signal">
            Free trial
          </span>
          <span className="font-mono text-xs">{user.email}</span>
          <LogoutButton />
        </div>
      </nav>
      {children}
    </div>
  );
}
