import Link from "next/link";
import type { Dhaba } from "@/lib/types";
import { DEFAULT_DHABA_DESCRIPTION } from "@/lib/types";
import { getOpenStatus } from "@/lib/isOpenNow";

// Card information architecture — based on how Yelp, Google Maps, and
// camping directories (Campendium, The Dyrt) present road-traveler listings.
// The single most valuable signal on a phone is "is it open right now" —
// that's promoted to the second line, just under the name.
//
// Scanning order, top to bottom:
// 1. META ROW       — route hint · distance          (quiet uppercase)
// 2. NAME           — largest type, visual anchor
// 3. STATUS + PHONE — "Open now" / "Closed" + tel
// 4. AMENITY ICONS  — icon+label pairs (truck, gas, etc.) for top 3 tags
// 5. DESCRIPTION    — 2-line clamp
// 6. FOOTER         — "View details →"    city, state
//
// The whole card is one click target via an invisible overlay link on the
// title (after:absolute after:inset-0). No nested interactive buttons —
// the Yelp/Airbnb/Google Maps pattern. Keeps mobile taps unambiguous.

interface DhabaCardProps {
  dhaba: Dhaba;
  emphasis?: boolean;
  distanceLabel?: string;
  isSelected?: boolean;
  onActivate?: () => void;
}

export function DhabaCard({
  dhaba,
  emphasis = false,
  distanceLabel,
  isSelected = false,
  onActivate,
}: DhabaCardProps) {
  const openStatus = getOpenStatus(dhaba.hours);
  const city = dhaba.address ? cityFromAddress(dhaba.address) : "";

  return (
    <article
      onMouseEnter={onActivate}
      onFocus={onActivate}
      data-selected={isSelected || undefined}
      className={[
        "group relative flex flex-col rounded-2xl bg-white p-4 sm:p-5 h-full min-h-[160px]",
        "border transition-[border-color,box-shadow,transform] duration-150",
        "shadow-card hover:shadow-cardHover",
        isSelected
          ? "border-clay-500 ring-1 ring-clay-500/30"
          : emphasis
          ? "border-clay-200"
          : "border-paper-warm hover:border-clay-200",
      ].join(" ")}
    >
      {/* 1. META — route + distance, quiet uppercase micro-label */}
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

      {/* 2. NAME — dominant, overlay link spans the card surface */}
      <h3
        className={[
          "min-w-0 text-[16px] sm:text-[17px] font-semibold leading-[1.3] text-ink",
          dhaba.routeHint || distanceLabel ? "mt-1" : "",
        ].join(" ")}
      >
        <Link
          href={`/dhabas/${dhaba.slug}`}
          className="after:absolute after:inset-0 after:rounded-2xl after:content-[''] focus-visible:outline-none"
        >
          {dhaba.title}
        </Link>
      </h3>

      {/* 3. STATUS + PHONE — promoted from the detail page. Users on the
          road need to know if they'll reach a locked door before driving. */}
      {openStatus !== "unknown" || dhaba.phone ? (
        <div className="mt-2 flex items-center gap-2 text-[11.5px] leading-none flex-wrap">
          {openStatus === "open" ? (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-leaf">
              <span aria-hidden className="w-1.5 h-1.5 rounded-full bg-leaf" />
              Open now
            </span>
          ) : openStatus === "closed" ? (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-clay-700">
              <span aria-hidden className="w-1.5 h-1.5 rounded-full bg-clay-500" />
              Closed
            </span>
          ) : null}

          {openStatus !== "unknown" && dhaba.phone ? (
            <span aria-hidden className="text-paper-warm">·</span>
          ) : null}

          {dhaba.phone ? (
            // relative z-10 lifts the tel link above the title's pseudo-element
            // overlay — a phone tap dials, a card-body tap opens the detail page.
            <a
              href={`tel:${dhaba.phone.replace(/\D/g, "")}`}
              className="relative z-10 text-[11.5px] text-ink-muted hover:text-clay-600 transition tabular-nums"
            >
              {dhaba.phone}
            </a>
          ) : null}
        </div>
      ) : null}

      {/* 4. AMENITIES — icon+label pairs. Icons communicate faster than
          text chips for repeat attributes (truck parking, gas, etc.). */}
      {dhaba.tags.length > 0 ? (
        <ul className="mt-2.5 flex flex-wrap gap-x-3 gap-y-1.5" role="list">
          {dhaba.tags.slice(0, 3).map((t) => (
            <li key={t} className="inline-flex items-center gap-1 text-[11px] text-ink-muted">
              <AmenityIcon tag={t} />
              <span className="truncate">{t}</span>
            </li>
          ))}
        </ul>
      ) : null}

      {/* 5. DESCRIPTION — supportive, muted, 2-line clamp */}
      <p className="mt-2.5 text-[13px] leading-snug text-ink-muted line-clamp-2">
        {dhaba.description ?? DEFAULT_DHABA_DESCRIPTION}
      </p>

      {/* 6. FOOTER — "View details →" on left, city/state on right */}
      <div className="mt-auto pt-3 flex items-center justify-between gap-3">
        <span
          aria-hidden
          className="text-[11.5px] text-ink-muted group-hover:text-clay-600 transition inline-flex items-center gap-1"
        >
          View details
          <svg
            viewBox="0 0 12 12"
            className="w-2.5 h-2.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M1 6h10M7 2l4 4-4 4" />
          </svg>
        </span>
        {city ? (
          <span className="text-[11px] text-ink-muted truncate">{city}</span>
        ) : null}
      </div>
    </article>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────

// "5317 US-95, Amargosa Valley, NV 89020, USA" → "Amargosa Valley, NV"
// "5039 Centre St, Niagara Falls, ON L2G 3N6, Canada" → "Niagara Falls, ON"
// Strip the country suffix first, then the postal code from the state component.
// US ZIPs are 5 digits (optionally +4). Canadian postal codes are A1A 1A1.
function cityFromAddress(address: string): string {
  const parts = address
    .replace(/,\s*(USA|Canada)$/i, "")
    .split(",")
    .map((s) => s.trim());
  if (parts.length < 2) return "";
  const statePart = parts[parts.length - 1]
    .replace(/\s+\d{5}(-\d{4})?$/, "") // US ZIP
    .replace(/\s+[A-Z]\d[A-Z]\s*\d[A-Z]\d$/i, "") // CA postal
    .trim();
  const cityPart = parts[parts.length - 2];
  if (!cityPart || !statePart) return "";
  return `${cityPart}, ${statePart}`;
}

// Map a tag to an inline SVG. Unknown tags get a neutral tag glyph so every
// amenity line has a visual anchor — users scan icons faster than text.
function AmenityIcon({ tag }: { tag: string }) {
  const cn = "w-3 h-3 flex-none";
  switch (tag) {
    case "Truck Parking":
    case "Parking":
      return (
        <svg aria-hidden viewBox="0 0 14 14" className={cn} fill="currentColor">
          <path d="M1 4h8v5H1zM9 6h2l1.5 3H9z" />
          <circle cx="3.5" cy="10.5" r="1.1" />
          <circle cx="10.5" cy="10.5" r="1.1" />
        </svg>
      );
    case "Gas":
    case "Fuel Stop":
      return (
        <svg
          aria-hidden
          viewBox="0 0 14 14"
          className={cn}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="2" y="2" width="6" height="9" rx="0.5" />
          <path d="M8 5h1.5a1 1 0 011 1v2a1 1 0 001 1V3l-1.5-1.5" />
          <path d="M3 4h4" />
        </svg>
      );
    case "Bathrooms":
    case "Restrooms":
      return (
        <svg aria-hidden viewBox="0 0 14 14" className={cn} fill="currentColor">
          <circle cx="7" cy="2.5" r="1.5" />
          <path d="M4 6h6v2H8.5v4H5.5V8H4z" />
        </svg>
      );
    case "Showers":
      return (
        <svg
          aria-hidden
          viewBox="0 0 14 14"
          className={cn}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M5 2h4M7 2v2.5" />
          <path d="M3 5h8a0 0 0 010 0 3 3 0 01-3 3H6a3 3 0 01-3-3z" />
          <path d="M5 10v1.5M7 10v1.5M9 10v1.5" />
        </svg>
      );
    case "Seating":
      return (
        <svg
          aria-hidden
          viewBox="0 0 14 14"
          className={cn}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M3 3h8v4H3zM2 7h10M4 7v3.5M10 7v3.5" />
        </svg>
      );
    case "Hotel":
      return (
        <svg
          aria-hidden
          viewBox="0 0 14 14"
          className={cn}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M1.5 11V6a1 1 0 011-1h9a1 1 0 011 1v5M1.5 11h11M4 5V3a1 1 0 011-1h4a1 1 0 011 1v2" />
        </svg>
      );
    case "Vegetarian":
      return (
        <svg
          aria-hidden
          viewBox="0 0 14 14"
          className={cn}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M7 2c3 0 5 2 5 5s-2 5-5 5c-2 0-3-1-3-3s1-3 3-3 3-1 3-3" />
        </svg>
      );
    case "Takeout":
    case "Take Out Only":
    case "Food Truck":
      return (
        <svg
          aria-hidden
          viewBox="0 0 14 14"
          className={cn}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M2.5 4h9l-.7 7.5a.5.5 0 01-.5.45H3.7a.5.5 0 01-.5-.45zM5 4V2.5h4V4" />
        </svg>
      );
    case "Liquor Store":
    case "Store":
      return (
        <svg
          aria-hidden
          viewBox="0 0 14 14"
          className={cn}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M2 5l1-2h8l1 2v1H2zM2.5 6v6h9V6" />
        </svg>
      );
    case "National Park":
      return (
        <svg
          aria-hidden
          viewBox="0 0 14 14"
          className={cn}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M1.5 11L5 5l2 3 1.5-2 4 5z" />
        </svg>
      );
    case "Late Night":
      return (
        <svg
          aria-hidden
          viewBox="0 0 14 14"
          className={cn}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M11 8A4 4 0 016 3a4 4 0 105 5z" />
        </svg>
      );
    default:
      return (
        <svg
          aria-hidden
          viewBox="0 0 14 14"
          className={cn}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M1.5 1.5h5l6 6-5 5-6-6z" />
          <circle cx="4.5" cy="4.5" r="0.8" fill="currentColor" stroke="none" />
        </svg>
      );
  }
}
