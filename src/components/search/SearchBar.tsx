"use client";

// Lifted verbatim from HomeInteractive.tsx so the home page and the
// standalone /search page share one implementation. No behavior/visual
// changes from the original.

import type { useGeolocation } from "@/lib/useGeolocation";

export function SearchBar({
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
          className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 sm:w-7 sm:h-7 flex items-center justify-center rounded-full text-ink-muted hover:text-ink hover:bg-paper-warm transition"
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
