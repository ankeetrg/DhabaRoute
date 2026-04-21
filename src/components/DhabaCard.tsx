import Link from "next/link";
import type { Dhaba } from "@/lib/types";
import { DEFAULT_DHABA_DESCRIPTION } from "@/lib/types";
import { Tag } from "./Tag";

// Scanning order for a driver at a glance:
// 1. Name — strongest type
// 2. Route hint + distance — one subtle metadata row
// 3. Description (when present) — 2-line clamp
// 4. Tags — pill chips
// 5. Open in Maps — saffron CTA, full width

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
  return (
    <article
      onMouseEnter={onActivate}
      onFocus={onActivate}
      data-selected={isSelected || undefined}
      className={[
        "group relative flex flex-col rounded-2xl bg-white p-4 sm:p-5 h-full",
        "border transition-[border-color,box-shadow,transform] duration-150",
        "shadow-card hover:shadow-cardHover",
        isSelected
          ? "border-clay-500 ring-1 ring-clay-500/30"
          : emphasis
          ? "border-clay-200"
          : "border-paper-warm hover:border-clay-200",
      ].join(" ")}
    >
      {/* Metadata row FIRST — quiet uppercase micro-label above the title,
          the same treatment the map preview uses. Keeps scanning consistent
          between list + pin preview. */}
      {(dhaba.routeHint || distanceLabel) ? (
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

      {/* Title — dominant but tight, a visual anchor for 2-second scanning */}
      <h3
        className={[
          "min-w-0 text-[15px] sm:text-[15.5px] font-semibold leading-[1.3] text-ink",
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

      {/* Tags — right below title so amenities are discoverable before the
          description (which is optional colour). Capped at 3 for compactness. */}
      {dhaba.tags.length > 0 ? (
        <ul className="mt-2.5 flex flex-wrap gap-1.5" role="list">
          {dhaba.tags.slice(0, 3).map((t) => (
            <li key={t}>
              <Tag label={t} />
            </li>
          ))}
        </ul>
      ) : null}

      {/* Description — supportive only. Muted, 2-line clamp, leading tight.
          Always rendered (with a shared fallback) so every card carries the
          same scanning hierarchy — no gaps that feel "half-filled". */}
      <p className="mt-2.5 text-[12.5px] leading-snug text-ink-muted line-clamp-2">
        {dhaba.description ?? DEFAULT_DHABA_DESCRIPTION}
      </p>

      {/* Maps CTA — saffron primary, the single strongest action on the card.
          relative z-10 keeps it above the card's invisible link overlay. */}
      {dhaba.mapsUrl ? (
        <div className="mt-auto pt-4 relative z-10">
          <a
            href={dhaba.mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={[
              "flex w-full items-center justify-center gap-1.5 h-11 rounded-xl",
              "bg-clay-500 text-white text-[13px] font-semibold",
              "shadow-cta hover:bg-clay-600 active:scale-[0.99] transition",
            ].join(" ")}
          >
            Get Directions
            <svg aria-hidden viewBox="0 0 12 12" className="w-3 h-3 flex-none opacity-90">
              <path d="M3 1h8v8M11 1L1 11" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            </svg>
          </a>
        </div>
      ) : null}
    </article>
  );
}
