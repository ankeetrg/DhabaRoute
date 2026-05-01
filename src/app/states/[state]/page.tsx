import type { Metadata } from "next";
import { getAllDhabas } from "@/lib/dhabas";
import { parseRoute, stateSlug } from "@/lib/parseRoute";
import { DhabaCard } from "@/components/DhabaCard";

const dhabas = getAllDhabas();

type RouteParams = Promise<{ state: string }>;

const STATE_LABELS: Record<string, string> = {
  al: "Alabama", ar: "Arkansas", az: "Arizona", ca: "California",
  fl: "Florida", ia: "Iowa", il: "Illinois", in: "Indiana",
  la: "Louisiana", mn: "Minnesota", mo: "Missouri", ms: "Mississippi",
  mt: "Montana", nc: "North Carolina", ne: "Nebraska", nj: "New Jersey",
  nm: "New Mexico", nv: "Nevada", ny: "New York", oh: "Ohio",
  ok: "Oklahoma", on: "Ontario", or: "Oregon", pa: "Pennsylvania",
  tn: "Tennessee", tx: "Texas", ut: "Utah", va: "Virginia",
  wa: "Washington", wv: "West Virginia", wy: "Wyoming",
};

export function generateStaticParams() {
  const states = new Set<string>();
  dhabas.forEach((d) => {
    const { state } = parseRoute(d.routeHint);
    if (state) states.add(stateSlug(state));
  });
  return Array.from(states).map((s) => ({ state: s }));
}

export async function generateMetadata({
  params,
}: {
  params: RouteParams;
}): Promise<Metadata> {
  const { state } = await params;
  const label = STATE_LABELS[state] ?? state.toUpperCase();
  return {
    title: `Indian Dhabas in ${label} | DhabaRoute`,
    description: `Find authentic Indian dhabas in ${label}. Verified stops along major truck routes with real food, truck parking, and late night hours.`,
  };
}

export default async function StatePage({
  params,
}: {
  params: RouteParams;
}) {
  const { state } = await params;
  const stops = dhabas.filter((d) => {
    const parsed = parseRoute(d.routeHint).state;
    return parsed && stateSlug(parsed) === state;
  });

  const label = STATE_LABELS[state] ?? state.toUpperCase();

  if (!stops.length) return null;

  return (
    <main className="max-w-[1280px] mx-auto px-6 md:px-8 py-12">
      <p className="text-[11px] font-bold uppercase tracking-widest text-[var(--accent)] mb-3">
        State Guide
      </p>
      <h1 className="font-display text-3xl font-extrabold text-[var(--ink)] mb-2">
        Indian dhabas in {label}
      </h1>
      <p className="text-sm text-[var(--ink-muted)] mb-10">
        {stops.length} verified {stops.length === 1 ? "stop" : "stops"} across the state
      </p>
      <div
        className="grid gap-4"
        style={{ gridTemplateColumns: "repeat(auto-fill, minmax(272px, 1fr))" }}
      >
        {stops.map((d) => (
          <DhabaCard key={d.id} dhaba={d} />
        ))}
      </div>
    </main>
  );
}
