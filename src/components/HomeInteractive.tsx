"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { Dhaba, RankedDhaba, Tag as TagType } from "@/lib/types";
import { rankByDistance, formatDistance } from "@/lib/geo";
import { useGeolocation } from "@/lib/useGeolocation";
import { DhabaCard } from "./DhabaCard";
import { Tag } from "./Tag";

// MapView touches `window` on import — client-only via dynamic.
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

interface Props {
  dhabas: Dhaba[];
  filterTags: TagType[];
}

export function HomeInteractive({ dhabas, filterTags }: Props) {
  const [query, setQuery] = useState("");
  const [activeTags, setActiveTags] = useState<Set<string>>(new Set());
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const geo = useGeolocation();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return dhabas.filter((d) => {
      if (activeTags.size > 0) {
        const ok = Array.from(activeTags).every((t) => d.tags.includes(t));
        if (!ok) return false;
      }
      if (!q) return true;
      const hay = [d.title, d.description ?? "", d.routeHint ?? "", d.tags.join(" ")]
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [dhabas, query, activeTags]);

  const ranked: RankedDhaba[] = useMemo(
    () => rankByDistance(filtered, geo.coords),
    [filtered, geo.coords],
  );

  // Resolve the currently selected dhaba once so both the map and the
  // preview card read from the same ranked set (keeps distance in sync).
  const selectedDhaba = useMemo(
    () => ranked.find((d) => d.id === selectedId) ?? null,
    [ranked, selectedId],
  );

  // Escape dismisses the map preview — matches the map-click-to-clear
  // behavior already wired through ClearOnMapClick inside MapView.
  useEffect(() => {
    if (!selectedId) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelectedId(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectedId]);

  const toggleTag = useCallback((tag: string) => {
    setActiveTags((prev) => {
      const next = new Set(prev);
      if (next.has(tag)) next.delete(tag);
      else next.add(tag);
      return next;
    });
  }, []);

  const clearFilters = useCallback(() => {
    setActiveTags(new Set());
    setQuery("");
  }, []);

  // Only surface chips for tags that at least one dhaba actually carries.
  // Prevents filter chips from producing guaranteed-empty results when the
  // CSV hasn't been enriched yet.
  const presentTags = useMemo(() => {
    const inData = new Set(dhabas.flatMap((d) => d.tags));
    return filterTags.filter((t) => inData.has(t));
  }, [dhabas, filterTags]);

  const hasFilters = activeTags.size > 0 || query.length > 0;
  const mappableCount = filtered.filter((d) => d.lat != null && d.lng != null).length;

  // Coverage is sparse when most listings lack coords — threshold picked so
  // that a handful of mapped pins doesn't dominate a long list visually.
  const LIST_FIRST_THRESHOLD = 8;
  const listFirst = mappableCount < LIST_FIRST_THRESHOLD;
  const hasAnyPins = mappableCount > 0;

  const mapSection = (
    <div className="container-page mt-4">
      <LocationBanner geo={geo} />
      {hasAnyPins ? (
        <div className="mt-3">
          {/* relative wrapper lets the preview overlay anchor to the map
              without a layout shift — page scroll position stays put when a
              pin is clicked. */}
          <div className="relative">
            <MapView
              dhabas={filtered}
              userLocation={geo.coords}
              selectedId={selectedId}
              onSelect={setSelectedId}
            />
            {selectedDhaba && selectedDhaba.lat != null && selectedDhaba.lng != null ? (
              <MapPinPreview
                dhaba={selectedDhaba}
                distanceLabel={
                  selectedDhaba.distanceKm != null
                    ? formatDistance(selectedDhaba.distanceKm)
                    : undefined
                }
                onDismiss={() => setSelectedId(null)}
              />
            ) : null}
          </div>
          {/* Compact legend under the map */}
          <div className="mt-2 flex items-center justify-between text-[12px] text-ink-muted">
            <div className="flex items-center gap-4">
              <PinLegendItem color="bg-clay-500" label="Dhaba" />
              <PinLegendItem color="bg-ocean" label="You" />
            </div>
            <span className="tabular-nums">
              {filtered.length > mappableCount
                ? `${mappableCount} of ${filtered.length} on map`
                : `${mappableCount} on map`}
            </span>
          </div>
        </div>
      ) : (
        <NoPinsNote filteredCount={filtered.length} hasFilters={hasFilters} />
      )}
    </div>
  );

  const listSection = (
    <div className="container-page mt-7">
      <div className="flex items-baseline justify-between mb-3.5">
        <h2 className="text-[15px] sm:text-base font-semibold tracking-tight text-ink">
          {hasFilters
            ? "Matching dhabas"
            : geo.coords
            ? "Nearest dhabas"
            : "All dhabas"}
        </h2>
        <p className="text-[11.5px] text-ink-muted tabular-nums" aria-live="polite" aria-atomic>
          {ranked.length} {ranked.length === 1 ? "stop" : "stops"}
        </p>
      </div>

      {ranked.length === 0 ? (
        <EmptyState />
      ) : (
        <ul
          role="list"
          className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
        >
          {ranked.slice(0, 30).map((d) => (
            <li key={d.id} data-dhaba-id={d.id}>
              <DhabaCard
                dhaba={d}
                distanceLabel={d.distanceKm != null ? formatDistance(d.distanceKm) : undefined}
                isSelected={d.id === selectedId}
                onActivate={() => setSelectedId(d.id)}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );

  return (
    <section
      id="nearby"
      // CSS custom property drives map height; we shrink it when coverage
      // is sparse so the list gets visual priority.
      style={
        {
          "--map-h": listFirst
            ? "clamp(200px, 28vw, 320px)"
            : "clamp(280px, 44vw, 520px)",
        } as React.CSSProperties
      }
    >
      {/* ── Sticky toolbar: search + filter chips ── */}
      {/* Positioned under the site header (top-14 = 56px). Stays visible
          while the user scrolls through the card list. */}
      {/* top-[57px] = header h-14 (56px) + 1px border-b — prevents 1px overlap */}
      <div className="sticky top-[57px] z-20 bg-paper/90 backdrop-blur-md border-b border-paper-warm">
        <div className="container-page py-3 space-y-2.5">
          <SearchBar query={query} setQuery={setQuery} />
          {presentTags.length > 0 || hasFilters ? (
            <FilterChips
              tags={presentTags}
              active={activeTags}
              toggle={toggleTag}
              hasFilters={hasFilters}
              clear={clearFilters}
            />
          ) : null}
        </div>
      </div>

      {/* When map coverage is sparse, show the list first and treat the map
          as a supplementary element. Keeps the page useful while we enrich
          coordinates. */}
      {listFirst ? (
        <>
          {listSection}
          {hasAnyPins ? (
            <>
              <div className="container-page mt-10">
                <div className="flex items-baseline justify-between mb-1">
                  <h3 className="text-[15px] font-semibold tracking-tight text-ink">On the map</h3>
                  <span className="text-[12px] text-ink-muted tabular-nums">
                    {mappableCount} of {filtered.length} on map
                  </span>
                </div>
                <p className="text-[12px] text-ink-muted mb-3">
                  We&rsquo;re still adding precise locations. The rest are in the list above.
                </p>
              </div>
              {mapSection}
            </>
          ) : null}
        </>
      ) : (
        <>
          {mapSection}
          {listSection}
        </>
      )}
    </section>
  );
}

// ── Sub-components ─────────────────────────────────────────────

function SearchBar({ query, setQuery }: { query: string; setQuery: (v: string) => void }) {
  return (
    <div className="relative">
      <label htmlFor="dhaba-search" className="sr-only">Search dhabas</label>
      <svg
        aria-hidden
        viewBox="0 0 20 20"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-muted pointer-events-none"
      >
        <circle cx="9" cy="9" r="5.5" />
        <path d="m13 13 3.5 3.5" strokeLinecap="round" />
      </svg>
      <input
        id="dhaba-search"
        type="search"
        inputMode="search"
        autoComplete="off"
        placeholder="Search by name, highway, or city"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className={[
          "w-full h-11 pl-10 pr-10 rounded-full",
          "bg-paper-soft border border-paper-warm",
          "text-[14px] text-ink placeholder:text-ink-muted/75",
          "focus:bg-paper focus:border-ocean focus:ring-2 focus:ring-ocean/20",
          "focus:outline-none transition",
        ].join(" ")}
      />
      {query ? (
        <button
          type="button"
          aria-label="Clear search"
          onClick={() => setQuery("")}
          className="absolute right-3 top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center rounded-full text-ink-muted hover:text-ink hover:bg-paper-warm transition"
        >
          <svg aria-hidden viewBox="0 0 12 12" className="w-3 h-3">
            <path d="M1 1l10 10M11 1L1 11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none" />
          </svg>
        </button>
      ) : null}
    </div>
  );
}

function FilterChips({
  tags, active, toggle, hasFilters, clear,
}: {
  tags: TagType[];
  active: Set<string>;
  toggle: (t: string) => void;
  hasFilters: boolean;
  clear: () => void;
}) {
  return (
    <div className="-mx-5 sm:-mx-8 overflow-x-auto no-scrollbar">
      <ul role="list" className="flex gap-2 px-5 sm:px-8 min-w-max">
        {tags.map((tag) => {
          const on = active.has(tag);
          return (
            <li key={tag}>
              <button
                type="button"
                onClick={() => toggle(tag)}
                aria-pressed={on}
                className={[
                  "inline-flex items-center h-9 px-3.5 rounded-full",
                  "text-[12px] font-medium border transition select-none",
                  on
                    // Selected: saffron on saffron-tinted paper — premium,
                    // reads "active" without the heavy filled pill look.
                    ? "bg-clay-50 text-clay-700 border-clay-300"
                    : "bg-white text-ink-soft border-paper-warm hover:border-clay-300 hover:text-ink",
                ].join(" ")}
              >
                {tag}
              </button>
            </li>
          );
        })}
        {hasFilters ? (
          <li>
            <button
              type="button"
              onClick={clear}
              className="inline-flex items-center h-9 px-3 rounded-full text-[12px] font-medium text-ink-muted hover:text-ink transition"
            >
              Clear
            </button>
          </li>
        ) : null}
      </ul>
    </div>
  );
}

function LocationBanner({ geo }: { geo: ReturnType<typeof useGeolocation> }) {
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
    return (
      <div className="inline-flex items-center gap-1.5 text-[12px] text-ink-muted">
        <span className="w-1.5 h-1.5 rounded-full bg-ink-muted/50 flex-none animate-pulse" aria-hidden />
        Finding your location…
      </div>
    );
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

  // Idle — a quiet ghost button. Primary CTA is "Open in Maps" on each card;
  // location is opt-in, so this stays secondary in weight.
  return (
    <button
      type="button"
      onClick={geo.request}
      className={[
        "inline-flex items-center gap-1.5 h-10 px-3.5 rounded-full",
        "bg-white border border-paper-warm text-ink-soft text-[12.5px] font-medium",
        "hover:border-clay-300 hover:text-ink active:scale-[0.98] transition",
      ].join(" ")}
    >
      <svg aria-hidden viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5 flex-none text-clay-500">
        <path d="M8 1a5 5 0 00-5 5c0 3.5 4.4 7.8 4.6 8a.6.6 0 00.8 0C8.6 13.8 13 9.5 13 6a5 5 0 00-5-5zm0 6.8A1.8 1.8 0 1110 6a1.8 1.8 0 01-2 1.8z" />
      </svg>
      Use my location
    </button>
  );
}

function PinLegendItem({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span aria-hidden className={`inline-block w-2 h-2 rounded-full ${color}`} />
      {label}
    </span>
  );
}

function NoPinsNote({
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

function EmptyState() {
  return (
    <div className="py-14 text-center">
      <p className="text-ink font-medium">No dhabas match.</p>
      <p className="mt-1 text-[13px] text-ink-muted">Try different keywords or clear the filters.</p>
    </div>
  );
}

// Anchored card overlay that appears above the map when a pin is tapped.
// Replaces the earlier scrollIntoView flow, which jumped the whole page to
// the list. The overlay keeps the user in map context — the page scroll
// position is untouched. Dismissed via the × button, Escape, or tapping
// empty map space (ClearOnMapClick inside MapView).
function MapPinPreview({
  dhaba,
  distanceLabel,
  onDismiss,
}: {
  dhaba: RankedDhaba;
  distanceLabel?: string;
  onDismiss: () => void;
}) {
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
          "pointer-events-auto mx-auto max-w-xl",
          "rounded-2xl bg-white border border-paper-warm shadow-cardHover",
          "p-3.5 animate-slide-up",
        ].join(" ")}
      >
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

        {/* Actions — saffron primary (Open in Maps), neutral secondary (Details).
            h-11 keeps both thumb-friendly on mobile. */}
        <div className="mt-3 flex items-center gap-2">
          {dhaba.mapsUrl ? (
            <a
              href={dhaba.mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={[
                "flex-1 inline-flex items-center justify-center gap-1.5 h-11 rounded-xl",
                "bg-clay-500 text-white text-[13px] font-semibold",
                "shadow-cta hover:bg-clay-600 active:scale-[0.99] transition",
              ].join(" ")}
            >
              Open in Maps
              <svg aria-hidden viewBox="0 0 12 12" className="w-3 h-3 flex-none opacity-90">
                <path d="M3 1h8v8M11 1L1 11" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
              </svg>
            </a>
          ) : null}
          <Link
            href={`/dhabas/${dhaba.slug}`}
            className={[
              "inline-flex items-center justify-center h-11 px-4 rounded-xl",
              "bg-white border border-paper-warm text-ink-soft text-[13px] font-medium",
              "hover:border-clay-300 hover:text-ink active:scale-[0.99] transition",
            ].join(" ")}
          >
            Details
          </Link>
        </div>
      </div>
    </div>
  );
}
