"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { Dhaba, RankedDhaba, Tag as TagType } from "@/lib/types";
import { rankByDistance, formatDistance } from "@/lib/geo";
import { useGeolocation } from "@/lib/useGeolocation";
import { useDhabaFilters, countUniqueStates } from "@/lib/useDhabaFilters";
import { DhabaCard } from "./DhabaCard";
import { SearchBar } from "./search/SearchBar";
import { FilterChips } from "./search/FilterChips";
import {
  type ViewMode,
  LocationBanner,
  NoPinsNote,
  PinLegendItem,
  ViewToggle,
  MapPinPreview,
} from "./search/ListMapPrimitives";

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
  const {
    query,
    setQuery,
    activeTags,
    toggleTag,
    openNowActive,
    toggleOpenNow,
    selectedState,
    setSelectedState,
    selectedHighway,
    setSelectedHighway,
    clearAllFilters,
    hasFilters,
    filtered,
    presentTags,
  } = useDhabaFilters(dhabas, filterTags);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  // Explicit view toggle — default "split" matches the prior auto-behavior.
  // Mobile users often prefer "list", desktop power-users "map". Giving
  // an explicit control removes ambiguity.
  const [viewMode, setViewMode] = useState<ViewMode>("split");

  // Mobile gets a slimmed-down home page (hero + one CTA to /search) —
  // the search bar, filter chips, and list/map results moved to their own
  // pages so the home page isn't dominated by search UI on a phone screen.
  // Determined client-side after mount via a useState+useEffect pair —
  // deliberately NOT a module-level constant (like the IS_COARSE_POINTER
  // pattern used elsewhere in this codebase for pointer-type detection),
  // because that pattern is only safe when the value is read inside
  // handlers/effects. Here the value branches the render TREE itself, so a
  // server/client mismatch would trigger a hydration error. Corrects itself
  // on viewport resize — both via matchMedia's "change" event AND a plain
  // window "resize" listener. Belt-and-suspenders deliberately: some
  // browser/WebView combinations (seen firsthand in this environment's
  // remote viewport emulation) don't reliably fire MediaQueryList "change"
  // after a viewport override, so the resize listener is the fallback that
  // actually re-triggers the check in those cases.
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mql = window.matchMedia("(max-width: 639px)");
    const update = () => setIsMobile(mql.matches);
    update();
    // Also re-check one paint later. Verified against the live deploy that
    // some viewport-override paths (seen in this environment's remote
    // testing tools) apply the new width to layout/CSS a frame or two
    // before window.innerWidth/matchMedia become consistent for a script
    // that already started running — a plain mount-time synchronous check
    // can race that and read the old width. A single rAF re-check is a
    // free, event-independent way to self-correct from that race.
    const raf = requestAnimationFrame(update);
    mql.addEventListener("change", update);
    window.addEventListener("resize", update);
    return () => {
      cancelAnimationFrame(raf);
      mql.removeEventListener("change", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  const geo = useGeolocation();
  const stateCount = useMemo(() => countUniqueStates(dhabas), [dhabas]);

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
  // typed. Keeps the page useful for a 2-second glance. `hasFilters` comes
  // from useDhabaFilters above.
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
              onClick={() => { setQuery(""); clearAllFilters(); }}
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
          // min-w-0 keeps the grid track from being widened by a card's
          // intrinsic (max-content) size — see the compact card's amenity
          // row, whose pill strip is wider than the viewport on mobile.
          <li key={d.id} data-dhaba-id={d.id} className="min-w-0">
            <DhabaCard
              dhaba={d}
              // Compact cards are List-view only for now — "List & Map"
              // (split) and every other surface keep the big vertical card.
              compact={viewMode === "list"}
              distanceLabel={d.distanceKm != null ? formatDistance(d.distanceKm) : undefined}
              isSelected={d.id === selectedId}
              onActivate={() => setSelectedId(d.id)}
              // Clear only if this card is still the selected one. Moving the
              // cursor from card A to card B fires A's leave then B's enter —
              // guarding on the id keeps B selected instead of the stale leave
              // wiping it out.
              onDeactivate={() =>
                setSelectedId((prev) => (prev === d.id ? null : prev))
              }
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
      {isMobile ? (
        <MobileHome dhabaCount={dhabas.length} stateCount={stateCount} />
      ) : (
        <>
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
              {dhabas.length} dhabas · {stateCount} states
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
              The pill slides left when a clear-× appears so both stay visible.
              Extra top margin on mobile — the subline above is hidden there,
              so the bar would otherwise sit right under the H1. */}
          <div className="mt-3 sm:mt-0">
            <SearchBar
              query={query}
              setQuery={setQuery}
              onNearMe={() => geo.request()}
              geoStatus={geo.status}
            />
          </div>

          {/* Filter chips + view toggle */}
          <div className="mt-2.5 flex flex-col gap-2.5 sm:flex-row sm:items-center sm:gap-3">
            <div className="w-full min-w-0 sm:flex-1">
              <FilterChips
                tags={presentTags}
                active={activeTags}
                toggle={toggleTag}
                clearTags={clearAllFilters}
                openNowActive={openNowActive}
                toggleOpenNow={toggleOpenNow}
                selectedState={selectedState}
                setSelectedState={setSelectedState}
                selectedHighway={selectedHighway}
                setSelectedHighway={setSelectedHighway}
              />
            </div>
            {/* "+ Submit" shares this row with the view toggle instead of
                getting its own row below — that extra row was mostly empty
                space and made the page noticeably longer. */}
            <div className="flex items-center gap-3 self-end sm:self-auto">
              {hasAnyPins ? (
                <ViewToggle mode={viewMode} setMode={setViewMode} />
              ) : null}
              <Link
                href="/submit"
                className="text-[13px] font-semibold whitespace-nowrap transition-opacity duration-150 hover:opacity-75"
                style={{ color: "var(--green)" }}
              >
                + Submit
              </Link>
            </div>
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
        // Map first, then list — same order on every width. This used to
        // flip to list-first on mobile (map is largely inert on touch: drag
        // is disabled, hover-preview needs a mouse), but that buried the map
        // below a long list of cards, and mobile users reported not seeing
        // a map in "List & Map" at all. Matching the desktop order keeps it
        // visible right under the filters on every device.
        <div className="flex flex-col">
          {mapSection}
          {listSection}
        </div>
      )}
        </>
      )}
    </section>
  );
}

// Mobile-only home content — replaces the search/filter/list/map UI above
// with a slim hero + one CTA (to /search) and a placeholder ad slot, so the
// phone-width home page isn't dominated by search chrome. Desktop is
// unaffected — this only renders when HomeInteractive's isMobile flag is true.
function MobileHome({
  dhabaCount,
  stateCount,
}: {
  dhabaCount: number;
  stateCount: number;
}) {
  return (
    <div className="container-page pt-6 pb-8">
      <h1
        className="font-display font-extrabold text-ink leading-[1.1]"
        style={{ fontSize: "clamp(22px, 6vw, 28px)", letterSpacing: "-0.025em" }}
      >
        Find real dhabas on your route.
      </h1>
      <p
        className="mt-1.5 font-ui"
        style={{ fontSize: "13.5px", color: "var(--ink-muted)", lineHeight: 1.5 }}
      >
        Built for drivers who are hungry and on the move.
      </p>
      <p
        className="mt-1 font-ui tabular-nums"
        style={{ fontSize: "11px", color: "rgba(28,24,20,0.38)" }}
      >
        {dhabaCount} dhabas · {stateCount} states
      </p>

      <Link
        href="/search"
        className={[
          "mt-4 inline-flex h-12 w-full items-center justify-center gap-2 rounded-full",
          "text-white text-[15px] font-semibold shadow-cta",
          "transition-opacity duration-150 hover:opacity-[0.9] active:scale-[0.99]",
        ].join(" ")}
        style={{ background: "var(--accent)" }}
      >
        <svg aria-hidden viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4">
          <circle cx="9" cy="9" r="5.5" />
          <path d="m13 13 3.5 3.5" strokeLinecap="round" />
        </svg>
        Find dhabas near you
      </Link>

      {/* Ad placeholder — visible now so the surrounding spacing can be
          checked before real ad code exists. Swap this block out for the
          real ad unit/script when that's ready. */}
      <div
        aria-hidden
        className="mt-5 flex h-24 min-h-[100px] items-center justify-center rounded-xl border border-dashed"
        style={{ borderColor: "#e4d8c6", background: "var(--paper-soft)" }}
      >
        <span className="text-[11px] font-medium uppercase tracking-[0.08em] text-ink-muted">
          Ad space
        </span>
      </div>
    </div>
  );
}

