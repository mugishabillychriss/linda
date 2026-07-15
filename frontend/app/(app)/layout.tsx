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
    <div className="min-h-screen">
      <nav className="border-b px-6 py-4 flex justify-between items-center">
        <span className="font-bold">Doctor Linda</span>
        <div className="flex items-center gap-4 text-sm text-gray-600">
          <span>{user.email}</span>
          <LogoutButton />
        </div>
      </nav>
      {children}
    </div>
  );
}
