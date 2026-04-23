"use client";

// DhabaPhoto — the one place in the app that actually renders a dhaba's
// image. Owns three visual states so callers don't have to reimplement
// them every time they show a photo:
//
//   1. loading   — pulsing paper-soft skeleton while the bytes arrive
//   2. loaded    — image fades in (200ms) under the skeleton
//   3. missing   — warm gradient (#F5EDE3 → #EDD9C0) with a small
//                  fork-and-knife glyph. Triggered when src is nullish
//                  *or* the browser fires onError.
//
// Giant letter-initial placeholders were removed intentionally. On a page
// with dozens of cards they read as typography noise; a small, repeated
// utensil glyph inside a consistent warm swatch lets the eye rest.
//
// Caller surfaces:
//   • DhabaCard thumbnail — hoverZoom opt-in, `group` is on the card, so
//     the image scales when the whole card is hovered.
//   • Detail page hero — priority + larger sizes, no hover zoom.
//   • Leaflet popup — raw=true to render a plain <img> because the popup
//     is detached from the React tree; next/image's wrapper divs don't
//     survive that.
//
// Tailwind notes:
//   • `motion-safe:` gates every transform so prefers-reduced-motion
//     users get a still image.
//   • Hover zoom needs `overflow-hidden` on an ancestor (DhabaCard has
//     it) and `group-hover:scale-[1.03]` on the <img>. We include both
//     here so the component keeps working if a caller forgets.

import Image from "next/image";
import { useState } from "react";

interface DhabaPhotoProps {
  src?: string | null;
  alt: string;
  /** Sizing classes for the wrapper, e.g. "h-40 sm:h-44 w-full". */
  className?: string;
  /** Passed to next/image for responsive serving. Ignored when raw=true. */
  sizes?: string;
  /** Mark this image as LCP-critical (detail-page hero). */
  priority?: boolean;
  /**
   * Use a plain <img> instead of next/image. Required inside Leaflet
   * popups, which render outside React's tree and break next/image's
   * fill-parent wrapper.
   */
  raw?: boolean;
  /** Opt-in to the card-hover zoom. Needs a `group` ancestor. */
  hoverZoom?: boolean;
}

export function DhabaPhoto({
  src,
  alt,
  className = "",
  sizes,
  priority = false,
  raw = false,
  hoverZoom = false,
}: DhabaPhotoProps) {
  const [loaded, setLoaded] = useState(false);
  const [errored, setErrored] = useState(false);

  const missing = !src || errored;

  // Wrapper holds the aspect/height + clips the zoom. Callers control
  // dimensions via className; we only add positioning + overflow.
  const wrapperClass = [
    "relative overflow-hidden bg-paper-soft",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  if (missing) {
    return (
      <div className={wrapperClass}>
        <FallbackGlyph />
      </div>
    );
  }

  const imageClass = [
    "object-cover transition-opacity duration-200",
    loaded ? "opacity-100" : "opacity-0",
    hoverZoom
      ? "motion-safe:transition-transform motion-safe:duration-300 motion-safe:ease-out group-hover:scale-[1.03]"
      : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={wrapperClass}>
      {/* Skeleton sits under the image; the image fades in over it on load. */}
      {!loaded ? (
        <div
          aria-hidden
          className="absolute inset-0 bg-paper-soft animate-pulse"
        />
      ) : null}

      {raw ? (
        // Leaflet popups render outside the React tree, so next/image's
        // fill-parent wrapper doesn't compose with them. Use a plain <img>
        // absolutely-positioned to fill the wrapper.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src as string}
          alt={alt}
          loading="lazy"
          decoding="async"
          onLoad={() => setLoaded(true)}
          onError={() => setErrored(true)}
          className={`absolute inset-0 w-full h-full ${imageClass}`}
        />
      ) : (
        <Image
          src={src as string}
          alt={alt}
          fill
          // Google's lh3.googleusercontent.com URLs already include width
          // params; Next's optimiser only adds a hop. Let the browser
          // fetch directly.
          unoptimized
          sizes={sizes}
          priority={priority}
          loading={priority ? undefined : "lazy"}
          onLoad={() => setLoaded(true)}
          onError={() => setErrored(true)}
          className={imageClass}
        />
      )}
    </div>
  );
}

// Warm-gradient fallback with a small centered fork-and-knife. Sized at
// 20% of the shorter axis via fixed px so it reads the same on a card
// thumbnail as on a detail hero.
function FallbackGlyph() {
  return (
    <div
      aria-hidden
      className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[#F5EDE3] to-[#EDD9C0]"
    >
      <svg
        viewBox="0 0 24 24"
        className="w-8 h-8 text-clay-500/60"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {/* Fork — three tines merging into a stem. */}
        <path d="M8 3v5" />
        <path d="M10.5 3v5" />
        <path d="M13 3v5" />
        <path d="M10.5 8v13" />
        {/* Knife — a teardrop blade atop a straight handle. */}
        <path d="M17 3c-1.5 2-1.5 7 0 9h2V3z" />
        <path d="M17 12v9" />
      </svg>
    </div>
  );
}
