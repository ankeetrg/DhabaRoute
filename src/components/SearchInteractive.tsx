"use client";

// Standalone search utility — /search. Split out of the home page so a
// phone-width visitor isn't shown 157 dhabas + a map before they've typed
// anything. Deliberately shows NOTHING until a query or filter is active
// (see the !hasFilters branch below) — that's the whole point of moving
// search off the home page.

import Link from "next/link";
import { useMemo } from "react";
import type { Dhaba, RankedDhaba, Tag as TagType } from "@/lib/types";
import { rankByDistance, formatDistance } from "@/lib/geo";
import { useGeolocation } from "@/lib/useGeolocation";
import { useDhabaFilters } from "@/lib/useDhabaFilters";
import { DhabaCard } from "./DhabaCard";
import { SearchBar } from "./search/SearchBar";
import { FilterChips } from "./search/FilterChips";

interface Props {
  dhabas: Dhaba[];
  filterTags: TagType[];
}

export function SearchInteractive({ dhabas, filterTags }: Props) {
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

  const geo = useGeolocation();

  const ranked: RankedDhaba[] = useMemo(
    () => rankByDistance(filtered, geo.coords),
    [filtered, geo.coords],
  );

  return (
    <div className="container-page pt-6 pb-16 max-w-3xl">
      <nav aria-label="Breadcrumb" className="text-[13px] text-ink-muted">
        <Link href="/" className="underline-offset-4 hover:text-ink hover:underline">
          Home
        </Link>
        <span aria-hidden className="mx-2 text-paper-warm">·</span>
        <span className="text-ink-soft">Search Dhabas</span>
      </nav>

      <h1 className="mt-3 font-display text-[24px] sm:text-[28px] font-extrabold tracking-tight text-ink">
        Search dhabas
      </h1>
      <p className="mt-1 text-[13.5px] text-ink-muted leading-relaxed">
        Search by name, highway, city, or filter by state, highway, or amenity.
      </p>

      <div className="mt-4">
        <SearchBar
          query={query}
          setQuery={setQuery}
          onNearMe={() => geo.request()}
          geoStatus={geo.status}
        />
      </div>

      <div className="mt-2.5">
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
          // No "All" reset chip on /search — unlike the home page, this
          // page starts with every filter already off, so a "clear
          // everything" chip had nothing to anchor against.
          showAllChip={false}
        />
      </div>

      {!hasFilters ? (
        <div className="mt-8 rounded-2xl border border-paper-warm bg-paper-soft px-5 py-9 text-center">
          <p className="text-[14px] font-medium text-ink">
            Start typing or pick a filter above.
          </p>
          <p className="mt-1 text-[12.5px] text-ink-muted">
            Search by name, highway, city, or cuisine — or filter by state,
            highway, amenity, or Open Now.
          </p>
          <Link
            href="/all-dhabas"
            className="mt-4 inline-block text-[13px] font-semibold underline underline-offset-4"
            style={{ color: "var(--green)" }}
          >
            Or browse all dhabas →
          </Link>
        </div>
      ) : (
        <div className="mt-6">
          <div className="flex items-baseline justify-between mb-2">
            <h2 className="text-[15px] font-semibold tracking-tight text-ink">
              {ranked.length > 0 ? "Matching dhabas" : "No matches"}
            </h2>
            <p className="text-[13px] text-ink-muted tabular-nums" aria-live="polite" aria-atomic>
              {ranked.length} {ranked.length === 1 ? "stop" : "stops"}
            </p>
          </div>

          {ranked.length === 0 ? (
            <div className="rounded-xl border border-clay-100 bg-clay-50 px-3.5 py-2.5">
              <p className="text-[12.5px] text-clay-700 leading-snug">
                No dhabas match that search.{" "}
                <button
                  type="button"
                  onClick={() => {
                    setQuery("");
                    clearAllFilters();
                  }}
                  className="font-semibold text-clay-700 hover:text-clay-800 underline-offset-2 hover:underline transition"
                >
                  Clear filters
                </button>
              </p>
            </div>
          ) : (
            <ul role="list" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {ranked.slice(0, 60).map((d) => (
                <li key={d.id} className="min-w-0">
                  <DhabaCard
                    dhaba={d}
                    compact
                    distanceLabel={d.distanceKm != null ? formatDistance(d.distanceKm) : undefined}
                  />
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
