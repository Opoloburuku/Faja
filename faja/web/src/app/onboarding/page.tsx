"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { CITIES, INDUSTRIES } from "@/lib/types";

export default function Onboarding() {
  const router = useRouter();
  const supabase = createClient();
  const [name, setName] = useState("");
  const [industry, setIndustry] = useState("cleaning");
  const [city, setCity] = useState("Calgary");
  const [areas, setAreas] = useState<string[]>([]);
  const [allAreas, setAllAreas] = useState<{ area: string; signals: number }[]>([]);
  const [filter, setFilter] = useState("");
  const [minValue, setMinValue] = useState(0);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    supabase.rpc("list_areas", { p_city: city }).then(({ data }) => setAllAreas(data ?? []));
  }, [city]); // eslint-disable-line react-hooks/exhaustive-deps

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    const country = CITIES.find((c) => c.id === city)?.country ?? "CA";
    const { error } = await supabase.rpc("create_workspace", {
      p_name: name, p_country: country, p_industry: industry, p_services: [], p_cities: [city], p_areas: areas, p_min_value: minValue,
    });
    if (error) { setErr(error.message); setBusy(false); return; }
    router.push("/app");
    router.refresh();
  }

  const shown = allAreas.filter((a) => a.area.toLowerCase().includes(filter.toLowerCase()));

  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <span className="text-xl font-semibold tracking-tight">faja</span>
      <h1 className="mt-8 text-2xl font-semibold">Set up your lead feed</h1>
      <p className="mt-2 text-stone-600">Tell Faja what you do and where. You can change this later.</p>
      <form onSubmit={submit} className="card mt-8 space-y-6 p-6">
        <div>
          <label className="label" htmlFor="name">Business name</label>
          <input id="name" className="input" required value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="industry">What you do</label>
            <select id="industry" className="input" value={industry} onChange={(e) => setIndustry(e.target.value)}>
              {INDUSTRIES.map((i) => <option key={i.id} value={i.id}>{i.label}</option>)}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="city">City</label>
            <select id="city" className="input" value={city} onChange={(e) => { setCity(e.target.value); setAreas([]); }}>
              {CITIES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label className="label">Service areas <span className="font-normal text-stone-500">(leave empty for the whole city)</span></label>
          <input className="input mb-2" placeholder="Search communities…" value={filter} onChange={(e) => setFilter(e.target.value)} />
          {areas.length > 0 && (
            <div className="mb-2 flex flex-wrap gap-2">
              {areas.map((a) => (
                <button type="button" key={a} onClick={() => setAreas(areas.filter((x) => x !== a))}
                  className="rounded-full bg-emerald-700 px-3 py-1 text-xs text-white">{a} ×</button>
              ))}
            </div>
          )}
          <div className="max-h-48 overflow-y-auto rounded-lg border border-stone-200 p-2">
            {shown.map((a) => (
              <label key={a.area} className="flex cursor-pointer items-center justify-between rounded px-2 py-1 text-sm hover:bg-stone-50">
                <span className="flex items-center gap-2">
                  <input type="checkbox" checked={areas.includes(a.area)}
                    onChange={(e) => setAreas(e.target.checked ? [...areas, a.area] : areas.filter((x) => x !== a.area))} />
                  {a.area}
                </span>
                <span className="text-xs text-stone-500">{a.signals} recent permits</span>
              </label>
            ))}
            {shown.length === 0 && <p className="px-2 py-1 text-sm text-stone-500">No matches.</p>}
          </div>
        </div>
        <div>
          <label className="label" htmlFor="min">Smallest job worth your time (estimated project value, $)</label>
          <input id="min" className="input" type="number" min={0} step="any" value={minValue} onChange={(e) => setMinValue(Number(e.target.value))} />
        </div>
        {err && <p className="text-sm text-red-700">{err}</p>}
        <button className="btn-primary w-full" disabled={busy}>{busy ? "Finding your leads…" : "Show me my leads"}</button>
      </form>
    </main>
  );
}
