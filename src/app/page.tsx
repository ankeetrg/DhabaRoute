import {
  getAllDhabas,
  getAllUsedTags,
  getFeaturedDhabas,
} from "@/lib/dhabas";
import { Hero } from "@/components/Hero";
import { DhabaRow } from "@/components/DhabaRow";
import { HomeInteractive } from "@/components/HomeInteractive";
import { HowItWorks } from "@/components/HowItWorks";
import { MenuShowcase } from "@/components/MenuShowcase";
import { PhotoGallery } from "@/components/PhotoGallery";

export default function HomePage() {
  const all = getAllDhabas();

  // Row 1 — featured dhabas (explicit flag). Falls back to first 3 of all.
  const featured = pick(getFeaturedDhabas(), all, 3);

  // Row 2 — dhabas with truck parking (spec: tags.includes('Truck Parking')).
  const truckParking = all
    .filter((d) => d.tags.includes("Truck Parking"))
    .slice(0, 3);

  return (
    <>
      <Hero count={all.length} />
      <HomeInteractive dhabas={all} filterTags={getAllUsedTags()} />
      <HowItWorks />
      <MenuShowcase />
      <PhotoGallery />

      <DhabaRow
        title="Popular stops on the highway"
        subtitle="These spots have parking, hours you can count on, and food that hits."
        dhabas={featured}
        emphasis
      />

      <DhabaRow
        title="Stops worth the detour"
        subtitle="Real dhabas with truck parking and real food. Word spreads fast."
        dhabas={truckParking.length > 0 ? truckParking : pick(all, all, 3)}
      />
    </>
  );
}

function pick<T>(primary: T[], fallback: T[], limit: number): T[] {
  const source = primary.length >= limit ? primary : fallback;
  return source.slice(0, limit);
}
