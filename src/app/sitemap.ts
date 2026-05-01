import type { MetadataRoute } from "next";
import { getAllDhabas } from "@/lib/dhabas";
import { parseRoute, highwaySlug, stateSlug } from "@/lib/parseRoute";

// Canonical apex domain — matches metadataBase in src/app/layout.tsx.
// Production serves https://www.dhabaroute.com (the apex 307-redirects to
// www), but Next + Search Console treat the apex form as canonical.
const ORIGIN = "https://dhabaroute.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const dhabas = getAllDhabas();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${ORIGIN}/`, changeFrequency: "monthly", priority: 1 },
    { url: `${ORIGIN}/what-is-a-dhaba`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${ORIGIN}/submit`, changeFrequency: "monthly", priority: 0.7 },
  ];

  const dhabaRoutes: MetadataRoute.Sitemap = dhabas.map((d) => ({
    url: `${ORIGIN}/dhabas/${d.slug}`,
    changeFrequency: "monthly",
    priority: 0.8,
  }));

  // Highway + state pages — built from parseRoute() output across the dataset
  // so the sitemap's set of URLs matches generateStaticParams in the
  // /routes/[highway] and /states/[state] pages exactly. No 404 entries.
  const highways = new Set<string>();
  const states = new Set<string>();
  dhabas.forEach((d) => {
    const { highway, state } = parseRoute(d.routeHint);
    if (highway) highways.add(highwaySlug(highway));
    if (state) states.add(stateSlug(state));
  });

  const highwayRoutes: MetadataRoute.Sitemap = Array.from(highways).map((h) => ({
    url: `${ORIGIN}/routes/${h}`,
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  const stateRoutes: MetadataRoute.Sitemap = Array.from(states).map((s) => ({
    url: `${ORIGIN}/states/${s}`,
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  return [...staticRoutes, ...dhabaRoutes, ...highwayRoutes, ...stateRoutes];
}
