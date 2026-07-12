"use client";

import { useState } from "react";
import { DhabaDetailMap } from "./DhabaDetailMap";
import type { Dhaba } from "@/lib/types";

// Collapsible map ribbon for the dhaba detail page (2026-07 redesign).
// The map starts collapsed into a slim bar so it doesn't force the
// desktop CTAs/facts column to grow past the hero photo's height.
//
// Desktop (fine pointer): hover the ribbon (or the map once it's open) to
// reveal it; move the cursor away and it collapses again.
// Mobile/touch (coarse pointer, no real hover): tap the ribbon to open,
// tap it again to collapse.
//
// Reuses the same `(pointer: coarse)` media-query check already used by
// MapView.tsx and HomeInteractive.tsx elsewhere in the codebase.
const IS_COARSE_POINTER =
  typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches;

const MAP_HEIGHT = 210;

export function MapRibbon({ dhaba }: { dhaba: Dhaba }) {
  const [expanded, setExpanded] = useState(false);

  if (dhaba.lat == null || dhaba.lng == null) return null;

  const containerHoverHandlers = IS_COARSE_POINTER
    ? {}
    : {
        onMouseEnter: () => setExpanded(true),
        onMouseLeave: () => setExpanded(false),
      };

  // Keyboard users can't hover — focusing the button (Tab key) opens the
  // map the same way a mouseenter would; blurring it closes it again.
  const ribbonInteractionHandlers = IS_COARSE_POINTER
    ? { onClick: () => setExpanded((v) => !v) }
    : {
        onFocus: () => setExpanded(true),
        onBlur: () => setExpanded(false),
      };

  return (
    <div {...containerHoverHandlers} className="flex flex-col items-center">
      <button
        type="button"
        {...ribbonInteractionHandlers}
        aria-expanded={expanded}
        className="w-4/5 h-9 flex items-center gap-2 rounded-xl border px-3.5 font-ui font-semibold cursor-pointer transition-colors duration-150 hover:border-clay-300"
        style={{ fontSize: 13, borderColor: "#e4d8c6", background: "#ffffff", color: "#3c3128" }}
      >
        <PinIcon />
        <span className="flex-1 text-left">{expanded ? "Hide map" : "View map"}</span>
        <ChevronIcon expanded={expanded} />
      </button>

      {/* The trigger shrinks to match the other buttons, but the map itself
          stays full column width when open — shrinking a Leaflet map isn't
          useful the way shrinking a button is. */}
      <div
        className="w-full overflow-hidden motion-safe:transition-[max-height] duration-300 ease-out"
        style={{ maxHeight: expanded ? MAP_HEIGHT : 0 }}
      >
        <div className="mt-2 rounded-2xl overflow-hidden" style={{ height: MAP_HEIGHT }}>
          {expanded ? <DhabaDetailMap dhaba={dhaba} height={`${MAP_HEIGHT}px`} /> : null}
        </div>
      </div>
    </div>
  );
}

function PinIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="w-4 h-4 flex-none"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M12 22s7-5.5 7-11.8A7 7 0 0 0 5 10.2C5 16.5 12 22 12 22z" />
      <circle cx="12" cy="10" r="2.6" />
    </svg>
  );
}

function ChevronIcon({ expanded }: { expanded: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className="w-4 h-4 flex-none motion-safe:transition-transform duration-200"
      style={{ transform: expanded ? "rotate(180deg)" : "rotate(0deg)" }}
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}
