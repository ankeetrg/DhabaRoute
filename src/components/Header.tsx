import Link from "next/link";

export function Header() {
  return (
    <header className="sticky top-0 z-30 bg-paper/90 backdrop-blur-md border-b border-paper-warm">
      <div className="container-page flex items-center justify-between h-14">
        <Link
          href="/"
          className="flex items-center gap-2 text-[15px] font-semibold tracking-tight text-ink hover:opacity-80 transition"
          aria-label="DhabaRoute — home"
        >
          <LogoMark />
          <span>
            Dhaba<span className="text-clay-500">Route</span>
          </span>
        </Link>
        {/* Right-side nav: an editorial link + the submit CTA. Kept on one
            row and tight so the header stays quiet on mobile. The essay
            link is the secondary item (neutral ink), submit is primary
            (clay). */}
        <nav className="flex items-center gap-4 sm:gap-5">
          <Link
            href="/what-is-a-dhaba"
            className="text-[13px] font-medium text-ink-soft hover:text-ink transition whitespace-nowrap"
          >
            What is a Dhaba?
          </Link>
          <Link
            href="/submit"
            className="text-[13px] font-medium text-clay-600 hover:text-clay-700 transition whitespace-nowrap"
          >
            + Submit
          </Link>
        </nav>
      </div>
    </header>
  );
}

// Simple teardrop mark in saffron — acts as the sole branding element on a
// deliberately quiet header.
function LogoMark() {
  return (
    <span
      aria-hidden
      className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-clay-500 text-paper flex-none"
    >
      <svg viewBox="0 0 16 16" fill="currentColor" className="w-3 h-3">
        <path d="M8 1a5 5 0 00-5 5c0 3.5 4.4 7.8 4.6 8a.6.6 0 00.8 0C8.6 13.8 13 9.5 13 6a5 5 0 00-5-5zm0 6.8A1.8 1.8 0 1110 6a1.8 1.8 0 01-2 1.8z" />
      </svg>
    </span>
  );
}
