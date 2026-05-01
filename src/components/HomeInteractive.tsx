"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Dhaba, RankedDhaba, Tag as TagType } from "@/lib/types";
import { rankByDistance, formatDistance } from "@/lib/geo";
import { useGeolocation } from "@/lib/useGeolocation";
import { getOpenStatus } from "@/lib/isOpenNow";
import { DhabaCard } from "./DhabaCard";
import { DhabaPhoto } from "./DhabaPhoto";
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

type ViewMode = "split" | "list" | "map";

// v2 chip list — intentional narrow set chosen for highway driver scanning
// (planning > exhaustive). The hybrid display mode below filters to ones
// with ≥1 match in the data so empty/dead chips never render. As tags get
// backfilled into the dataset, missing chips light up automatically.
const V2_TAGS = ["Vegetarian", "Truck Parking", "Late Night", "Dine-In"] as const;

export function HomeInteractive({ dhabas, filterTags }: Props) {
  const [query, setQuery] = useState("");
  const [activeTags, setActiveTags] = useState<Set<string>>(new Set());
  const [openNowActive, setOpenNowActive] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  // Explicit view toggle — default "split" matches the prior auto-behavior.
  // Mobile users often prefer "list", desktop power-users "map". Giving
  // an explicit control removes ambiguity.
  const [viewMode, setViewMode] = useState<ViewMode>("split");

  const geo = useGeolocation();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return dhabas.filter((d) => {
      // Open Now is a live filter — recomputes every render against the
      // viewer's clock. Combined with tag/query filters via AND semantics
      // (must be open AND match the other criteria).
      if (openNowActive && getOpenStatus(d.hours) !== "open") return false;
      if (activeTags.size > 0) {
        // OR / union semantics — a dhaba matches if it has ANY of the
        // selected tags. Multi-select is additive (broader results), not
        // subtractive. With tag frequency being low (most dhabas have 1–3
        // tags), AND semantics would collapse to zero matches for 2+ chips
        // and trip the fallback, which incorrectly showed all pins on the
        // map. See bug: "map breaks when multiple chips selected."
        const ok = d.tags.some((t) => activeTags.has(t));
        if (!ok) return false;
      }
      if (!q) return true;
      const hay = [d.title, d.description ?? "", d.routeHint ?? "", d.tags.join(" ")]
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [dhabas, query, activeTags, openNowActive]);

  const rankedMatches: RankedDhaba[] = useMemo(
    () => rankByDistance(filtered, geo.coords),
    [filtered, geo.coords],
  );

  // Fallback list — every dhaba ranked by distance, ignoring filters/search.
  // Used when matches come up empty so the user never hits a dead end.
  const rankedAll: RankedDhaba[] = useMemo(
    () => rankByDistance(dhabas, geo.coords),
    [dhabas, geo.coords],
  );

  // Active query/filters produced zero matches → show nearest dhabas instead
  // with a banner so the user knows why the list isn't exactly what they
  // typed. Keeps the page useful for a 2-second glance.
  const hasFilters = activeTags.size > 0 || query.length > 0 || openNowActive;
  const isFallback = hasFilters && rankedMatches.length === 0;
  const ranked: RankedDhaba[] = isFallback ? rankedAll : rankedMatches;

  // When fallback is active, the map should mirror the list so pins and cards
  // stay in sync — otherwise the map would go empty under a "nothing matches"
  // filter while the list shows nearest.
  const mapDhabas: Dhaba[] = isFallback ? dhabas : filtered;

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

  // Deep-link support — clicking a tag on a detail page navigates here
  // with ?tag=X. On mount, pre-activate that chip so the list + map
  // filter immediately to matching dhabas. Runs once; later edits to
  // the chip state are driven by user interaction.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const tag = params.get("tag");
    if (tag) setActiveTags(new Set([tag]));
  }, []);

  const toggleTag = useCallback((tag: string) => {
    setActiveTags((prev) => {
      const next = new Set(prev);
      if (next.has(tag)) next.delete(tag);
      else next.add(tag);
      return next;
    });
  }, []);

  // v2 hybrid chip set: intersect the curated V2_TAGS list with the dataset's
  // present tags so we render exactly the v2 visual narrow set, but suppress
  // any chip that would currently match zero dhabas. As Vegetarian / Late
  // Night / Dine-In tags get backfilled into data, those chips light up.
  const presentTags = useMemo(
    () => V2_TAGS.filter((t) => filterTags.includes(t as TagType)) as TagType[],
    [filterTags],
  );

  const mappableCount = mapDhabas.filter((d) => d.lat != null && d.lng != null).length;

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
              dhabas={mapDhabas}
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
          {/* Compact legend under the map. Semantic <dl> pairs dots (dt)
              with their labels (dd) so screen readers announce the mapping
              instead of orphan "dhaba"/"you" tokens. */}
          <div className="mt-2 flex items-center justify-between text-[12px] text-ink-muted">
            <dl aria-label="Map legend" className="flex items-center gap-4 m-0">
              <PinLegendItem color="bg-clay-500" label="Dhaba" />
              <PinLegendItem color="bg-ocean" label="You" />
            </dl>
            <span className="tabular-nums">
              {mapDhabas.length > mappableCount
                ? `${mappableCount} of ${mapDhabas.length} on map`
                : `${mappableCount} on map`}
            </span>
          </div>
        </div>
      ) : (
        <NoPinsNote filteredCount={mapDhabas.length} hasFilters={hasFilters} />
      )}
    </div>
  );

  const listHeading = isFallback
    ? "Showing nearest dhabas"
    : hasFilters
    ? "Matching dhabas"
    : geo.coords
    ? "Nearest dhabas"
    : "All dhabas";

  const listSection = (
    <div className="container-page mt-7">
      <div className="flex items-baseline justify-between mb-2">
        <h2 className="text-[15px] sm:text-base font-semibold tracking-tight text-ink">
          {listHeading}
        </h2>
        <p className="text-[13px] text-ink-muted tabular-nums" aria-live="polite" aria-atomic>
          {ranked.length} {ranked.length === 1 ? "stop" : "stops"}
        </p>
      </div>

      {/* Fallback note — the list is always populated (never empty state) so
          the driver always has somewhere to go. Clay-tinted so it reads as
          an advisory, not ambient text. */}
      {isFallback ? (
        <div className="mb-3 rounded-xl border border-clay-100 bg-clay-50 px-3.5 py-2.5">
          <p className="text-[12.5px] text-clay-700 leading-snug">
            No exact matches for your search.{" "}
            <button
              type="button"
              onClick={() => { setQuery(""); setActiveTags(new Set()); }}
              className="font-semibold text-clay-700 hover:text-clay-800 underline-offset-2 hover:underline transition"
            >
              Clear filters
            </button>
          </p>
        </div>
      ) : null}

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
    </div>
  );

  return (
    <section
      id="nearby"
      // CSS custom property drives map height; we shrink it when coverage
      // is sparse so the list gets visual priority.
      style={
        {
          "--map-h":
            viewMode === "map"
              ? "clamp(400px, 60vw, 600px)"
              : listFirst
              ? "clamp(200px, 28vw, 320px)"
              : "clamp(280px, 44vw, 520px)",
        } as React.CSSProperties
      }
    >
      {/* ── v2 sticky heading + search zone ───────────────────────
          Single sticky block at top: 60px (under the 60px-tall header).
          Replaces the v1 hero + separate sticky toolbar combo. Heading
          and subline scroll-stick along with search/chips so a driver
          mid-scroll always sees the full filter context.

          Spec:
            top: 60px, z-index: 30
            bg rgba(250,248,243,0.96), blur(14px), border-b #e4d8c6
            padding 20px 32px 12px (horizontal lives in container-page) */}
      <div
        className="sticky top-[60px] z-30"
        style={{
          background: "rgba(250,248,243,0.96)",
          backdropFilter: "blur(14px)",
          WebkitBackdropFilter: "blur(14px)",
          borderBottom: "1px solid #e4d8c6",
        }}
      >
        <div
          className="container-page"
          style={{ paddingTop: 20, paddingBottom: 12 }}
        >
          {/* Heading row — H1 left, stats right */}
          <div className="flex items-baseline justify-between gap-4">
            <h1
              className="font-display font-extrabold text-ink leading-[1.1]"
              style={{
                fontSize: "clamp(20px, 2.4vw, 30px)",
                letterSpacing: "-0.025em",
              }}
            >
              Find real dhabas on your route.
            </h1>
            <p
              className="hidden sm:block whitespace-nowrap font-ui tabular-nums"
              style={{ fontSize: "11px", color: "rgba(28,24,20,0.38)" }}
            >
              {dhabas.length} dhabas · 28 states
            </p>
          </div>

          {/* Subline — hidden on mobile to keep the sticky zone compact */}
          <p
            className="hidden sm:block font-ui"
            style={{
              fontSize: "13.5px",
              color: "var(--ink-muted)",
              lineHeight: 1.5,
              marginTop: 2,
              marginBottom: 12,
            }}
          >
            Built for drivers who are hungry and on the move.
          </p>

          {/* Search bar with embedded "Near me" pill (saffron, right side).
              The pill slides left when a clear-× appears so both stay visible. */}
          <SearchBar
            query={query}
            setQuery={setQuery}
            onNearMe={() => geo.request()}
            geoStatus={geo.status}
          />

          {/* Filter chips + view toggle */}
          <div className="mt-2.5 flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <FilterChips
                tags={presentTags}
                active={activeTags}
                toggle={toggleTag}
                clearTags={() => {
                  setActiveTags(new Set());
                  setOpenNowActive(false);
                }}
                openNowActive={openNowActive}
                toggleOpenNow={() => setOpenNowActive((v) => !v)}
              />
            </div>
            {hasAnyPins ? (
              <ViewToggle mode={viewMode} setMode={setViewMode} />
            ) : null}
          </div>
        </div>
      </div>

      {/* View mode controls which sections render.
          - "list": list only (phone-first reading)
          - "map":  map only, full height (desktop power-users)
          - "split": current auto-behavior. Sparse coverage puts list first. */}
      {viewMode === "list" ? (
        listSection
      ) : viewMode === "map" ? (
        hasAnyPins ? mapSection : (
          <div className="container-page mt-4">
            <NoPinsNote filteredCount={mapDhabas.length} hasFilters={hasFilters} />
          </div>
        )
      ) : listFirst ? (
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

function SearchBar({
  query,
  setQuery,
  onNearMe,
  geoStatus,
}: {
  query: string;
  setQuery: (v: string) => void;
  onNearMe: () => void;
  geoStatus: ReturnType<typeof useGeolocation>["status"];
}) {
  // v2: input padding-right adapts so the "Near me" pill never collides with
  // the text. When a query is present, the clear × inserts at right-3 and the
  // pill slides left to right-12 to keep room.
  const hasQuery = query.length > 0;
  const isLocating = geoStatus === "locating";
  // Reserve enough right padding for the pill (≈100px label) plus the × when shown.
  const inputPaddingRight = hasQuery ? 152 : 116;

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
        // Placeholder hints at tag-style queries ("Vegetarian", "Truck Parking")
        // via the word "cuisine" — tags are searchable via the hay string below.
        placeholder="Search by name, highway, city, or cuisine"
        value={query}
        // On mobile, tapping the virtual keyboard's Enter/Go key committed
        // the query but left the keyboard up, covering the results. Blur
        // the input on Enter to dismiss the keyboard so results are visible.
        onKeyDown={(e) => {
          if (e.key === "Enter") e.currentTarget.blur();
        }}
        onChange={(e) => setQuery(e.target.value)}
        style={{
          paddingRight: inputPaddingRight,
          // v2 search bar chrome: 1.5px solid paper-warm at rest, ocean
          // focus border + 3px soft halo. Inline so the focus transition
          // doesn't fight Tailwind's ring utility.
          border: "1.5px solid #e4d8c6",
        }}
        className={[
          "w-full h-12 pl-10 rounded-full bg-white",
          "text-[15px] text-ink placeholder:text-ink-muted/75",
          "focus:outline-none transition-[border-color,box-shadow] duration-150",
        ].join(" ")}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = "var(--ocean)";
          e.currentTarget.style.boxShadow = "0 0 0 3px rgba(42,95,140,0.10)";
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = "#e4d8c6";
          e.currentTarget.style.boxShadow = "none";
        }}
      />

      {/* Clear × — appears only when query is non-empty, sits at the far right */}
      {hasQuery ? (
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

      {/* "Near me" pill — saffron, inside the search bar on the right.
          Slides left when a clear-× appears so both fit cleanly. */}
      <button
        type="button"
        onClick={onNearMe}
        disabled={isLocating}
        aria-label={isLocating ? "Locating you" : "Find dhabas near me"}
        className={[
          "absolute top-1/2 -translate-y-1/2",
          "inline-flex items-center gap-1.5 h-[34px] px-3 rounded-full",
          "font-ui font-semibold text-white",
          "transition-[right,opacity] duration-150",
          "disabled:opacity-70 hover:opacity-[0.88]",
        ].join(" ")}
        style={{
          right: hasQuery ? 44 : 6,
          background: "var(--accent)",
          fontSize: "11.5px",
        }}
      >
        <svg
          aria-hidden
          viewBox="0 0 14 14"
          className="w-3 h-3 flex-none"
          fill="currentColor"
        >
          <path d="M7 1.5a3.5 3.5 0 00-3.5 3.5c0 2.6 3.1 5.7 3.3 5.85a.3.3 0 00.4 0c.2-.15 3.3-3.25 3.3-5.85A3.5 3.5 0 007 1.5zm0 4.9A1.4 1.4 0 118.4 5 1.4 1.4 0 017 6.4z" />
        </svg>
        {isLocating ? "Locating…" : "Near me"}
      </button>
    </div>
  );
}

function FilterChips({
  tags, active, toggle, clearTags, openNowActive, toggleOpenNow,
}: {
  tags: TagType[];
  active: Set<string>;
  toggle: (t: string) => void;
  clearTags: () => void;
  openNowActive: boolean;
  toggleOpenNow: () => void;
}) {
  // "All" acts as the implicit empty-selection state — clicking it clears
  // every tag filter (incl. Open Now). It's rendered active when no tag
  // is selected so the chip row always has a visible anchor.
  const noneActive = active.size === 0 && !openNowActive;
  const scrollRef = useRef<HTMLDivElement>(null);
  // atEnd includes the "no overflow" case so the fade disappears when the
  // row fits fully (e.g. desktop with few tags). Updated on scroll + resize +
  // whenever the tag list changes.
  const [atEnd, setAtEnd] = useState(true);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const update = () => {
      // 1px tolerance for sub-pixel rounding; ditto the end check.
      const noOverflow = el.scrollWidth <= el.clientWidth + 1;
      const reachedEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 1;
      setAtEnd(noOverflow || reachedEnd);
    };
    update();
    el.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      el.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [tags.length]);

  // v2 chip base styling: h-9 (36px), 12.5px / weight 500, 1.5px paper-warm
  // border at rest, saffron fill when active. Tailwind classes keep this
  // unified across All / tags / Open Now (Open Now overrides colors only).
  const chipBase =
    "inline-flex items-center h-9 px-4 rounded-full whitespace-nowrap text-[12.5px] font-medium border-[1.5px] transition select-none";

  return (
    // Wrapper is relative so the absolute fade overlay sits on the right edge.
    // The fade signals "scroll for more" on mobile and at any width where the
    // chip row overflows. Hidden (opacity-0) once the user reaches the end so
    // it doesn't clip the final chip cosmetically after they've found the end.
    <div className="relative">
      <div ref={scrollRef} className="overflow-x-auto no-scrollbar">
        <ul role="list" className="flex gap-2 min-w-max pr-8">
          <li>
            <button
              type="button"
              onClick={clearTags}
              aria-pressed={noneActive}
              className={[
                chipBase,
                noneActive
                  ? "bg-clay-500 text-white border-clay-500 shadow-cta"
                  : "bg-white border-paper-warm hover:border-clay-300 hover:text-ink",
              ].join(" ")}
              style={noneActive ? undefined : { color: "#6a5a4a" }}
            >
              All
            </button>
          </li>
          {tags.map((tag) => {
            const on = active.has(tag);
            return (
              <li key={tag}>
                <button
                  type="button"
                  onClick={() => toggle(tag)}
                  aria-pressed={on}
                  className={[
                    chipBase,
                    on
                      // Filled saffron — clay-500 now resolves to var(--accent) #df6028.
                      ? "bg-clay-500 text-white border-clay-500 shadow-cta"
                      : "bg-white border-paper-warm hover:border-clay-300 hover:text-ink",
                  ].join(" ")}
                  style={on ? undefined : { color: "#6a5a4a" }}
                >
                  {tag}
                </button>
              </li>
            );
          })}

          {/* Open Now — v2 special chip. Green styling distinguishes it from
              tag chips so users read it as a different filter dimension
              (state, not category). Live filter — see HomeInteractive's
              filtered useMemo for getOpenStatus() wiring. */}
          <li>
            <button
              type="button"
              onClick={toggleOpenNow}
              aria-pressed={openNowActive}
              className={[chipBase, "transition-colors"].join(" ")}
              style={
                openNowActive
                  ? {
                      background: "var(--green)",
                      color: "#fff",
                      borderColor: "var(--green)",
                    }
                  : {
                      background: "#fff",
                      color: "var(--green)",
                      borderColor: "var(--green-line)",
                    }
              }
            >
              <span
                aria-hidden
                className="rounded-full mr-1.5 inline-block"
                style={{
                  width: 6,
                  height: 6,
                  background: openNowActive ? "#fff" : "var(--leaf)",
                }}
              />
              Open Now
            </button>
          </li>
        </ul>
      </div>
      <div
        aria-hidden
        className={[
          "pointer-events-none absolute right-0 inset-y-0 w-10",
          "bg-gradient-to-l from-paper to-transparent",
          "transition-opacity duration-150",
          atEnd ? "opacity-0" : "opacity-100",
        ].join(" ")}
      />
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

function PinLegendItem({ color, label }: { color: string; label: string }) {
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

// Three-way view toggle — list · split · map. Styled as a segmented pill
// group; the active segment gets the clay CTA treatment so it reads as the
// current selection at a glance. The map option is only rendered when there
// are actually pins to show (hasAnyPins gates it at the call site).
function ViewToggle({
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
      label: "Split view",
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

  return (
    <div
      role="tablist"
      aria-label="View mode"
      className="flex-none inline-flex items-center rounded-full border border-paper-warm bg-white p-0.5"
    >
      {items.map((it) => {
        const active = mode === it.id;
        return (
          <button
            key={it.id}
            role="tab"
            type="button"
            aria-selected={active}
            aria-label={it.label}
            onClick={() => setMode(it.id)}
            className={[
              "inline-flex items-center justify-center w-9 h-9 rounded-full transition",
              active
                ? "bg-clay-500 text-white shadow-cta"
                : "text-ink-muted hover:text-ink",
            ].join(" ")}
          >
            {it.icon}
          </button>
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
function MapPinPreview({
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
          src={dhaba.imageUrl}
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
