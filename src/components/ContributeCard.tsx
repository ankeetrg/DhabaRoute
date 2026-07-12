"use client";

import { useState, type ReactNode } from "react";
import { ContributeForm } from "./ContributeForm";

// Compact contribution card (2026-07 redesign). The full upload form was
// heavy mid-page; this collapses it to one warm dashed card with three
// one-tap intents that expand the existing ContributeForm in place —
// lower friction, same Formspree pipeline underneath.

export function ContributeCard({
  dhabaTitle,
  dhabaSlug,
  contributed,
}: {
  dhabaTitle: string;
  dhabaSlug: string;
  contributed: boolean;
}) {
  const [expanded, setExpanded] = useState(false);

  if (contributed) {
    return (
      <p
        className="mt-4 rounded-xl px-4 py-3 text-[14px] font-ui"
        style={{
          background: "#f0f7f0",
          color: "#1a6b47",
          border: "1px solid rgba(26,107,71,0.20)",
        }}
      >
        Thanks for contributing — we&rsquo;ll add it to the listing soon.
      </p>
    );
  }

  return (
    <div
      className="mt-4 rounded-[14px] p-4"
      style={{
        border: "1.5px dashed rgba(223,96,40,0.45)",
        background: "rgba(223,96,40,0.06)",
      }}
    >
      <p className="font-ui font-bold" style={{ fontSize: 14.5, color: "#1c1814" }}>
        Been here? Help the next driver.
      </p>
      <p className="mt-1 font-ui" style={{ fontSize: 13, color: "#3c3128" }}>
        Snap the menu board or the parking lot — takes 20 seconds, helps
        hundreds.
      </p>

      {!expanded ? (
        <div className="mt-3">
          <IntentButton solid onClick={() => setExpanded(true)}>
            Add Photo / Menu / Note
          </IntentButton>
        </div>
      ) : (
        <div className="mt-3">
          <button
            type="button"
            onClick={() => setExpanded(false)}
            className="inline-flex items-center gap-1 font-ui font-semibold cursor-pointer transition-opacity duration-150 hover:opacity-70"
            style={{ fontSize: 12.5, color: "#8a7a6a" }}
          >
            <CloseIcon />
            Close
          </button>
          <ContributeForm dhabaTitle={dhabaTitle} dhabaSlug={dhabaSlug} />
        </div>
      )}
    </div>
  );
}

function CloseIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="w-3.5 h-3.5 flex-none"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M18 6L6 18M6 6l12 12" />
    </svg>
  );
}

function IntentButton({
  solid = false,
  onClick,
  children,
}: {
  solid?: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-full font-ui font-bold cursor-pointer transition-opacity duration-150 hover:opacity-85"
      style={{
        fontSize: 12.5,
        padding: "8px 14px",
        border: solid ? "none" : "1px solid #e4d8c6",
        background: solid ? "var(--accent)" : "#ffffff",
        color: solid ? "#ffffff" : "#1c1814",
      }}
    >
      {children}
    </button>
  );
}
