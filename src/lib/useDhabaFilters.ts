"use client";

// Shared search/filter state + matching logic — extracted from
// HomeInteractive.tsx so the home page and the standalone /search page can
// both drive the same SearchBar/FilterChips UI off one implementation.
// Returns MATCHES ONLY (no "fallback to nearest" behavior) — callers that
// want a fallback (e.g. the home page) layer that on top of `filtered`.

import { useCallback, useEffect, useMemo, useState } from "react";
import type { Dhaba, Tag as TagType } from "./types";
import { getOpenStatus } from "./isOpenNow";
import { parseRoute } from "./parseRoute";

// v2 chip list — intentional narrow set chosen for highway driver scanning
// (planning > exhaustive). The hybrid display mode below filters to ones
// with ≥1 match in the data so empty/dead chips never render. As tags get
// backfilled into the dataset, missing chips light up automatically.
export const V2_TAGS = ["Vegetarian", "Truck Parking", "Late Night", "Dine-In"] as const;

export function stateFromAddress(address: string | undefined): string | null {
  if (!address) return null;
  const parts = address
    .replace(/,\s*(USA|Canada)$/i, "")
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
  const statePart = parts.at(-1);
  return statePart?.match(/\b[A-Z]{2}\b/)?.[0] ?? null;
}

export function countUniqueStates(dhabas: Dhaba[]): number {
  const states = new Set<string>();
  for (const dhaba of dhabas) {
    const state = parseRoute(dhaba.routeHint).state ?? stateFromAddress(dhaba.address);
    if (state) states.add(state.toLowerCase());
  }
  return states.size;
}

export interface UseDhabaFiltersResult {
  query: string;
  setQuery: (v: string) => void;
  activeTags: Set<string>;
  toggleTag: (tag: string) => void;
  openNowActive: boolean;
  toggleOpenNow: () => void;
  selectedState: string | null;
  setSelectedState: (v: string | null) => void;
  selectedHighway: string | null;
  setSelectedHighway: (v: string | null) => void;
  clearAllFilters: () => void;
  hasFilters: boolean;
  filtered: Dhaba[];
  presentTags: TagType[];
}

export function useDhabaFilters(
  dhabas: Dhaba[],
  filterTags: TagType[],
): UseDhabaFiltersResult {
  const [query, setQuery] = useState("");
  const [activeTags, setActiveTags] = useState<Set<string>>(new Set());
  const [openNowActive, setOpenNowActive] = useState(false);
  // State/Highway are single-select — a dhaba is either in the selected
  // state/on the selected interstate or it isn't, unlike the OR-semantics
  // amenity tag chips above.
  const [selectedState, setSelectedState] = useState<string | null>(null);
  const [selectedHighway, setSelectedHighway] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return dhabas.filter((d) => {
      // Open Now is a live filter — recomputes every render against the
      // viewer's clock. Combined with tag/query filters via AND semantics
      // (must be open AND match the other criteria).
      if (openNowActive && getOpenStatus(d.hours) !== "open") return false;
      if (selectedState) {
        const st = parseRoute(d.routeHint).state ?? stateFromAddress(d.address);
        if (!st || st.toUpperCase() !== selectedState) return false;
      }
      if (selectedHighway) {
        const hw = parseRoute(d.routeHint).highway;
        if (!hw || hw.toUpperCase() !== selectedHighway) return false;
      }
      if (activeTags.size > 0) {
        // OR / union semantics — a dhaba matches if it has ANY of the
        // selected tags. See HomeInteractive's original note: AND semantics
        // would collapse to zero matches for 2+ chips given low tag
        // frequency per listing.
        const ok = d.tags.some((t) => activeTags.has(t));
        if (!ok) return false;
      }
      if (!q) return true;
      const { highway, state } = parseRoute(d.routeHint);
      const hay = [
        d.title,
        d.description,
        d.routeHint,
        highway,
        highway?.replace("-", " "),
        state,
        d.address,
        stateFromAddress(d.address),
        d.tags.join(" "),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [dhabas, query, activeTags, openNowActive, selectedState, selectedHighway]);

  const hasFilters =
    activeTags.size > 0 ||
    query.length > 0 ||
    openNowActive ||
    selectedState !== null ||
    selectedHighway !== null;

  // Deep-link support — a caller can navigate here with ?tag=X to
  // pre-activate that chip so the list filters immediately. Runs once;
  // later edits to the chip state are driven by user interaction.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const tag = params.get("tag");
    if (tag) setActiveTags(new Set([tag]));
  }, []);

  const toggleOpenNow = useCallback(() => setOpenNowActive((v) => !v), []);

  const toggleTag = useCallback((tag: string) => {
    setActiveTags((prev) => {
      const next = new Set(prev);
      if (next.has(tag)) next.delete(tag);
      else next.add(tag);
      return next;
    });
  }, []);

  // Single reset used by both the "All" chip and the zero-results fallback
  // banner's "Clear filters" link — keeps every filter dimension in sync.
  const clearAllFilters = useCallback(() => {
    setActiveTags(new Set());
    setOpenNowActive(false);
    setSelectedState(null);
    setSelectedHighway(null);
  }, []);

  // v2 hybrid chip set: intersect the curated V2_TAGS list with the dataset's
  // present tags so we render exactly the v2 visual narrow set, but suppress
  // any chip that would currently match zero dhabas.
  const presentTags = useMemo(
    () => V2_TAGS.filter((t) => filterTags.includes(t as TagType)) as TagType[],
    [filterTags],
  );

  return {
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
  };
}
