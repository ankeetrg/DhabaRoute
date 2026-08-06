"use client";

// Lifted verbatim from HomeInteractive.tsx so the home page and the
// standalone /search page share one implementation. No behavior/visual
// changes from the original.

import { createPortal } from "react-dom";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Tag as TagType } from "@/lib/types";
import { NORTH_AMERICA_STATES, US_INTERSTATES } from "@/lib/regionData";

// Touch (coarse-pointer) devices — used to suppress the dropdown search
// input's autofocus, which would otherwise pop the on-screen keyboard the
// instant a State/Highway picker opens and cover the option list. The
// `typeof window` guard keeps this SSR-safe; the value is re-evaluated with
// the real browser result when the bundle loads client-side (the dropdown
// only ever renders after a client interaction, so that value is what's used).
// Only ever read inside event handlers/JSX attributes below — never used to
// branch the top-level render tree, so it can't cause a hydration mismatch.
const IS_COARSE_POINTER =
  typeof window !== "undefined" &&
  typeof window.matchMedia === "function" &&
  window.matchMedia("(pointer: coarse)").matches;

export function FilterChips({
  tags, active, toggle, clearTags, openNowActive, toggleOpenNow,
  selectedState, setSelectedState, selectedHighway, setSelectedHighway,
  showAllChip = true,
}: {
  tags: TagType[];
  active: Set<string>;
  toggle: (t: string) => void;
  clearTags: () => void;
  openNowActive: boolean;
  toggleOpenNow: () => void;
  selectedState: string | null;
  setSelectedState: (v: string | null) => void;
  selectedHighway: string | null;
  setSelectedHighway: (v: string | null) => void;
  /** Defaults to true (home page's existing behavior). /search passes
   * false — it has no other reset affordance to anchor since it starts
   * with no filters active by design, so the "clear everything" chip was
   * redundant there. */
  showAllChip?: boolean;
}) {
  // "All" acts as the implicit empty-selection state — clicking it clears
  // every filter dimension (tags, Open Now, State, Highway). It's rendered
  // active only when nothing at all is selected, so the chip row always has
  // a visible anchor.
  const noneActive =
    active.size === 0 && !openNowActive && !selectedState && !selectedHighway;
  const scrollRef = useRef<HTMLDivElement>(null);
  // atEnd includes the "no overflow" case so the fade disappears when the
  // row fits fully (e.g. desktop with few tags). Updated on scroll + resize +
  // whenever the tag list or a dropdown's selection (pill width) changes.
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
  }, [tags.length, selectedState, selectedHighway]);

  // v2 chip base styling: h-9 (36px), 12.5px / weight 500, 1.5px paper-warm
  // border at rest, saffron fill when active. Tailwind classes keep this
  // unified across All / tags / Open Now (Open Now overrides colors only).
  const chipBase =
    "inline-flex items-center h-11 sm:h-9 px-4 rounded-full whitespace-nowrap text-[12.5px] font-medium border-[1.5px] transition select-none";

  // Nudges the ribbon forward by roughly one "page" of chips per tap — a
  // plain scroll-affordance for touch users who don't intuit that the fade
  // means "swipe" (mobile only; desktop can already see whether it overflows
  // and has a mouse/trackpad to scroll with).
  const scrollByPage = useCallback(() => {
    scrollRef.current?.scrollBy({ left: 160, behavior: "smooth" });
  }, []);

  return (
    // Wrapper is relative so the absolute fade overlay sits on the right edge.
    // The fade signals "scroll for more" on mobile and at any width where the
    // chip row overflows. Hidden (opacity-0) once the user reaches the end so
    // it doesn't clip the final chip cosmetically after they've found the end.
    <div className="relative">
      <div ref={scrollRef} className="overflow-x-auto no-scrollbar">
        <ul role="list" className="flex gap-2 min-w-max pr-8">
          {/* State / Highway — single-select dropdown pickers, exhaustive
              lists (every North America state/province, every primary US
              Interstate) rather than data-derived like the tag chips below,
              so they work as a full picker even for zero-coverage regions. */}
          <li>
            <FilterDropdown
              label="State"
              options={NORTH_AMERICA_STATES.map((s) => ({ value: s.code, label: s.name }))}
              selected={selectedState}
              onSelect={setSelectedState}
              onClear={() => setSelectedState(null)}
              chipBase={chipBase}
            />
          </li>
          <li>
            <FilterDropdown
              label="Highway"
              options={US_INTERSTATES.map((h) => ({ value: h, label: h }))}
              selected={selectedHighway}
              onSelect={setSelectedHighway}
              onClear={() => setSelectedHighway(null)}
              chipBase={chipBase}
            />
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
              (state, not category). Live filter — see useDhabaFilters'
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

          {/* All — reset chip, now last so State/Highway/Truck Parking/Open
              Now read left-to-right as the primary filter order. */}
          {showAllChip ? (
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
          ) : null}
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
      {/* Scroll-forward arrow — mobile only. The fade above hints that more
          chips exist, but users kept missing that it's a swipe cue, so this
          gives them a tappable affordance that actually scrolls the ribbon.
          Hidden once the end is reached (nothing left to scroll to) and on
          sm+ (desktop already sees the full row or can scroll with a mouse). */}
      {!atEnd ? (
        <button
          type="button"
          onClick={scrollByPage}
          aria-label="Scroll filters right"
          className={[
            "sm:hidden absolute right-1 top-1/2 -translate-y-1/2 z-10",
            "flex items-center justify-center w-7 h-7 rounded-full",
            "bg-white border border-paper-warm shadow-cardHover text-ink-muted",
            "active:scale-95 transition",
          ].join(" ")}
        >
          <svg aria-hidden viewBox="0 0 10 10" className="w-2.5 h-2.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 1.5 7 5l-4 3.5" />
          </svg>
        </button>
      ) : null}
    </div>
  );
}

// Single-select combobox pill shared by the State and Highway filters.
// Unselected: a chip with a caret that opens a searchable list. Selected:
// a filled pill showing the choice with an inline × to clear — clicking the
// pill body (not the ×) reopens the list to change the selection.
function FilterDropdown({
  label,
  options,
  selected,
  onSelect,
  onClear,
  chipBase,
}: {
  label: string;
  options: { value: string; label: string }[];
  selected: string | null;
  onSelect: (value: string) => void;
  onClear: () => void;
  chipBase: string;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const wrapperRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  // Points at whichever trigger button is currently rendered (plain button
  // when unselected, the pill's inner label button when selected) — the DOM
  // node swaps between those two on selection, so a plain ref re-attaches
  // automatically on re-render.
  const triggerBtnRef = useRef<HTMLButtonElement>(null);
  // Panel is portaled to <body> and positioned with `fixed`, computed from
  // the trigger's own on-screen rect. Necessary because the chip row this
  // lives in is `overflow-x-auto` for mobile horizontal scrolling — per the
  // CSS overflow spec, setting overflow-x to anything but `visible` forces
  // overflow-y to clip too, so an absolutely-positioned panel nested inside
  // that row would get cut off the instant it opens. Portaling escapes that
  // clipping ancestor entirely; positioning is then plain-viewport math.
  // top XOR bottom is set depending on whether the panel opens below or
  // above the trigger; maxHeight is clamped to the available space so the
  // inner list scrolls instead of running off a short/landscape viewport.
  const [pos, setPos] = useState<
    { left: number; top?: number; bottom?: number; maxHeight: number } | null
  >(null);

  // Explicit refocus for actions that close the panel from within it
  // (Escape, selecting an option, clearing) — otherwise focus is silently
  // dropped when the trigger's DOM node swaps between the plain button and
  // the selected pill. rAF waits for that swap to commit before focusing.
  // Deliberately NOT wired to outside-click closes, which should leave
  // focus wherever the user actually clicked.
  const focusTriggerSoon = useCallback(() => {
    requestAnimationFrame(() => triggerBtnRef.current?.focus());
  }, []);

  const reposition = useCallback(() => {
    const el = wrapperRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const PANEL_WIDTH = 224; // matches w-56
    const MARGIN = 8; // min gap from any viewport edge
    const GAP = 6; // gap between trigger and panel
    const PANEL_CAP = 288; // matches the old max-h-72 ceiling
    // Clamp horizontally so the panel stays on-screen even when the trigger
    // sits near a viewport edge (e.g. the chip row scrolled mid-way on mobile).
    const left = Math.min(
      Math.max(r.left, MARGIN),
      window.innerWidth - PANEL_WIDTH - MARGIN,
    );
    const spaceBelow = window.innerHeight - r.bottom - GAP - MARGIN;
    const spaceAbove = r.top - GAP - MARGIN;
    // Prefer opening below; flip above only when below is cramped AND above
    // has more room. Anchoring by `bottom` when flipped means we don't need
    // to measure the panel's own height — it grows upward from the trigger.
    if (spaceBelow >= PANEL_CAP || spaceBelow >= spaceAbove) {
      setPos({
        left,
        top: r.bottom + GAP,
        maxHeight: Math.max(140, Math.min(PANEL_CAP, spaceBelow)),
      });
    } else {
      setPos({
        left,
        bottom: window.innerHeight - r.top + GAP,
        maxHeight: Math.max(140, Math.min(PANEL_CAP, spaceAbove)),
      });
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    reposition();
    function handlePointer(e: Event) {
      const target = e.target as Node;
      const insideTrigger = wrapperRef.current?.contains(target);
      const insidePanel = panelRef.current?.contains(target);
      if (!insideTrigger && !insidePanel) setOpen(false);
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
        focusTriggerSoon();
      }
    }
    // Capture phase so this also fires for scroll events on the horizontally
    // scrolling chip row (a descendant scrollable element) — plain `scroll`
    // events don't bubble, but capture-phase listeners on an ancestor still
    // see them on the way down.
    // pointerdown (not mousedown) so tapping empty page space closes the
    // panel reliably on iOS Safari, which doesn't synthesize mousedown on
    // non-interactive elements.
    document.addEventListener("pointerdown", handlePointer);
    document.addEventListener("keydown", handleKey);
    document.addEventListener("scroll", reposition, true);
    window.addEventListener("resize", reposition);
    return () => {
      document.removeEventListener("pointerdown", handlePointer);
      document.removeEventListener("keydown", handleKey);
      document.removeEventListener("scroll", reposition, true);
      window.removeEventListener("resize", reposition);
    };
  }, [open, reposition, focusTriggerSoon]);

  const selectedLabel = selected
    ? options.find((o) => o.value === selected)?.label ?? selected
    : null;

  const filteredOptions = search.trim()
    ? options.filter((o) => o.label.toLowerCase().includes(search.trim().toLowerCase()))
    : options;

  return (
    <div ref={wrapperRef} className="relative inline-block">
      {selectedLabel ? (
        // Selected — filled pill with an inline × clear button. Clicking the
        // label re-opens the list to change the choice.
        <span
          className={[
            chipBase,
            "bg-clay-500 text-white border-clay-500 shadow-cta gap-1.5",
          ].join(" ")}
          // Inline style reliably tightens the right padding around the ×
          // button — appending a conflicting "pr-2" utility class after
          // chipBase's "px-4" wouldn't be guaranteed to win, since Tailwind's
          // generated stylesheet order (not className string order) decides
          // which same-specificity utility applies.
          style={{ paddingRight: 8 }}
        >
          <button
            ref={triggerBtnRef}
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="max-w-[140px] truncate"
          >
            {selectedLabel}
          </button>
          <button
            type="button"
            aria-label={`Clear ${label} filter`}
            onClick={(e) => {
              e.stopPropagation();
              onClear();
              setOpen(false);
              focusTriggerSoon();
            }}
            // Bigger hit area on touch (28px) than the visible glyph; steps
            // back to a compact 16px on mouse/desktop. The pill is 44px tall
            // on mobile so this gives a comfortable ~28×44 tap target.
            className="flex-none w-7 h-7 sm:w-4 sm:h-4 inline-flex items-center justify-center rounded-full hover:bg-white/20 transition"
          >
            <svg aria-hidden viewBox="0 0 12 12" className="w-3 h-3 sm:w-2.5 sm:h-2.5">
              <path d="M1 1l10 10M11 1L1 11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none" />
            </svg>
          </button>
        </span>
      ) : (
        <button
          ref={triggerBtnRef}
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className={[
            chipBase,
            "gap-1.5 bg-white border-paper-warm hover:border-clay-300 hover:text-ink",
          ].join(" ")}
          style={{ color: "#6a5a4a" }}
        >
          {label}
          <svg
            aria-hidden
            viewBox="0 0 10 6"
            className={["w-2.5 h-2.5 transition-transform", open ? "rotate-180" : ""].join(" ")}
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M1 1l4 4 4-4" />
          </svg>
        </button>
      )}

      {open && pos && typeof document !== "undefined"
        ? createPortal(
            <div
              ref={panelRef}
              className="fixed z-[999] w-56 flex flex-col rounded-xl border border-paper-warm bg-white shadow-cardHover overflow-hidden"
              style={{
                top: pos.top,
                bottom: pos.bottom,
                left: pos.left,
                maxHeight: pos.maxHeight,
              }}
            >
              <div className="p-2 border-b border-paper-warm flex-none">
                <input
                  type="text"
                  // Only autofocus on non-touch devices — on phones this would
                  // pop the on-screen keyboard and hide the option list before
                  // the user can scroll it. Touch users tap the field to type.
                  autoFocus={!IS_COARSE_POINTER}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={`Search ${label.toLowerCase()}…`}
                  className="w-full h-9 px-2.5 rounded-lg border border-paper-warm text-[13px] focus:outline-none focus:ring-2 focus:ring-clay-400"
                />
              </div>
              <ul role="list" className="overflow-y-auto py-1">
                {filteredOptions.length === 0 ? (
                  <li className="px-3 py-2 text-[12.5px] text-ink-muted">No matches</li>
                ) : (
                  filteredOptions.map((o) => (
                    <li key={o.value}>
                      <button
                        type="button"
                        onClick={() => {
                          onSelect(o.value);
                          setOpen(false);
                          setSearch("");
                          focusTriggerSoon();
                        }}
                        className={[
                          // py-2.5 on touch (~40px rows) for comfortable
                          // tapping; tighter py-2 on mouse/desktop.
                          "w-full text-left px-3 py-2.5 sm:py-2 text-[13px] transition",
                          o.value === selected
                            ? "bg-clay-50 text-clay-700 font-semibold"
                            : "text-ink hover:bg-paper-soft",
                        ].join(" ")}
                      >
                        {o.label}
                      </button>
                    </li>
                  ))
                )}
              </ul>
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}
