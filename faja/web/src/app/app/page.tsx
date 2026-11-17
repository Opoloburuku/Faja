import { createClient } from "@/lib/supabase/server";
import LeadFeed from "@/components/LeadFeed";
import type { Assignment } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function LeadsPage() {
  const supabase = createClient();
  const { data: ws } = await supabase.from("workspaces").select("name").limit(1).single();
  const { data } = await supabase
    .from("lead_assignments")
    .select("id, stage, value, exclusive, rank, assigned_at, leads!inner(*)")
    .gt("leads.expires_at", new Date().toISOString())
    .order("assigned_at", { ascending: false })
    .limit(1000);

  return (
    <div>
      <h1 className="text-2xl font-semibold">Your leads</h1>
      <p className="mt-1 text-sm text-stone-600">Fresh from public signals in your area. Highest score first.</p>
      <div className="mt-6">
        <LeadFeed initial={(data ?? []) as unknown as Assignment[]} business={ws?.name ?? "our team"} />
      </div>
    </div>
  );
}
