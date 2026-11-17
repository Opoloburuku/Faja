// Faja connector: City of Calgary building permits (open data, Socrata dataset c2es-76ed)
// Pulls recently issued permits, stores them as signals, turns them into scored leads
// for several industries, then runs matching.
import { createClient } from "jsr:@supabase/supabase-js@2";

const SOURCE = "https://data.calgary.ca/resource/c2es-76ed.json";
const CONNECTOR_ID = "calgary_permits";
const LOOKBACK_DAYS = 60; // Calgary's dataset can lag a few weeks

type Permit = Record<string, string | undefined>;

type LeadDraft = {
  industry: string;
  service: string;
  title: string;
  reason: string;
  base: number;
};

const HOMES = new Set(["single family", "two family", "townhouse"]);
const SUITES = new Set(["secondary suites", "additional dwelling"]);
const MULTI = new Set(["apartment"]);
const COMMERCIAL = new Set(["commercial", "institutional", "industrial", "general"]);

function classify(p: Permit): LeadDraft[] {
  const group = (p.permitclassgroup ?? "").toLowerCase();
  const work = (p.workclassgroup ?? "").toLowerCase();
  const type = (p.permittype ?? "").toLowerCase();
  const desc = (p.description ?? "").toLowerCase();
  if (work.includes("demolition") || type.includes("demolition")) return [];

  const where = p.communityname ? ` in ${title(p.communityname)}` : "";
  const isNew = work === "new";
  const isImprovement = work === "improvement";
  const residentialImprovement = type.includes("residential improvement");
  const basement = /basement/.test(desc);
  const outdoor = /(deck|addition|porch|patio|retaining|landscap)/.test(desc);
  const out: LeadDraft[] = [];
  const add = (industry: string, service: string, base: number, t: string, reason: string) =>
    out.push({ industry, service, base, title: `${t}${where}`, reason });

  if (isNew && HOMES.has(group)) {
    add("cleaning", "Post-construction / move-in clean", 70, "New home build",
      "New home under construction. Builders and new owners book a deep clean before move-in.");
    add("landscaping", "New-build landscaping", 65, "New home build",
      "New homes need sod, grading and planting once construction wraps up.");
    add("painting", "Touch-up or colour-change painting", 40, "New home build",
      "New owners often repaint or need touch-ups after possession.");
  } else if (isNew && SUITES.has(group)) {
    add("cleaning", "Move-in clean for new suite", 60, "New secondary suite",
      "A new rental suite is being built. Owners need it cleaned before the first tenant.");
    add("painting", "Suite painting", 50, "New secondary suite", "New suites are usually painted before they're rented.");
  } else if (isNew && group === "garage") {
    add("landscaping", "Yard repair after garage build", 45, "New garage",
      "Garage construction tears up the yard and driveway edges around it.");
  } else if (isNew && (MULTI.has(group) || (group === "townhouse"))) {
    add("cleaning", "Multi-unit post-construction clean", 62, "New multi-unit building",
      "Multi-unit builds need a final clean of every unit before handover.");
  } else if (isImprovement && (HOMES.has(group) || SUITES.has(group) || (residentialImprovement && group === "unspecified"))) {
    add("cleaning", "Post-renovation clean", basement ? 60 : 55, basement ? "Basement development" : "Home renovation",
      "Renovation permit issued. Dust and debris mean a post-renovation clean is likely when work finishes.");
    add("painting", "Interior painting", basement ? 60 : 52, basement ? "Basement development" : "Home renovation",
      "Renovations and basement developments usually end with painting.");
    if (outdoor) {
      add("landscaping", "Yard repair after construction", 40, "Outdoor addition",
        "Decks and additions disturb the yard around them.");
    }
  } else if (isNew && COMMERCIAL.has(group)) {
    add("cleaning", "Commercial post-construction clean", 55, "New commercial building",
      "New commercial construction needs a final clean before handover.");
  } else if (isImprovement && (COMMERCIAL.has(group) || MULTI.has(group))) {
    add("cleaning", "Commercial post-renovation clean", 45, "Commercial renovation",
      "Tenant improvements and renovations end with a construction clean.");
  }
  return out;
}

function title(s: string) {
  return s.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

function score(base: number, p: Permit): number {
  let s = base;
  const cost = Number(p.estprojectcost ?? 0);
  if (cost >= 250_000) s += 10; else if (cost >= 75_000) s += 6; else if (cost >= 20_000) s += 3;
  const when = Date.parse(p.completeddate ?? p.issueddate ?? "");
  if (!Number.isNaN(when)) {
    const days = (Date.now() - when) / 86_400_000;
    if (days <= 14) s += 12; else if (days <= 30) s += 6; else if (days > 45) s -= 8;
  }
  if (p.completeddate) s += 5; // work finished: cleaning window is now
  return Math.max(0, Math.min(100, Math.round(s)));
}

Deno.serve(async (req) => {
  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

  const secret = req.headers.get("x-faja-cron") ?? "";
  const { data: ok } = await supabase.rpc("check_cron_secret", { p: secret });
  if (!ok) return new Response("forbidden", { status: 403 });

  try {
    const since = new Date(Date.now() - LOOKBACK_DAYS * 86_400_000).toISOString().slice(0, 10);
    const url = new URL(SOURCE);
    url.searchParams.set("$where", `issueddate >= '${since}T00:00:00'`);
    url.searchParams.set("$order", "issueddate DESC");
    url.searchParams.set("$limit", "5000");
    const res = await fetch(url, { headers: { Accept: "application/json" } });
    if (!res.ok) throw new Error(`Calgary API ${res.status}: ${await res.text()}`);
    const permits: Permit[] = await res.json();

    let signalCount = 0, leadCount = 0;
    for (let i = 0; i < permits.length; i += 200) {
      const chunk = permits.slice(i, i + 200).filter((p) => p.permitnum);
      const signalRows = chunk.map((p) => ({
        connector_id: CONNECTOR_ID,
        external_id: p.permitnum!,
        signal_type: "building_permit",
        city: "Calgary",
        area: p.communityname ? title(p.communityname) : null,
        address: p.originaladdress ?? null,
        lat: p.latitude ? Number(p.latitude) : null,
        lng: p.longitude ? Number(p.longitude) : null,
        occurred_at: p.completeddate ?? p.issueddate ?? null,
        payload: p,
      }));
      const { data: signals, error } = await supabase
        .from("signals")
        .upsert(signalRows, { onConflict: "connector_id,external_id" })
        .select("id, external_id");
      if (error) throw error;
      signalCount += signals.length;
      const idByPermit = new Map(signals.map((s) => [s.external_id, s.id]));

      const leadRows = chunk.flatMap((p) =>
        classify(p).map((d) => ({
          signal_id: idByPermit.get(p.permitnum!),
          industry: d.industry,
          service: d.service,
          title: d.title,
          reason: d.reason,
          score: score(d.base, p),
          city: "Calgary",
          area: p.communityname ? title(p.communityname) : null,
          address: p.originaladdress ?? null,
          lat: p.latitude ? Number(p.latitude) : null,
          lng: p.longitude ? Number(p.longitude) : null,
          est_value: p.estprojectcost ? Number(p.estprojectcost) : null,
          occurred_at: p.completeddate ?? p.issueddate ?? null,
          expires_at: new Date(Date.parse(p.completeddate ?? p.issueddate ?? new Date().toISOString()) + 45 * 86_400_000).toISOString(),
        }))
      ).filter((l) => l.signal_id);
      if (leadRows.length) {
        const { error: le } = await supabase.from("leads").upsert(leadRows, { onConflict: "signal_id,industry" });
        if (le) throw le;
        leadCount += leadRows.length;
      }
    }

    const { data: assigned, error: ae } = await supabase.rpc("assign_leads", { p_workspace: null });
    if (ae) throw ae;

    await supabase.from("connectors").update({
      last_run_at: new Date().toISOString(), last_run_count: signalCount, status: "active", last_error: null,
    }).eq("id", CONNECTOR_ID);

    return Response.json({ permits: permits.length, signals: signalCount, leads: leadCount, assigned });
  } catch (e) {
    const msg = e instanceof Error ? e.message : JSON.stringify(e);
    await supabase.from("connectors").update({ status: "error", last_error: msg, last_run_at: new Date().toISOString() })
      .eq("id", CONNECTOR_ID);
    return Response.json({ error: msg }, { status: 500 });
  }
});
