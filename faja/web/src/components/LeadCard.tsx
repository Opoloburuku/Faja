"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { STAGES, type Assignment, type Stage } from "@/lib/types";
import { ago, money } from "@/lib/format";
import { outreachScript } from "@/lib/outreach";

function scoreTone(s: number) {
  if (s >= 80) return "bg-emerald-700 text-white";
  if (s >= 65) return "bg-emerald-100 text-emerald-900";
  return "bg-stone-100 text-stone-700";
}

export default function LeadCard({ a, business, onChange }: { a: Assignment; business: string; onChange?: (a: Assignment) => void }) {
  const [stage, setStage] = useState<Stage>(a.stage);
  const [value, setValue] = useState<string>(a.value?.toString() ?? "");
  const [copied, setCopied] = useState(false);
  const [open, setOpen] = useState(false);
  const l = a.leads;
  const supabase = createClient();

  async function save(next: Partial<{ stage: Stage; value: number | null }>) {
    const { data } = await supabase.from("lead_assignments").update(next).eq("id", a.id).select("*, leads(*)").single();
    if (data && onChange) onChange(data as Assignment);
  }

  const maps = l.address ? `https://www.google.com/maps/search/${encodeURIComponent(`${l.address}, ${l.city}`)}` : null;

  return (
    <article className="card p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className={`rounded-md px-2 py-0.5 text-xs font-semibold ${scoreTone(l.score)}`}>{l.score}</span>
            <h3 className="font-semibold">{l.title}</h3>
            {a.exclusive && <span className="rounded-md bg-amber-100 px-2 py-0.5 text-xs text-amber-900">Exclusive</span>}
          </div>
          <p className="mt-1 text-sm text-stone-600">{l.service} · {ago(l.occurred_at)}{l.est_value ? ` · project ${money(l.est_value)}` : ""}</p>
        </div>
        <select aria-label="Stage" className="input w-auto" value={stage}
          onChange={(e) => { const s = e.target.value as Stage; setStage(s); save({ stage: s }); }}>
          {STAGES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
        </select>
      </div>
      <p className="mt-3 text-sm text-stone-700">{l.reason}</p>
      <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
        {l.address && (maps ? <a href={maps} target="_blank" rel="noreferrer" className="text-emerald-700 hover:underline">{l.address}</a> : <span>{l.address}</span>)}
        <span className="text-stone-400">·</span>
        <span className="text-stone-500">{a.exclusive ? "Only you have this lead" : "Shared with up to 3 businesses in your trade"}</span>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <button className="btn-ghost" onClick={() => setOpen(!open)}>{open ? "Hide script" : "Outreach script"}</button>
        {stage === "won" && (
          <input className="input w-40" type="number" placeholder="Job value $" value={value}
            onChange={(e) => setValue(e.target.value)} onBlur={() => save({ value: value ? Number(value) : null })} />
        )}
      </div>
      {open && (
        <div className="mt-3 rounded-lg bg-stone-50 p-4 text-sm">
          <p className="whitespace-pre-line text-stone-800">{outreachScript(l, business)}</p>
          <button className="mt-3 text-emerald-700 hover:underline" onClick={async () => {
            await navigator.clipboard.writeText(outreachScript(l, business)); setCopied(true); setTimeout(() => setCopied(false), 1500);
          }}>{copied ? "Copied" : "Copy"}</button>
          <p className="mt-2 text-xs text-stone-500">Use it for a call, a door hanger or a reply to someone who asked publicly. Check do-not-call lists before phoning.</p>
        </div>
      )}
    </article>
  );
}
