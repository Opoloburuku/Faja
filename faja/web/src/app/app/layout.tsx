import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import SignOut from "@/components/SignOut";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: ws } = await supabase.from("workspaces").select("id, name, plan").limit(1).maybeSingle();
  if (!ws) redirect("/onboarding");

  return (
    <div className="min-h-screen">
      <header className="border-b border-stone-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
          <div className="flex items-center gap-8">
            <Link href="/app" className="text-lg font-semibold tracking-tight">faja</Link>
            <nav className="flex gap-5 text-sm text-stone-600">
              <Link href="/app" className="hover:text-stone-900">Leads</Link>
              <Link href="/app/pipeline" className="hover:text-stone-900">Pipeline</Link>
            </nav>
          </div>
          <div className="flex items-center gap-4 text-sm text-stone-600">
            <span>{ws.name} · <span className="capitalize">{ws.plan}</span></span>
            <SignOut />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
    </div>
  );
}
