import { createClient } from "@/lib/supabase/server";
import { STAGES, type Assignment } from "@/lib/types";
import { money } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function PipelinePage() {
  const supabase = createClient();
  const { data } = await supabase
    .from("lead_assignments")
    .select("id, stage, value, exclusive, rank, assigned_at, leads!inner(*)")
    .neq("stage", "new")
    .order("updated_at", { ascending: false })
    .limit(500);
  const items = (data ?? []) as unknown as Assignment[];

  return (
    <div>
      <h1 className="text-2xl font-semibold">Pipeline</h1>
      <p className="mt-1 text-sm text-stone-600">Leads you&apos;ve started working. Change a lead&apos;s stage from the Leads page.</p>
      <div className="mt-6 grid gap-4 md:grid-cols-4">
        {STAGES.filter((s) => s.id !== "new").map((s) => {
          const col = items.filter((a) => a.stage === s.id);
          const total = col.reduce((t, a) => t + (a.value ?? 0), 0);
          return (
            <section key={s.id} className="rounded-xl bg-stone-100 p-3">
              <header className="mb-3 flex items-baseline justify-between px-1">
                <h2 className="font-semibold">{s.label}</h2>
                <span className="text-xs text-stone-500">{col.length}{s.id === "won" ? ` · ${money(total)}` : ""}</span>
              </header>
              <div className="space-y-2">
                {col.map((a) => (
                  <div key={a.id} className="card p-3 text-sm">
                    <p className="font-medium">{a.leads.title}</p>
                    <p className="text-stone-600">{a.leads.service}</p>
                    <p className="mt-1 text-xs text-stone-500">{a.leads.address}{a.value ? ` · ${money(a.value)}` : ""}</p>
                  </div>
                ))}
                {col.length === 0 && <p className="px-1 text-xs text-stone-500">Nothing here yet.</p>}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
