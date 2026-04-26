"use client";

// Client component — just the "Use my location" CTA button.
// Triggers browser geolocation and scrolls to the listing/map section.

import { useState } from "react";

export function HeroGeoButton() {
  const [pending, setPending] = useState(false);

  function handleClick() {
    if (!navigator.geolocation) {
      scrollToContent();
      return;
    }
    setPending(true);
    navigator.geolocation.getCurrentPosition(
      () => { setPending(false); scrollToContent(); },
      () => { setPending(false); scrollToContent(); }
    );
  }

  return (
    <button
      onClick={handleClick}
      disabled={pending}
      className="inline-flex items-center gap-2 font-bold text-white transition-opacity duration-150 hover:opacity-[0.82] disabled:opacity-60 font-ui"
      style={{
        fontSize: "14.5px",
        height: 48,
        padding: "0 26px",
        borderRadius: 12,
        background: "var(--accent)",
      }}
    >
      <PinIcon />
      {pending ? "Locating…" : "Use my location"}
    </button>
  );
}

function scrollToContent() {
  document.getElementById("main")?.scrollIntoView({ behavior: "smooth" });
}

function PinIcon() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 14 14"
      width="14"
      height="14"
      fill="currentColor"
      className="flex-none"
    >
      <path d="M7 1a4 4 0 00-4 4c0 3 3.5 6.6 3.65 6.75a.5.5 0 00.7 0C7.5 11.6 11 8 11 5a4 4 0 00-4-4zm0 5.5a1.5 1.5 0 110-3 1.5 1.5 0 010 3z" />
    </svg>
  );
}
