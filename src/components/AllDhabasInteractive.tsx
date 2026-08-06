"use client";

// Standalone "all dhabas" browser — /all-dhabas. Same list/split/map
// ViewToggle and MapView/DhabaCard rendering as the home page, minus the
// State/Highway/tag filter chips (name/highway/city search only). Shows the
// full dataset by default — that's the point of this page, unlike /search.

import dynamic from "next/dynamic";
import { useMemo, useState } from "react";
import type { Dhaba, RankedDhaba, Tag as TagType } from "@/lib/types";
import { rankByDistance, formatDistance } from "@/lib/geo";
import { useGeolocation } from "@/lib/useGeolocation";
import { useDhabaFilters } from "@/lib/useDhabaFilters";
import { DhabaCard } from "./DhabaCard";
import { SearchBar } from "./search/SearchBar";
import {
  type ViewMode,
  LocationBanner,
  NoPinsNote,
  PinLegendItem,
  ViewToggle,
  MapPinPreview,
} from "./search/ListMapPrimitives";

// MapView touches `window` on import — client-only via dynamic. Same pattern
// as HomeInteractive.tsx / DhabaDetailMap.tsx.
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

export function AllDhabasInteractive({ dhabas, filterTags }: Props) {
  // Only `query`/`setQuery` from the hook are exposed in this page's UI —
  // no State/Highway/tag/Open Now controls render, so those dimensions of
  // the hook simply stay at their default "off" values.
  const { query, setQuery, filtered } = useDhabaFilters(dhabas, filterTags);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("split");
  const geo = useGeolocation();

  const ranked: RankedDhaba[] = useMemo(
    () => rankByDistance(filtered, geo.coords),
    [filtered, geo.coords],
  );

  const selectedDhaba = useMemo(
    () => ranked.find((d) => d.id === selectedId) ?? null,
    [ranked, selectedId],
  );

  const mappableCount = filtered.filter((d) => d.lat != null && d.lng != null).length;
  const hasAnyPins = mappableCount > 0;
  const listFirst = mappableCount < 8;

  const mapSection = (
    <div className="container-page mt-4">
      <LocationBanner geo={geo} />
      {hasAnyPins ? (
        <div className="mt-3">
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
          <div className="mt-2 flex items-center justify-between text-[12px] text-ink-muted">
            <dl aria-label="Map legend" className="flex items-center gap-4 m-0">
              <PinLegendItem color="bg-clay-500" label="Dhaba" />
              <PinLegendItem color="bg-ocean" label="You" />
            </dl>
            <span className="tabular-nums">
              {filtered.length > mappableCount
                ? `${mappableCount} of ${filtered.length} on map`
                : `${mappableCount} on map`}
            </span>
          </div>
        </div>
      ) : (
        <NoPinsNote filteredCount={filtered.length} hasFilters={query.length > 0} />
      )}
    </div>
  );

  const listSection = (
    <div className="container-page mt-7">
      <div className="flex items-baseline justify-between mb-2">
        <h2 className="text-[15px] sm:text-base font-semibold tracking-tight text-ink">
          {query.length > 0 ? "Matching dhabas" : geo.coords ? "Nearest dhabas" : "All dhabas"}
        </h2>
        <p className="text-[13px] text-ink-muted tabular-nums" aria-live="polite" aria-atomic>
          {ranked.length} {ranked.length === 1 ? "stop" : "stops"}
        </p>
      </div>

      {ranked.length === 0 ? (
        <div className="mb-3 rounded-xl border border-clay-100 bg-clay-50 px-3.5 py-2.5">
          <p className="text-[12.5px] text-clay-700 leading-snug">
            No dhabas match &ldquo;{query}&rdquo;.{" "}
            <button
              type="button"
              onClick={() => setQuery("")}
              className="font-semibold text-clay-700 hover:text-clay-800 underline-offset-2 hover:underline transition"
            >
              Clear search
            </button>
          </p>
        </div>
      ) : (
        <ul role="list" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {ranked.map((d) => (
            <li key={d.id} data-dhaba-id={d.id} className="min-w-0">
              <DhabaCard
                dhaba={d}
                compact={viewMode === "list"}
                distanceLabel={d.distanceKm != null ? formatDistance(d.distanceKm) : undefined}
                isSelected={d.id === selectedId}
                onActivate={() => setSelectedId(d.id)}
                onDeactivate={() =>
                  setSelectedId((prev) => (prev === d.id ? null : prev))
                }
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );

  return (
    <section
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
      <div className="container-page pt-6">
        <h1 className="font-display text-[24px] sm:text-[28px] font-extrabold tracking-tight text-ink">
          All dhabas
        </h1>
        <p className="mt-1 text-[13.5px] text-ink-muted leading-relaxed">
          Every dhaba on DhabaRoute — search by name, highway, or city.
        </p>

        <div className="mt-4">
          <SearchBar
            query={query}
            setQuery={setQuery}
            onNearMe={() => geo.request()}
            geoStatus={geo.status}
          />
        </div>

        <div className="mt-3 flex justify-end">
          {hasAnyPins ? <ViewToggle mode={viewMode} setMode={setViewMode} /> : null}
        </div>
      </div>

      {viewMode === "list" ? (
        listSection
      ) : viewMode === "map" ? (
        hasAnyPins ? mapSection : (
          <div className="container-page mt-4">
            <NoPinsNote filteredCount={filtered.length} hasFilters={query.length > 0} />
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
        <div className="flex flex-col">
          {mapSection}
          {listSection}
        </div>
      )}
    </section>
  );
}
