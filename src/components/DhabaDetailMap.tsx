"use client";

// Thin client-only wrapper around MapView for the /dhabas/[slug] detail page.
// MapView touches `window` on import, so it has to come in via next/dynamic
// with ssr:false — same pattern as HomeInteractive. A tiny wrapper keeps the
// server component page clean and lets the map height/look stay consistent
// with the rest of the site.

import dynamic from "next/dynamic";
import type { Dhaba } from "@/lib/types";

const MapView = dynamic(
  () => import("./MapView").then((m) => m.MapView),
  {
    ssr: false,
    loading: () => (
      <div
        aria-hidden
        className="w-full rounded-2xl border border-paper-warm bg-paper-soft animate-pulse"
        style={{ height: "var(--map-h)" }}
      />
    ),
  },
);

// noop — this page only has one dhaba, so selection has no meaningful
// effect. We pass the dhaba as pre-selected so the pin renders in the
// active (clay) state to anchor the eye.
const NOOP = () => {};

export function DhabaDetailMap({ dhaba }: { dhaba: Dhaba }) {
  if (dhaba.lat == null || dhaba.lng == null) return null;
  return (
    <div
      style={{
        // Slightly shorter than the home map so the detail page's other
        // content (About, CTA, similar stops) stays in view on mobile.
        ["--map-h" as string]: "clamp(260px, 40vw, 460px)",
      } as React.CSSProperties}
    >
      <MapView
        dhabas={[dhaba]}
        userLocation={null}
        selectedId={dhaba.id}
        onSelect={NOOP}
      />
    </div>
  );
}
