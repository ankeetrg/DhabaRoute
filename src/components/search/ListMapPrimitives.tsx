"use client";

// Shared list/map view primitives — lifted verbatim from HomeInteractive.tsx
// so the home page and the standalone /all-dhabas page can both compose the
// same list/split/map experience off one implementation.

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import type { RankedDhaba } from "@/lib/types";
import { getOpenStatus } from "@/lib/isOpenNow";
import { getDhabaPhotoSrc } from "@/lib/photo-url";
import { useGeolocation } from "@/lib/useGeolocation";
import { DhabaPhoto } from "../DhabaPhoto";
import { Tag } from "../Tag";

export type ViewMode = "split" | "list" | "map";

// Touch (coarse-pointer) devices — used by ViewToggle to decide whether a
// tap should show its label briefly (touch has no hover state). Only ever
// read inside event handlers/JSX attributes, never used to branch the
// top-level render tree, so it can't cause a hydration mismatch.
const IS_COARSE_POINTER =
  typeof window !== "undefined" &&
  typeof window.matchMedia === "function" &&
  window.matchMedia("(pointer: coarse)").matches;

export function LocationBanner({ geo }: { geo: ReturnType<typeof useGeolocation> }) {
  // Granted — quiet status chip with the same ocean dot used on the map.
  if (geo.status === "granted") {
    return (
      <div className="inline-flex items-center gap-1.5 text-[12px] text-ink-muted">
        <span className="w-1.5 h-1.5 rounded-full bg-ocean flex-none" aria-hidden />
        Sorted by distance
      </div>
    );
  }

  if (geo.status === "locating") {
    return <LocatingBanner />;
  }

  if (geo.status === "denied") {
    return (
      <div className="flex items-center justify-between gap-3">
        <p className="text-[12px] text-ink-muted leading-snug">
          Location blocked — enable in browser settings.
        </p>
        <button
          type="button"
          onClick={geo.request}
          className="flex-none text-[12px] font-medium text-ocean hover:underline transition"
        >
          Retry
        </button>
      </div>
    );
  }

  if (geo.status === "unsupported" || geo.status === "error") {
    return (
      <p className="text-[12px] text-ink-muted">
        Location unavailable — dhabas are still listed below.
      </p>
    );
  }

  // Idle — render nothing. The sticky search bar's "Near me" pill is the
  // single entry point for opt-in location; this banner only shows once
  // location has been requested (granted / locating / denied / error states
  // above).
  return null;
}

// Shown while `geo.status === "locating"`. Starts as a quiet pulsing line,
// and after 5 seconds adds a secondary message so drivers on slow/indoor
// GPS aren't left wondering whether the page froze. The parent swaps this
// out as soon as the status flips away from "locating" (granted/denied/
// error), so the slow-message is auto-dismissed on resolution.
function LocatingBanner() {
  const [isSlow, setIsSlow] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setIsSlow(true), 5000);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="flex flex-col gap-1" aria-live="polite">
      <div className="inline-flex items-center gap-1.5 text-[12px] text-ink-muted">
        <span className="w-1.5 h-1.5 rounded-full bg-ink-muted/50 flex-none animate-pulse" aria-hidden />
        Finding your location…
      </div>
      {isSlow ? (
        <p className="text-[12px] text-ink-muted leading-snug">
          Location is taking longer than expected — you can still browse all dhabas.
        </p>
      ) : null}
    </div>
  );
}

export function PinLegendItem({ color, label }: { color: string; label: string }) {
  // Each legend entry is a <dt>/<dd> pair inside the parent <dl> — the dot
  // is the term (the visual glyph) and the label is its description. Kept
  // inline-flex so it still reads as a single row.
  return (
    <div className="inline-flex items-center gap-1.5">
      <dt className="contents">
        <span aria-hidden className={`inline-block w-2 h-2 rounded-full ${color}`} />
      </dt>
      <dd className="m-0">{label}</dd>
    </div>
  );
}

export function NoPinsNote({
  filteredCount,
  hasFilters,
}: {
  filteredCount: number;
  hasFilters: boolean;
}) {
  return (
    <div className="mt-3 rounded-2xl border border-paper-warm bg-paper-soft px-4 py-5">
      <p className="text-[14px] font-medium text-ink">
        {hasFilters
          ? "No pinned locations for this filter."
          : "Map locations are still being added."}
      </p>
      <p className="mt-1 text-[12px] text-ink-muted">
        {filteredCount > 0
          ? `Showing all ${filteredCount} dhabas in the list below. Open any in Maps for directions.`
          : "Adjust your filters to see available dhabas."}
      </p>
    </div>
  );
}

// Three-way view toggle — list · split · map. Styled as a segmented pill
// group; the active segment gets the clay CTA treatment so it reads as the
// current selection at a glance. The map option is only rendered when there
// are actually pins to show (hasAnyPins gates it at the call site).
export function ViewToggle({
  mode,
  setMode,
}: {
  mode: ViewMode;
  setMode: (m: ViewMode) => void;
}) {
  const items: { id: ViewMode; label: string; icon: React.ReactNode }[] = [
    {
      id: "list",
      label: "List view",
      icon: (
        <svg viewBox="0 0 14 14" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
          <path d="M2 4h10M2 7h10M2 10h10" />
        </svg>
      ),
    },
    {
      id: "split",
      // "Split view" didn't say what the split actually contains — this
      // toggle stacks the list and map together, so name it after that.
      label: "List & Map",
      icon: (
        <svg viewBox="0 0 14 14" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round">
          <rect x="2" y="2.5" width="10" height="9" rx="1" />
          <path d="M7 2.5v9" />
        </svg>
      ),
    },
    {
      id: "map",
      label: "Map view",
      icon: (
        <svg viewBox="0 0 14 14" className="w-3.5 h-3.5" fill="currentColor">
          <path d="M7 1.5a3.5 3.5 0 00-3.5 3.5c0 2.6 3.1 5.7 3.3 5.85a.3.3 0 00.4 0c.2-.15 3.3-3.25 3.3-5.85A3.5 3.5 0 007 1.5zm0 4.9A1.4 1.4 0 118.4 5 1.4 1.4 0 017 6.4z" />
        </svg>
      ),
    },
  ];

  // Which button's label bubble is showing. Desktop shows it continuously
  // on hover (mouseenter/leave below); touch devices have no hover, so a
  // tap shows it briefly instead — hideTimer clears any previous timer so
  // rapid taps across buttons don't stack up stale auto-hides.
  const [tooltipId, setTooltipId] = useState<ViewMode | null>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (hideTimer.current) clearTimeout(hideTimer.current);
    };
  }, []);

  const showBriefly = useCallback((id: ViewMode) => {
    setTooltipId(id);
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setTooltipId(null), 1500);
  }, []);

  return (
    <div
      role="tablist"
      aria-label="View mode"
      className="flex-none inline-flex items-center rounded-full border border-paper-warm bg-white p-0.5"
    >
      {items.map((it) => {
        const active = mode === it.id;
        return (
          <div key={it.id} className="relative">
            <button
              role="tab"
              type="button"
              aria-selected={active}
              aria-label={it.label}
              onClick={() => {
                setMode(it.id);
                // Touch has no hover state to reveal the label, so a tap
                // shows it for a moment instead of leaving mouse-only users
                // as the sole audience for the tooltip.
                if (IS_COARSE_POINTER) showBriefly(it.id);
              }}
              onMouseEnter={() => {
                if (!IS_COARSE_POINTER) setTooltipId(it.id);
              }}
              onMouseLeave={() => {
                if (!IS_COARSE_POINTER) setTooltipId(null);
              }}
              className={[
                "inline-flex items-center justify-center w-11 h-11 sm:w-9 sm:h-9 rounded-full transition",
                active
                  ? "bg-clay-500 text-white shadow-cta"
                  : "text-ink-muted hover:text-ink",
              ].join(" ")}
            >
              {it.icon}
            </button>

            {tooltipId === it.id ? (
              <div
                role="tooltip"
                className="absolute -top-2 left-1/2 -translate-x-1/2 -translate-y-full z-20 whitespace-nowrap rounded-md bg-ink px-2 py-1 text-[11px] font-medium text-white shadow-cardHover pointer-events-none"
              >
                {it.label}
                <span
                  aria-hidden
                  className="absolute left-1/2 top-full h-0 w-0 -translate-x-1/2 border-4 border-transparent border-t-ink"
                />
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

// Anchored card overlay that appears above the map when a pin is tapped.
// Replaces the earlier scrollIntoView flow, which jumped the whole page to
// the list. The overlay keeps the user in map context — the page scroll
// position is untouched. Dismissed via the × button, Escape, or tapping
// empty map space (ClearOnMapClick inside MapView).
export function MapPinPreview({
  dhaba,
  distanceLabel,
  onDismiss,
}: {
  dhaba: RankedDhaba;
  distanceLabel?: string;
  onDismiss: () => void;
}) {
  // Today-at-a-glance info — derived client-side from the viewer's clock.
  // Same trade-off as the card: right for drivers in/near the dhaba's
  // timezone, off by ±3h for far-away browsing. Good enough until we
  // persist timezone per listing.
  const openStatus = getOpenStatus(dhaba.hours);
  const photoSrc = getDhabaPhotoSrc(dhaba);
  const today = new Date().toLocaleDateString("en-US", { weekday: "long" });
  const todayLine = dhaba.hours?.find((h) => h.startsWith(today));
  // "Monday: 6:00 AM – 10:00 PM" → day short + trimmed time
  const todaySummary = (() => {
    if (!todayLine) return null;
    const short = today.slice(0, 3);
    const rest = todayLine.split(":").slice(1).join(":").trim();
    // Compact the redundant ":00"s so "6:00 AM – 10:00 PM" → "6 AM – 10 PM".
    // Only strips :00 — preserves :15/:30/:45 etc.
    const compact = rest.replace(/:00(\s*(AM|PM))/gi, "$1");
    return `${short}: ${compact}`;
  })();

  return (
    <div
      // Floats at the bottom of the map. pointer-events-none on the wrapper
      // lets map pans/clicks pass through the empty gutters; the card itself
      // re-enables interactions.
      className="absolute inset-x-0 bottom-0 z-[500] px-3 pb-3 pointer-events-none"
      role="region"
      aria-label={`Preview: ${dhaba.title}`}
    >
      <div
        className={[
          "pointer-events-auto mx-auto max-w-xl min-w-[240px]",
          "rounded-2xl bg-white border border-paper-warm shadow-cardHover",
          "overflow-hidden animate-slide-up",
        ].join(" ")}
      >
        {/* Photo — always rendered so the preview silhouette matches
            whether or not Google had a photo (DhabaPhoto's gradient
            fallback covers the empty case). `raw` uses a plain <img>,
            which keeps the preview compatible with Leaflet popup/layer
            rendering if we ever move this inside the map tree. No hover
            zoom here — the preview isn't a card-shaped target. */}
        <DhabaPhoto
          src={photoSrc}
          alt=""
          className="block w-full h-28"
          raw
        />

        <div className="p-3.5">
        {/* Header: route hint micro-label + dismiss */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            {dhaba.routeHint || distanceLabel ? (
              <div className="flex items-center gap-1.5 text-[10.5px] font-medium uppercase tracking-[0.04em] text-ink-muted">
                {dhaba.routeHint ? (
                  <span className="truncate">{dhaba.routeHint}</span>
                ) : null}
                {dhaba.routeHint && distanceLabel ? (
                  <span aria-hidden className="text-paper-warm">·</span>
                ) : null}
                {distanceLabel ? (
                  <span className="tabular-nums whitespace-nowrap normal-case tracking-normal">
                    {distanceLabel}
                  </span>
                ) : null}
              </div>
            ) : null}
            <h3 className="mt-0.5 text-[15px] font-semibold leading-[1.25] text-ink truncate">
              {dhaba.title}
            </h3>
          </div>
          <button
            type="button"
            aria-label="Close preview"
            onClick={onDismiss}
            className="flex-none -mr-1 -mt-1 w-8 h-8 flex items-center justify-center rounded-full text-ink-muted hover:text-ink hover:bg-paper-soft transition"
          >
            <svg aria-hidden viewBox="0 0 12 12" className="w-3 h-3">
              <path d="M1 1l10 10M11 1L1 11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none" />
            </svg>
          </button>
        </div>

        {/* Tags — capped at 3 so the preview stays compact */}
        {dhaba.tags.length > 0 ? (
          <ul className="mt-2 flex flex-wrap gap-1.5" role="list">
            {dhaba.tags.slice(0, 3).map((t) => (
              <li key={t}><Tag label={t} /></li>
            ))}
          </ul>
        ) : null}

        {/* Info strip — open status · today's hours · tap-to-call. Mirrors
            the Google Maps sidebar pattern: decision-support info visible
            without leaving the map. Only renders when at least one field
            has data. */}
        {openStatus !== "unknown" || todaySummary || dhaba.phone ? (
          <div className="mt-2.5 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[13px] leading-none">
            {openStatus === "open" ? (
              <span className="inline-flex items-center gap-1 text-[12px] font-semibold text-leaf">
                <span aria-hidden className="w-1.5 h-1.5 rounded-full bg-leaf" />
                Open now
              </span>
            ) : openStatus === "closed" ? (
              <span className="inline-flex items-center gap-1 text-[12px] font-semibold text-clay-700">
                <span aria-hidden className="w-1.5 h-1.5 rounded-full bg-clay-500" />
                Closed
              </span>
            ) : null}

            {todaySummary ? (
              <span className="text-[12.5px] text-ink-muted tabular-nums truncate">
                {todaySummary}
              </span>
            ) : null}

            {dhaba.phone ? (
              <a
                href={`tel:${dhaba.phone.replace(/\D/g, "")}`}
                className="inline-flex items-center gap-1 text-[13px] font-medium text-clay-600 hover:text-clay-700 transition tabular-nums"
              >
                <svg aria-hidden viewBox="0 0 16 16" fill="currentColor" className="w-3 h-3 flex-none">
                  <path d="M3.6 1C2.7 1 2 1.7 2 2.6v.9c0 5.8 4.7 10.5 10.5 10.5h.9c.9 0 1.6-.7 1.6-1.6v-1.9a.5.5 0 00-.3-.5l-2.5-1a.5.5 0 00-.6.2l-.8 1.2a8.5 8.5 0 01-4.2-4.2l1.2-.8a.5.5 0 00.2-.6l-1-2.5A.5.5 0 005.5 1H3.6z" />
                </svg>
                {dhaba.phone}
              </a>
            ) : null}
          </div>
        ) : null}

        {/* Actions — the site's guiding principle is to keep users on
            dhabaroute.com, so the primary button now routes to the detail
            page (full hours, description, contribute form). Google Maps is
            demoted to a quiet ghost icon next to it, for the rare case the
            user really does want turn-by-turn now. */}
        <div className="mt-3 flex items-center gap-2">
          <Link
            href={`/dhabas/${dhaba.slug}`}
            className={[
              "flex-1 inline-flex items-center justify-center gap-1.5 h-11 rounded-xl",
              "bg-clay-500 text-white text-[13px] font-semibold",
              "shadow-cta hover:bg-clay-600 active:scale-[0.99] transition",
            ].join(" ")}
          >
            View details →
          </Link>
          {dhaba.mapsUrl ? (
            <a
              href={dhaba.mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Open in Google Maps"
              className={[
                "flex-none inline-flex items-center justify-center w-11 h-11 rounded-xl",
                "bg-white border border-paper-warm text-ink-soft",
                "hover:border-clay-300 hover:text-ink active:scale-[0.99] transition",
              ].join(" ")}
            >
              <svg aria-hidden viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4">
                <path d="M8 1a5 5 0 00-5 5c0 3.5 4.4 7.8 4.6 8a.6.6 0 00.8 0C8.6 13.8 13 9.5 13 6a5 5 0 00-5-5zm0 6.8A1.8 1.8 0 1110 6a1.8 1.8 0 01-2 1.8z" />
              </svg>
            </a>
          ) : null}
        </div>
        </div>
      </div>
    </div>
  );
}
