import {
  getAllDhabas,
  getAllUsedTags,
  getFeaturedDhabas,
  getHighPriorityDhabas,
} from "@/lib/dhabas";
import { Hero } from "@/components/Hero";
import { DhabaRow } from "@/components/DhabaRow";
import { HomeInteractive } from "@/components/HomeInteractive";
import type { Dhaba } from "@/lib/types";

export default function HomePage() {
  const all = getAllDhabas();

  // Featured/Priority rows use explicit flags when present and fall back to
  // heuristic picks until curators finish tagging. Keeps the page useful
  // without overpromising.
  // Tags are no longer inferred — fallbacks use flags and priority only.
  const featured: Dhaba[] = pick(getFeaturedDhabas(), getHighPriorityDhabas(), 6);
  const highPriority: Dhaba[] = pick(getHighPriorityDhabas(), all, 6);

  return (
    <>
      <Hero />
      <HomeInteractive dhabas={all} filterTags={getAllUsedTags()} />

      <DhabaRow
        title="Featured dhabas"
        subtitle="Hand-picked spots worth the detour."
        dhabas={featured}
        emphasis
      />

      <DhabaRow
        title="Built for the rig"
        subtitle="Reliable stops with truck parking or a travel plaza nearby."
        dhabas={highPriority}
      />
    </>
  );
}

function pick<T>(primary: T[], fallback: T[], limit: number): T[] {
  const source = primary.length > 0 ? primary : fallback;
  return source.slice(0, limit);
}
