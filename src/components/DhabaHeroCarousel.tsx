"use client";

import {
  useEffect,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
  type TouchEvent as ReactTouchEvent,
} from "react";
import { DhabaPhoto } from "./DhabaPhoto";
import { getOpenStatus } from "@/lib/isOpenNow";

// Detail-page hero as a one-photo-at-a-time carousel (2026-07 redesign).
// Today every dhaba has a single storedImageUrl, so the arrows/dots only
// render when a listing gains a photos[] array — the carousel activates
// automatically as community photos land, with zero dead UI before then.
//
// Sizing is deliberately compact, not full-bleed: mobile is h-[30vh]
// (clamped 160–280px) full width; desktop is h-[24vh] (clamped 230–280px)
// at md:w-3/5, beside the CTAs/facts/map column — sized to land close to
// that column's natural height (now that its map collapses into a ribbon)
// so there's little to no visible gap. The photo keeps this fixed size on
// both breakpoints — it is never stretched to fill the row; the caller
// centers it vertically within the (usually near-equal) row instead.

export interface HeroSlide {
  src: string;
  alt: string;
  attribution?: string;
}

interface DhabaHeroCarouselProps {
  slides: HeroSlide[];
  hours?: string[];
}

export function DhabaHeroCarousel({ slides, hours }: DhabaHeroCarouselProps) {
  const [index, setIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const status = getOpenStatus(hours);
  const count = slides.length;

  const go = (dir: number) => setIndex((i) => (i + dir + count) % count);

  const onTouchStart = (e: ReactTouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const onTouchEnd = (e: ReactTouchEvent) => {
    if (touchStartX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1);
    touchStartX.current = null;
  };

  // Lock page scroll while the lightbox is open, and let Escape close it.
  useEffect(() => {
    if (!lightboxOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightboxOpen(false);
      if (e.key === "ArrowLeft") go(-1);
      if (e.key === "ArrowRight") go(1);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lightboxOpen, count]);

  if (count === 0) return null;

  const current = slides[index];

  return (
    <>
    <figure
      className="relative overflow-hidden rounded-2xl w-full"
      onTouchStart={count > 1 ? onTouchStart : undefined}
      onTouchEnd={count > 1 ? onTouchEnd : undefined}
    >
      {/* Track — slides sit side by side; translateX moves the strip.
          Clicking/tapping the photo (not the arrow/dot controls, which are
          separate sibling elements) opens the full-size lightbox below. */}
      <div
        role="button"
        tabIndex={0}
        aria-label="View full-size photo"
        onClick={() => setLightboxOpen(true)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setLightboxOpen(true);
          }
        }}
        className="flex h-[30vh] min-h-[160px] max-h-[280px] md:h-[24vh] md:min-h-[230px] md:max-h-[280px] cursor-pointer motion-safe:transition-transform motion-safe:duration-300"
        style={{ transform: `translateX(-${index * 100}%)` }}
      >
        {slides.map((slide, i) => (
          <div key={`${slide.src}-${i}`} className="relative w-full h-full flex-none">
            <DhabaPhoto
              src={slide.src}
              alt={slide.alt}
              className="w-full h-full"
              sizes="(max-width: 767px) 100vw, 50vw"
              priority={i === 0}
            />
          </div>
        ))}
      </div>

      {/* Open / Closed badge — same treatment as the rest of the site. */}
      {status !== "unknown" ? (
        <span
          suppressHydrationWarning
          className="absolute top-3 right-3 text-white text-xs font-semibold px-3 py-1 rounded-full"
          style={{ background: status === "open" ? "#138808" : "#b94040" }}
        >
          {status === "open" ? "Open now" : "Closed"}
        </span>
      ) : null}

      {/* Photo attribution — bottom-left, only when we know who took it. */}
      {current.attribution ? (
        <span
          className="absolute bottom-3 left-3 text-[11px] font-medium text-white/95"
          style={{ textShadow: "0 1px 3px rgba(0,0,0,0.5)" }}
        >
          📷 {current.attribution}
        </span>
      ) : null}

      {count > 1 ? (
        <>
          <CarouselArrow side="left" onClick={() => go(-1)} />
          <CarouselArrow side="right" onClick={() => go(1)} />

          {/* Pagination dots — active dot stretches into a pill. */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
            {slides.map((_, i) => (
              <button
                key={i}
                type="button"
                aria-label={`Photo ${i + 1} of ${count}`}
                aria-current={i === index}
                onClick={() => setIndex(i)}
                className="h-[7px] rounded-full border-0 p-0 cursor-pointer motion-safe:transition-all motion-safe:duration-200"
                style={{
                  width: i === index ? 18 : 7,
                  background:
                    i === index ? "#fff" : "rgba(255,250,242,0.55)",
                }}
              />
            ))}
          </div>
        </>
      ) : null}
    </figure>

    {lightboxOpen ? (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/90"
        onClick={() => setLightboxOpen(false)}
        onTouchStart={count > 1 ? onTouchStart : undefined}
        onTouchEnd={count > 1 ? onTouchEnd : undefined}
        role="dialog"
        aria-modal="true"
        aria-label={`${current.alt} — full size photo`}
      >
        <button
          type="button"
          aria-label="Close photo"
          onClick={(e) => {
            e.stopPropagation();
            setLightboxOpen(false);
          }}
          className="absolute top-4 right-4 grid place-items-center w-10 h-10 rounded-full border-0 cursor-pointer hover:opacity-90"
          style={{ background: "rgba(255,255,255,0.12)", color: "#fff" }}
        >
          <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>

        {count > 1 ? (
          <span
            className="absolute top-5 left-1/2 -translate-x-1/2 text-white/90 text-sm font-medium"
            style={{ fontVariantNumeric: "tabular-nums" }}
          >
            {index + 1} / {count}
          </span>
        ) : null}

        <div
          className="relative w-full h-full max-w-5xl max-h-[85vh] mx-6"
          onClick={(e) => e.stopPropagation()}
        >
          <DhabaPhoto
            src={current.src}
            alt={current.alt}
            className="w-full h-full"
            sizes="100vw"
            objectFit="contain"
          />
        </div>

        {current.attribution ? (
          <span
            className="absolute bottom-5 left-1/2 -translate-x-1/2 text-[13px] font-medium text-white/90"
          >
            📷 {current.attribution}
          </span>
        ) : null}

        {count > 1 ? (
          <>
            <LightboxArrow
              side="left"
              onClick={(e) => {
                e.stopPropagation();
                go(-1);
              }}
            />
            <LightboxArrow
              side="right"
              onClick={(e) => {
                e.stopPropagation();
                go(1);
              }}
            />
          </>
        ) : null}
      </div>
    ) : null}
    </>
  );
}

function LightboxArrow({
  side,
  onClick,
}: {
  side: "left" | "right";
  onClick: (e: ReactMouseEvent) => void;
}) {
  return (
    <button
      type="button"
      aria-label={side === "left" ? "Previous photo" : "Next photo"}
      onClick={onClick}
      className="absolute top-1/2 -translate-y-1/2 grid place-items-center w-11 h-11 rounded-full border-0 cursor-pointer hover:opacity-90"
      style={{ [side]: 16, background: "rgba(255,255,255,0.14)", color: "#fff" }}
    >
      <svg
        viewBox="0 0 24 24"
        className="w-5 h-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {side === "left" ? <path d="M15 18l-6-6 6-6" /> : <path d="M9 6l6 6-6 6" />}
      </svg>
    </button>
  );
}

function CarouselArrow({
  side,
  onClick,
}: {
  side: "left" | "right";
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={side === "left" ? "Previous photo" : "Next photo"}
      onClick={onClick}
      className="absolute top-1/2 -translate-y-1/2 grid place-items-center w-9 h-9 rounded-full border-0 cursor-pointer hover:opacity-90"
      style={{
        [side]: 12,
        background: "rgba(250,248,243,0.92)",
        color: "#1c1814",
        boxShadow: "0 2px 8px rgba(0,0,0,0.18)",
      }}
    >
      <svg
        viewBox="0 0 24 24"
        className="w-4 h-4"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {side === "left" ? <path d="M15 18l-6-6 6-6" /> : <path d="M9 6l6 6-6 6" />}
      </svg>
    </button>
  );
}
