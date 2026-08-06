import type { Metadata } from "next";
import { getAllDhabas, getAllUsedTags } from "@/lib/dhabas";
import { AllDhabasInteractive } from "@/components/AllDhabasInteractive";

export const metadata: Metadata = {
  title: "All Dhabas",
  description:
    "Browse every dhaba-style Indian food stop on DhabaRoute in list, split, or map view.",
};

export default function AllDhabasPage() {
  return (
    <AllDhabasInteractive dhabas={getAllDhabas()} filterTags={getAllUsedTags()} />
  );
}
