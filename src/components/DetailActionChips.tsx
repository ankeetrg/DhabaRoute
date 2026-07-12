"use client";

import Link from "next/link";
import { useState, type CSSProperties, type ReactNode } from "react";

// Horizontal action-chip row for the dhaba detail page (2026-07 redesign).
// Every chip does something real today:
//   What's good here?  → scrolls to the #menu section (only when dishes exist)
//   Directions / Call  → external maps link / tel:
//   Share              → navigator.share, clipboard fallback
//   Report an update   → /update-listing (staleness is the #1 data problem)

interface DetailActionChipsProps {
  mapsUrl?: string;
  phone?: string;
  phoneHref?: string | null;
  hasMenuSection: boolean;
  shareTitle: string;
  shareUrl: string;
}

export function DetailActionChips({
  mapsUrl,
  phone,
  phoneHref,
  hasMenuSection,
  shareTitle,
  shareUrl,
}: DetailActionChipsProps) {
  const [copied, setCopied] = useState(false);

  const onShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({ title: shareTitle, url: shareUrl });
        return;
      }
    } catch {
      return; // user dismissed the share sheet
    }
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard unavailable — nothing sensible to do
    }
  };

  const scrollToMenu = () => {
    document.getElementById("menu")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="mt-4 flex gap-2 overflow-x-auto no-scrollbar -mx-5 px-5 sm:mx-0 sm:px-0 sm:flex-wrap">
      {hasMenuSection ? (
        <ChipButton onClick={scrollToMenu} accent>
          <SparkleIcon />
          What&rsquo;s good here?
        </ChipButton>
      ) : null}

      {mapsUrl ? (
        <ChipLink href={mapsUrl} external>
          <MapIcon />
          Directions
        </ChipLink>
      ) : null}

      {phone && phoneHref ? (
        <ChipLink href={phoneHref}>
          <PhoneIcon />
          Call
        </ChipLink>
      ) : null}

      <ChipButton onClick={onShare}>
        <ShareIcon />
        {copied ? "Link copied" : "Share"}
      </ChipButton>

      <Link href="/update-listing" className={chipClass(false)} style={chipStyle(false)}>
        <FlagIcon />
        Report an update
      </Link>
    </div>
  );
}

// ── Chip primitives ────────────────────────────────────────────────────────

function chipClass(accent: boolean) {
  return [
    "inline-flex flex-none items-center gap-1.5 whitespace-nowrap cursor-pointer",
    "rounded-full font-ui font-semibold transition-colors duration-150",
    accent ? "" : "hover:border-clay-300",
  ].join(" ");
}

function chipStyle(accent: boolean): CSSProperties {
  return {
    fontSize: 13,
    padding: "9px 14px",
    border: accent
      ? "1px solid rgba(223,96,40,0.35)"
      : "1px solid #e4d8c6",
    background: accent ? "rgba(223,96,40,0.10)" : "#ffffff",
    color: accent ? "var(--accent)" : "#3c3128",
  };
}

function ChipButton({
  onClick,
  accent = false,
  children,
}: {
  onClick: () => void;
  accent?: boolean;
  children: ReactNode;
}) {
  return (
    <button type="button" onClick={onClick} className={chipClass(accent)} style={chipStyle(accent)}>
      {children}
    </button>
  );
}

function ChipLink({
  href,
  external = false,
  children,
}: {
  href: string;
  external?: boolean;
  children: ReactNode;
}) {
  return (
    <a
      href={href}
      target={external ? "_blank" : undefined}
      rel={external ? "noopener noreferrer" : undefined}
      className={chipClass(false)}
      style={chipStyle(false)}
    >
      {children}
    </a>
  );
}

// ── Icons — 15px stroke glyphs matching the chip text weight ──────────────

function iconProps() {
  return {
    viewBox: "0 0 24 24",
    className: "w-[15px] h-[15px] flex-none",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
}

function SparkleIcon() {
  return (
    <svg {...iconProps()} fill="currentColor" stroke="none">
      <path d="M12 2l1.8 5.2L19 9l-5.2 1.8L12 16l-1.8-5.2L5 9l5.2-1.8zM19 15l.9 2.6 2.6.9-2.6.9L19 22l-.9-2.6-2.6-.9 2.6-.9z" />
    </svg>
  );
}

function MapIcon() {
  return (
    <svg {...iconProps()}>
      <path d="M9 20l-5.5-2.5v-13L9 7l6-2.5L20.5 7v13L15 17.5z" />
      <path d="M9 7v13M15 4.5v13" />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg {...iconProps()}>
      <path d="M22 16.9v3a2 2 0 0 1-2.2 2A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 2 .7 2.9a2 2 0 0 1-.5 2.1L8.1 10a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.5c.9.3 1.9.6 2.9.7a2 2 0 0 1 1.6 2z" />
    </svg>
  );
}

function ShareIcon() {
  return (
    <svg {...iconProps()}>
      <path d="M4 12v7a1.5 1.5 0 0 0 1.5 1.5h13A1.5 1.5 0 0 0 20 19v-7M16 6l-4-4-4 4M12 2v13" />
    </svg>
  );
}

function FlagIcon() {
  return (
    <svg {...iconProps()}>
      <path d="M4 21V4a1 1 0 0 1 1-1h9l1 2h5v10h-6l-1-2H6" />
    </svg>
  );
}
