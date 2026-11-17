"use client";
import { useMemo, useState } from "react";
import LeadCard from "./LeadCard";
import type { Assignment } from "@/lib/types";
import { money } from "@/lib/format";

export default function LeadFeed({ initial, business }: { initial: Assignment[]; business: string }) {
  const [items, setItems] = useState(initial);
  const [minScore, setMinScore] = useState(60);
  const [service, setService] = useState("all");
  const [showClosed, setShowClosed] = useState(false);

  const services = useMemo(() => Array.from(new Set(items.map((a) => a.leads.service))).sort(), [items]);
  const shown = items
    .filter((a) => a.leads.score >= minScore)
    .filter((a) => service === "all" || a.leads.service === service)
    .filter((a) => showClosed || (a.stage !== "won" && a.stage !== "lost"))
    .sort((x, y) => y.leads.score - x.leads.score);

  const stats = {
    total: items.length,
    hot: items.filter((a) => a.leads.score >= 80 && a.stage === "new").length,
    working: items.filter((a) => a.stage === "contacted" || a.stage === "quoted").length,
    won: items.filter((a) => a.stage === "won"),
  };
  const revenue = stats.won.reduce((s, a) => s + (a.value ?? 0), 0);

  return (
    <div>
      <div className="grid gap-3 sm:grid-cols-4">
        {[
          ["Active leads", stats.total.toLocaleString()],
          ["Hot and untouched", stats.hot.toLocaleString()],
          ["In progress", stats.working.toLocaleString()],
          ["Won from Faja", `${stats.won.length} · ${money(revenue)}`],
        ].map(([k, v]) => (
          <div key={k} className="card p-4">
            <p className="text-xs uppercase tracking-wide text-stone-500">{k}</p>
            <p className="mt-1 text-xl font-semibold">{v}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 flex flex-wrap items-end gap-4">
        <div>
          <label className="label" htmlFor="score">Minimum score: {minScore}</label>
          <input id="score" type="range" min={0} max={100} step={5} value={minScore} onChange={(e) => setMinScore(Number(e.target.value))} className="w-48 accent-emerald-700" />
        </div>
        <div>
          <label className="label" htmlFor="svc">Service</label>
          <select id="svc" className="input w-auto" value={service} onChange={(e) => setService(e.target.value)}>
            <option value="all">All services</option>
            {services.map((s) => <option key={s}>{s}</option>)}
          </select>
        </div>
        <label className="flex items-center gap-2 pb-2 text-sm">
          <input type="checkbox" checked={showClosed} onChange={(e) => setShowClosed(e.target.checked)} /> Show won and lost
        </label>
        <p className="ml-auto pb-2 text-sm text-stone-500">{shown.length} shown</p>
      </div>

      <div className="mt-4 space-y-3">
        {shown.slice(0, 100).map((a) => (
          <LeadCard key={a.id} a={a} business={business} onChange={(n) => setItems(items.map((x) => (x.id === n.id ? n : x)))} />
        ))}
        {shown.length === 0 && (
          <div className="card p-10 text-center text-stone-600">No leads match these filters yet. Lower the minimum score or widen your service area.</div>
        )}
        {shown.length > 100 && <p className="text-center text-sm text-stone-500">Showing the top 100 by score.</p>}
      </div>
    </div>
  );
}
