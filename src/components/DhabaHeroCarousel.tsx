"use client";

import { useRef, useState, type TouchEvent as ReactTouchEvent } from "react";
import { DhabaPhoto } from "./DhabaPhoto";
import { getOpenStatus } from "@/lib/isOpenNow";

// Detail-page hero as a one-photo-at-a-time carousel (2026-07 redesign).
// Today every dhaba has a single storedImageUrl, so the arrows/dots only
// render when a listing gains a photos[] array — the carousel activates
// automatically as community photos land, with zero dead UI before then.

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
  const touchStartX = useRef<number | null>(null);
  const status = getOpenStatus(hours);
  const count = slides.length;

  if (count === 0) return null;

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

  const current = slides[index];

  return (
    <figure
      className="mt-4 relative overflow-hidden rounded-2xl"
      onTouchStart={count > 1 ? onTouchStart : undefined}
      onTouchEnd={count > 1 ? onTouchEnd : undefined}
    >
      {/* Track — slides sit side by side; translateX moves the strip. */}
      <div
        className="flex h-[260px] md:h-[400px] motion-safe:transition-transform motion-safe:duration-300"
        style={{ transform: `translateX(-${index * 100}%)` }}
      >
        {slides.map((slide, i) => (
          <div key={`${slide.src}-${i}`} className="relative w-full h-full flex-none">
            <DhabaPhoto
              src={slide.src}
              alt={slide.alt}
              className="w-full h-full"
              sizes="(max-width: 640px) 100vw, (max-width: 1200px) calc(100vw - 64px), 1136px"
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
