import type { Metadata } from "next";
import {
  getAllDhabas,
  getAllUsedTags,
} from "@/lib/dhabas";
import { DhabaRow } from "@/components/DhabaRow";
import { HomeInteractive } from "@/components/HomeInteractive";
import { MenuShowcase } from "@/components/MenuShowcase";

export const metadata: Metadata = {
  title: "DhabaRoute — Find Real Indian Dhabas on US Truck Routes",
  description:
    "Discover authentic Indian dhabas along I-80, I-40, I-10 and more. Truck parking, vegetarian options, late night hours. 157 verified stops across 28 states.",
  keywords: [
    "indian food near truck stop",
    "dhaba near highway",
    "halal food truck route",
    "vegetarian truck stop food",
    "indian restaurant highway",
  ],
};

export default function HomePage() {
  const all = getAllDhabas();

  // Dhabas with truck parking
  const truckParking = all
    .filter((d) => d.tags.includes("Truck Parking"))
    .slice(0, 3);

  return (
    <>
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
