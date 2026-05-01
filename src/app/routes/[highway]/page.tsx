import type { Metadata } from "next";
import { getAllDhabas } from "@/lib/dhabas";
import { parseRoute, highwaySlug } from "@/lib/parseRoute";
import { DhabaCard } from "@/components/DhabaCard";

const dhabas = getAllDhabas();

type RouteParams = Promise<{ highway: string }>;

// Build one page per unique highway at build time
export function generateStaticParams() {
  const highways = new Set<string>();
  dhabas.forEach((d) => {
    const { highway } = parseRoute(d.routeHint);
    if (highway) highways.add(highway);
  });
  return Array.from(highways).map((h) => ({ highway: highwaySlug(h) }));
}

export async function generateMetadata({
  params,
}: {
  params: RouteParams;
}): Promise<Metadata> {
  const { highway } = await params;
  const label = highway.toUpperCase().replace("-", " ").replace(" ", "-");
  return {
    title: `Indian Dhabas on ${label} | DhabaRoute`,
    description: `Find authentic Indian dhabas along ${label}. Verified stops with truck parking, vegetarian options, and real food on your route.`,
  };
}

export default async function HighwayPage({
  params,
}: {
  params: RouteParams;
}) {
  const { highway } = await params;
  const stops = dhabas.filter((d) => {
    const parsed = parseRoute(d.routeHint).highway;
    return parsed && highwaySlug(parsed) === highway;
  });

  const label = highway
    .toUpperCase()
    .replace(/^(I|US)-/, (m) => m.toUpperCase());

  if (!stops.length) return null;

  return (
    <main className="max-w-[1280px] mx-auto px-6 md:px-8 py-12">
      <p className="text-[11px] font-bold uppercase tracking-widest text-[var(--accent)] mb-3">
        Highway Guide
      </p>
      <h1 className="font-display text-3xl font-extrabold text-[var(--ink)] mb-2">
        Indian dhabas on {label}
      </h1>
      <p className="text-sm text-[var(--ink-muted)] mb-10">
        {stops.length} verified {stops.length === 1 ? "stop" : "stops"} along this route
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
