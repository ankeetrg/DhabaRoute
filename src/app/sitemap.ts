import type { MetadataRoute } from "next";
import { getAllDhabas } from "@/lib/dhabas";

// Canonical apex domain — matches metadataBase in src/app/layout.tsx.
// Production serves https://www.dhabaroute.com (the apex 307-redirects to
// www), but Next + Search Console treat the apex form as canonical.
const ORIGIN = "https://dhabaroute.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${ORIGIN}/`, changeFrequency: "monthly", priority: 1 },
    { url: `${ORIGIN}/what-is-a-dhaba`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${ORIGIN}/submit`, changeFrequency: "monthly", priority: 0.7 },
  ];

  const dhabaRoutes: MetadataRoute.Sitemap = getAllDhabas().map((d) => ({
    url: `${ORIGIN}/dhabas/${d.slug}`,
    changeFrequency: "monthly",
    priority: 0.8,
  }));

  return [...staticRoutes, ...dhabaRoutes];
}
