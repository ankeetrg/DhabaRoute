"use client";

// Header — client component because it needs a scroll listener for the
// opacity transition. The async Telegram URL fetch moved up to layout.tsx
// (server component) and is passed in as a prop.
//
// Design spec:
//   Height: 60px
//   Background: rgba(250,248,243,0.97) rest → rgba(250,248,243,0.90) on scroll
//   Backdrop: blur(14px)
//   Wordmark: "Dhaba" — Bricolage Grotesque 800 / "Route" — DM Sans 700 accent
//   Nav links: DM Sans 13.5px weight 500, var(--ink-muted) → var(--ink) on hover

import Link from "next/link";
import { useEffect, useState } from "react";

interface HeaderProps {
  telegramUrl?: string | null;
}

export function Header({ telegramUrl }: HeaderProps) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll(); // initialise in case page loads mid-scroll
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className="sticky top-0 z-30 border-b border-paper-warm"
      style={{
        background: scrolled
          ? "rgba(250,248,243,0.90)"
          : "rgba(250,248,243,0.97)",
        backdropFilter: "blur(14px)",
        WebkitBackdropFilter: "blur(14px)",
        transition: "background 200ms",
      }}
    >
      <div className="container-page flex items-center justify-between h-[60px]">
        {/* Wordmark */}
        <Link
          href="/"
          className="flex items-center gap-2 hover:opacity-80 motion-safe:transition-opacity duration-150"
          aria-label="DhabaRoute — home"
        >
          <LogoMark />
          <span className="flex items-baseline gap-px">
            <span className="font-display font-extrabold text-[19px] leading-none text-ink tracking-tight">
              Dhaba
            </span>
            <span
              className="font-ui font-bold text-[17px] leading-none"
              style={{ color: "var(--accent)" }}
            >
              Route
            </span>
          </span>
        </Link>

        {/* Nav — DM Sans 13.5px weight 500 */}
        <nav className="flex items-center gap-4 sm:gap-5 font-ui">
          <Link
            href="/what-is-a-dhaba"
            className="dr-nav-link text-[13.5px] font-medium whitespace-nowrap"
          >
            What is a Dhaba?
          </Link>

          {telegramUrl ? (
            <a
              href={telegramUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Join us on Telegram"
              className="dr-nav-link flex-none"
            >
              <TelegramIcon className="w-4 h-4" />
            </a>
          ) : null}

          <Link
            href="/submit"
            className="text-[13.5px] font-semibold whitespace-nowrap transition-opacity duration-150 hover:opacity-75"
            style={{ color: "var(--accent)" }}
          >
            + Submit
          </Link>
        </nav>
      </div>
    </header>
  );
}

// Saffron circle pin — unchanged from the original design.
function LogoMark() {
  return (
    <span
      aria-hidden
      className="inline-flex items-center justify-center w-7 h-7 rounded-full flex-none"
      style={{ background: "var(--accent)" }}
    >
      <svg viewBox="0 0 16 16" fill="white" className="w-3.5 h-3.5">
        <path d="M8 1a5 5 0 00-5 5c0 3.5 4.4 7.8 4.6 8a.6.6 0 00.8 0C8.6 13.8 13 9.5 13 6a5 5 0 00-5-5zm0 6.8A1.8 1.8 0 1110 6a1.8 1.8 0 01-2 1.8z" />
      </svg>
    </span>
  );
}

function TelegramIcon({ className }: { className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 16 16" fill="currentColor" className={className}>
      <path d="M14.43 2.2 1.64 7.12a.54.54 0 0 0 .03 1.02l3.27.98 1.27 3.94a.54.54 0 0 0 .9.22l1.77-1.7 3.27 2.4a.54.54 0 0 0 .85-.33l2.14-10.5a.54.54 0 0 0-.71-.63Zm-2.72 3.1L6.5 9.9l-.2 2.3-.92-2.84 6.33-4.06Z" />
    </svg>
  );
}
