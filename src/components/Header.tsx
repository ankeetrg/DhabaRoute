import Link from "next/link";
import { getTelegramUrl } from "@/lib/telegram";

export async function Header() {
  // Resolved at build/request time via a cached fetch to Telegram's getMe.
  // Null when the bot token is missing or the call fails — we then skip
  // rendering the Telegram nav entry entirely.
  const telegramUrl = await getTelegramUrl();

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
        {/* Right-side nav: an editorial link, an optional Telegram link, and
            the submit CTA. Kept on one row and tight so the header stays quiet
            on mobile. The essay link is secondary (neutral ink); the Telegram
            icon is even quieter (icon only, ink-muted); submit is primary (clay). */}
        <nav className="flex items-center gap-4 sm:gap-5">
          <Link
            href="/what-is-a-dhaba"
            className="text-[13px] font-medium text-ink-soft hover:text-ink transition whitespace-nowrap"
          >
            What is a Dhaba?
          </Link>
          {telegramUrl ? (
            <a
              href={telegramUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Join us on Telegram"
              className="text-ink-soft hover:text-ink transition flex-none"
            >
              <TelegramIcon className="w-4 h-4" />
            </a>
          ) : null}
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

// Paper-plane glyph — the standard Telegram mark, simplified for a 16px
// footprint. currentColor stroke/fill so it inherits the surrounding link tone.
function TelegramIcon({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 16 16"
      fill="currentColor"
      className={className}
    >
      <path d="M14.43 2.2 1.64 7.12a.54.54 0 0 0 .03 1.02l3.27.98 1.27 3.94a.54.54 0 0 0 .9.22l1.77-1.7 3.27 2.4a.54.54 0 0 0 .85-.33l2.14-10.5a.54.54 0 0 0-.71-.63Zm-2.72 3.1L6.5 9.9l-.2 2.3-.92-2.84 6.33-4.06Z" />
    </svg>
  );
}
