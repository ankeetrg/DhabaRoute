import type { Metadata } from "next";
import {
  getAllDhabas,
  getAllUsedTags,
} from "@/lib/dhabas";
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
  openGraph: {
    title: "DhabaRoute — Find Real Indian Dhabas on US Truck Routes",
    description:
      "Discover authentic Indian dhabas along I-80, I-40, I-10 and more. 157 verified stops across 28 states.",
    url: "https://dhabaroute.com",
    siteName: "DhabaRoute",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "DhabaRoute — Find Real Indian Dhabas on US Truck Routes",
    description:
      "Discover authentic Indian dhabas along I-80, I-40, I-10 and more. 157 verified stops across 28 states.",
  },
};

export default function HomePage() {
  const all = getAllDhabas();

  return (
    <>
      <HomeInteractive dhabas={all} filterTags={getAllUsedTags()} />
      <MenuShowcase />
    </>
  );
}
