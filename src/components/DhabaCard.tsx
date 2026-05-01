import Link from "next/link";
import type { Dhaba } from "@/lib/types";
import { getOpenStatus } from "@/lib/isOpenNow";
import { DhabaPhoto } from "./DhabaPhoto";

// Card v2 — "Airy Light" (Card A from the design exploration).
// Planning-optimized: bigger photo, larger name, today's hours visible,
// 3-line description so route planners can scan quickly.
//
// Scanning order, top to bottom:
// 1. PHOTO          — 190px, full-bleed, no inner radius (card clips it)
// 2. ROUTE          — saffron uppercase + dot prefix    (no pill chrome)
// 3. NAME           — 20px Bricolage 700, visual anchor
// 4. STATUS + HOURS — "Open now · 6:00 AM – 11:00 PM"   (today's hours)
// 5. AMENITY ICONS  — icon+label pairs, top 3 tags
// 6. DESCRIPTION    — 3-line clamp (planning context)
// 7. FOOTER         — "View details →"    city, state   (subtle divider)
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
  const todayHours = getTodayHoursString(dhaba.hours);
  const city = dhaba.address ? cityFromAddress(dhaba.address) : "";

  // v2 border states: rest 1px subtle ink; emphasis 1px translucent saffron;
  // selected 1px solid saffron. Width is fixed at 1px so layout never reflows.
  const borderColor = isSelected
    ? "var(--accent)"
    : emphasis
    ? "rgba(223,96,40,0.25)"
    : "rgba(28,24,20,0.08)";

  return (
    <article
      onMouseEnter={onActivate}
      onFocus={onActivate}
      data-selected={isSelected || undefined}
      style={{
        border: `1px solid ${borderColor}`,
        // v2 hover physics: -4px lift, deep two-layer shadow, 220ms with
        // a soft overshoot ease. Set rest shadow inline so :hover can override.
        boxShadow: "0 2px 12px rgba(28,24,20,0.06)",
        transition:
          "transform 220ms cubic-bezier(0.34,1.4,0.64,1), box-shadow 220ms cubic-bezier(0.34,1.4,0.64,1)",
      }}
      className={[
        "group relative flex flex-col rounded-[20px] bg-white h-full overflow-hidden",
        // Hover lift + deep shadow — matched 1:1 to v2 spec.
        "motion-safe:hover:-translate-y-1",
        "motion-safe:hover:shadow-[0_20px_60px_rgba(28,24,20,0.13),0_4px_16px_rgba(28,24,20,0.06)]",
      ].join(" ")}
    >
      {/* ── MEDIA — 190px full-bleed photo. DhabaPhoto handles skeleton,
          fade-in, and the gradient+utensil fallback. Card overflow-hidden
          + 20px radius gives the photo rounded top corners visually. */}
      <DhabaPhoto
        src={dhaba.imageUrl}
        alt=""
        className="w-full h-[190px] flex-none"
        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        hoverZoom
      />

      {/* ── CONTENT ── */}
      <div className="flex flex-col p-5 pt-4 min-h-[180px]">
      {/* 1. ROUTE — inline label, no pill chrome (v2). Distance pairs alongside. */}
      {dhaba.routeHint || distanceLabel ? (
        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
          {dhaba.routeHint ? (
            <span
              className="inline-flex items-center gap-1.5 leading-none font-semibold"
              style={{
                fontSize: "10.5px",
                color: "var(--accent)",
                letterSpacing: "0.06em",
                textTransform: "uppercase",
              }}
            >
              <span
                aria-hidden
                style={{
                  display: "inline-block",
                  width: 4,
                  height: 4,
                  borderRadius: "50%",
                  background: "var(--accent)",
                  flexShrink: 0,
                }}
              />
              {dhaba.routeHint}
            </span>
          ) : null}
          {distanceLabel ? (
            <span
              className="text-[11px] tabular-nums whitespace-nowrap"
              style={{ color: "#9a8a7a" }}
            >
              {distanceLabel}
            </span>
          ) : null}
        </div>
      ) : null}

      {/* 2. NAME — 20px Bricolage 700, overlay link spans the card surface. */}
      <h3
        className="min-w-0 font-display font-bold text-[20px] leading-[1.15] text-ink"
        style={{ letterSpacing: "-0.02em" }}
      >
        <Link
          href={`/dhabas/${dhaba.slug}`}
          className="after:absolute after:inset-0 after:rounded-[20px] after:content-[''] focus-visible:outline-none"
        >
          {dhaba.title}
        </Link>
      </h3>

      {/* 3. STATUS + TODAY'S HOURS — "Open now · 6:00 AM – 11:00 PM".
          Drivers want to know "is it open AND for how long" at a glance. */}
      {openStatus !== "unknown" ? (
        <div className="mt-2 flex items-center gap-1.5 leading-none flex-wrap">
          {openStatus === "open" ? (
            <span
              className="inline-flex items-center gap-1.5 font-bold"
              style={{ fontSize: "11.5px", color: "var(--leaf)" }}
            >
              <span
                aria-hidden
                className="rounded-full"
                style={{ width: 6, height: 6, background: "var(--leaf)" }}
              />
              Open now
            </span>
          ) : (
            <span
              className="inline-flex items-center gap-1.5 font-bold"
              style={{ fontSize: "11.5px", color: "#b04020" }}
            >
              <span
                aria-hidden
                className="rounded-full"
                style={{ width: 6, height: 6, background: "var(--accent)" }}
              />
              Closed
            </span>
          )}

          {todayHours ? (
            <span
              className="font-medium"
              style={{ fontSize: "11.5px", color: "#9a8a7a" }}
            >
              · {todayHours}
            </span>
          ) : null}
        </div>
      ) : null}

      {/* 4. AMENITIES — icon+label pairs, top 3 tags, gap 4px / 12px. */}
      {dhaba.tags.length > 0 ? (
        <ul
          className="mt-2.5 flex flex-wrap"
          style={{ rowGap: "4px", columnGap: "12px" }}
          role="list"
        >
          {dhaba.tags.slice(0, 3).map((t) => (
            <li
              key={t}
              className="inline-flex items-center gap-1 text-[11px]"
              style={{ color: "#9a8a7a" }}
            >
              <AmenityIcon tag={t} />
              <span className="truncate">{t}</span>
            </li>
          ))}
        </ul>
      ) : null}

      {/* 5. DESCRIPTION — 13px / 1.65 / 3-line clamp. Only rendered when
          a hand-written description exists. The previous fallback to
          DEFAULT_DHABA_DESCRIPTION (and the templated descriptions baked
          into data/dhabas.csv) read as AI-uniform across the home grid. */}
      {dhaba.description ? (
        <p
          className="mt-2.5 line-clamp-3"
          style={{ fontSize: "13px", lineHeight: 1.65, color: "#8a7a6a" }}
        >
          {dhaba.description}
        </p>
      ) : null}

      {/* 6. FOOTER — subtle hairline divider, "View details →" left, city right. */}
      <div
        className="mt-auto flex items-center justify-between gap-3"
        style={{
          borderTop: "1px solid rgba(28,24,20,0.07)",
          marginTop: "14px",
          paddingTop: "12px",
        }}
      >
        <span
          aria-hidden
          className="font-medium group-hover:text-accent transition inline-flex items-center gap-1"
          style={{ fontSize: "12px", color: "#9a8a7a" }}
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
          <span
            className="truncate"
            style={{ fontSize: "11px", color: "rgba(28,24,20,0.32)" }}
          >
            {city}
          </span>
        ) : null}
      </div>
      </div>
    </article>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────

// Today's hours, just the time portion (e.g. "6:00 AM – 11:00 PM" or
// "Open 24 hours"). Returns null if today's line is missing or marked Closed
// — the status indicator above already conveys "Closed" so we suppress the
// trailing time string in that case to keep the line uncluttered.
const HOURS_DAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];
function getTodayHoursString(hours: string[] | undefined): string | null {
  if (!hours || hours.length === 0) return null;
  const day = HOURS_DAYS[new Date().getDay()];
  const line = hours.find((h) => h.startsWith(day));
  if (!line) return null;
  const time = line.split(":").slice(1).join(":").trim();
  if (!time) return null;
  if (/closed/i.test(time)) return null;
  return time;
}

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
