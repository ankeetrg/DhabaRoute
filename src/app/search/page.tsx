import type { Metadata } from "next";
import { getAllDhabas, getAllUsedTags } from "@/lib/dhabas";
import { SearchInteractive } from "@/components/SearchInteractive";

export const metadata: Metadata = {
  title: "Search Dhabas",
  description:
    "Search DhabaRoute's dhaba-style Indian food stops by name, highway, city, or filter by state, highway, amenity, or open-now.",
};

export default function SearchPage() {
  return (
    <SearchInteractive dhabas={getAllDhabas()} filterTags={getAllUsedTags()} />
  );
}
