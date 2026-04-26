import {
  getAllDhabas,
  getAllUsedTags,
} from "@/lib/dhabas";
import { Hero } from "@/components/Hero";
import { DhabaRow } from "@/components/DhabaRow";
import { HomeInteractive } from "@/components/HomeInteractive";
import { MenuShowcase } from "@/components/MenuShowcase";

export default function HomePage() {
  const all = getAllDhabas();

  // Dhabas with truck parking
  const truckParking = all
    .filter((d) => d.tags.includes("Truck Parking"))
    .slice(0, 3);

  return (
    <>
      <Hero count={all.length} />
      <HomeInteractive dhabas={all} filterTags={getAllUsedTags()} />
      <MenuShowcase />

      <DhabaRow
        title="Stops worth the detour"
        subtitle="Real dhabas with truck parking and real food. Word spreads fast."
        dhabas={truckParking.length > 0 ? truckParking : all.slice(0, 3)}
      />
    </>
  );
}
