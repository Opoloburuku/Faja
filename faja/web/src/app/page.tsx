import Link from "next/link";

const points = [
  { h: "Fresh signals, not old lists", p: "Faja watches public sources like building permits every day and turns new activity into leads while they're still warm." },
  { h: "Shared with 3 businesses at most", p: "Every lead goes to a small, capped group in your trade. Lock a territory and its leads are yours alone." },
  { h: "A reason with every lead", p: "You see why the lead exists and what to offer, plus a ready-to-use message you send yourself." },
];

export default function Home() {
  return (
    <main className="min-h-screen">
      <header className="mx-auto flex max-w-5xl items-center justify-between px-6 py-6">
        <span className="text-xl font-semibold tracking-tight">faja</span>
        <div className="flex gap-3">
          <Link href="/login" className="btn-ghost">Sign in</Link>
          <Link href="/login?mode=signup" className="btn-primary">Start free</Link>
        </div>
      </header>
      <section className="mx-auto max-w-5xl px-6 pb-16 pt-12">
        <p className="mb-4 text-sm font-medium uppercase tracking-wider text-emerald-700">Canada and the US · launching in Calgary</p>
        <h1 className="max-w-3xl text-5xl font-semibold leading-tight tracking-tight">Stop buying the same leads as your competitors.</h1>
        <p className="mt-6 max-w-2xl text-lg text-stone-600">
          Faja finds people the moment they show they&apos;ll need your service, then sends the lead to you, not to fifty other businesses.
        </p>
        <div className="mt-8 flex gap-3">
          <Link href="/login?mode=signup" className="btn-primary px-6 py-3 text-base">Get your first leads</Link>
        </div>
      </section>
      <section className="mx-auto grid max-w-5xl gap-4 px-6 pb-24 md:grid-cols-3">
        {points.map((x) => (
          <div key={x.h} className="card p-6">
            <h3 className="font-semibold">{x.h}</h3>
            <p className="mt-2 text-sm text-stone-600">{x.p}</p>
          </div>
        ))}
      </section>
    </main>
  );
}
