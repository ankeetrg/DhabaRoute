// Footer — server component.
//
// Structure (top → bottom):
//   1. CTA band — accent background, "Know a spot we're missing?" + submit button
//   2. Lower footer — paper-soft background, logo/tagline, two nav columns,
//      bottom bar with copyright and "Free forever" note.
//
// No "use client" — the Telegram URL resolved in layout.tsx flows in via
// getDataMeta() + the existing pattern. The submit button is an <a> link,
// not a form, so no client JS needed.

import Link from "next/link";
import { getAllDhabas, getDataMeta } from "@/lib/dhabas";
import { parseRoute, highwaySlug, stateSlug } from "@/lib/parseRoute";
import { getTelegramUrl } from "@/lib/telegram";

export async function Footer() {
  const { count, generatedAt } = getDataMeta();
  const updated = new Date(generatedAt).toISOString().slice(0, 10);
  const telegramUrl = await getTelegramUrl();

  // Top 10 highways and states by dhaba count — drives the two browse
  // columns below. Same parser used by /routes/[highway] and /states/[state]
  // pages, so footer links + landing pages stay in sync automatically.
  const dhabas = getAllDhabas();
  const highwayCounts = new Map<string, number>();
  const stateCounts = new Map<string, number>();
  dhabas.forEach((d) => {
    const { highway, state } = parseRoute(d.routeHint);
    if (highway) {
      const slug = highwaySlug(highway);
      highwayCounts.set(slug, (highwayCounts.get(slug) ?? 0) + 1);
    }
    if (state) {
      const slug = stateSlug(state);
      stateCounts.set(slug, (stateCounts.get(slug) ?? 0) + 1);
    }
  });
  const topHighways = [...highwayCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([slug]) => slug);
  const topStates = [...stateCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([slug]) => slug);

  return (
    <footer>
      {/* ── 1. CTA BAND ──────────────────────────────────────────── */}
      <div
        className="px-8 py-12"
        style={{ background: "var(--accent)" }}
      >
        <div className="container-page flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <div className="max-w-[380px]">
            <h2
              className="font-display text-[22px] font-normal italic text-white leading-snug"
            >
              Know a spot we&apos;re missing?
            </h2>
            <p className="text-[14.5px] mt-1.5" style={{ color: "rgba(255,255,255,0.80)" }}>
              Help us map every dhaba worth stopping for.
            </p>
          </div>
          <Link
            href="/submit"
            className="inline-flex items-center justify-center h-12 px-7 rounded-xl font-ui font-bold text-[14.5px] bg-white transition-opacity duration-150 hover:opacity-[0.88] whitespace-nowrap flex-none"
            style={{ color: "var(--accent)" }}
          >
            Submit a dhaba
          </Link>
        </div>
      </div>

      {/* ── 2. LOWER FOOTER ──────────────────────────────────────── */}
      <div style={{ background: "var(--paper-soft)", borderTop: "1px solid var(--paper-warm)" }}>
        <div className="container-page py-11">
          <div className="flex flex-col sm:flex-row gap-10 sm:gap-16">
            {/* Logo + tagline */}
            <div className="max-w-[280px]">
              <div className="flex items-baseline gap-px font-display font-extrabold text-[18px] text-ink leading-none mb-2">
                <span>Dhaba</span>
                <span className="font-ui font-bold text-[16px]" style={{ color: "var(--accent)" }}>Route</span>
              </div>
              <p className="text-[13px] leading-relaxed" style={{ color: "var(--ink-muted)" }}>
                Authentic dhabas mapped across the US for drivers on the move.
              </p>
              {telegramUrl ? (
                <a
                  href={telegramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="dr-footer-link inline-flex items-center gap-1.5 text-[12.5px] mt-3"
                >
                  <TelegramIcon className="w-3.5 h-3.5 flex-none" />
                  Route updates on Telegram
                </a>
              ) : null}
            </div>

            {/* Nav columns */}
            <div className="flex gap-12 sm:gap-16 text-[13px]">
              <div>
                <p className="font-semibold text-[11px] uppercase tracking-widest mb-3" style={{ color: "var(--ink-muted)" }}>
                  Explore
                </p>
                <ul className="flex flex-col gap-2.5">
                  <li><Link href="/" className="dr-footer-link">All dhabas</Link></li>
                  <li><Link href="/what-is-a-dhaba" className="dr-footer-link">What is a dhaba?</Link></li>
                  <li><Link href="/submit" className="dr-footer-link">Submit a dhaba</Link></li>
                </ul>
              </div>
              <div>
                <p className="font-semibold text-[11px] uppercase tracking-widest mb-3" style={{ color: "var(--ink-muted)" }}>
                  Directory
                </p>
                <ul className="flex flex-col gap-2.5" style={{ color: "var(--ink-muted)" }}>
                  <li className="text-[12.5px]">{count} dhabas listed</li>
                  <li className="text-[12.5px]">28 states covered</li>
                  <li className="text-[12.5px]">Updated {updated}</li>
                </ul>
              </div>

              {/* Highways */}
              <div>
                <p className="font-semibold text-[11px] uppercase tracking-widest mb-3" style={{ color: "var(--ink-muted)" }}>
                  Highways
                </p>
                <ul className="flex flex-col gap-2.5">
                  {topHighways.map((h) => (
                    <li key={h}>
                      <Link href={`/routes/${h}`} className="dr-footer-link">
                        {h.toUpperCase()}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              {/* States */}
              <div>
                <p className="font-semibold text-[11px] uppercase tracking-widest mb-3" style={{ color: "var(--ink-muted)" }}>
                  States
                </p>
                <ul className="flex flex-col gap-2.5">
                  {topStates.map((s) => (
                    <li key={s}>
                      <Link href={`/states/${s}`} className="dr-footer-link">
                        {s.toUpperCase()}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div
          className="container-page py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1"
          style={{ borderTop: "1px solid var(--paper-warm)" }}
        >
          <p className="text-[12px]" style={{ color: "var(--ink-muted)" }}>
            &copy; {new Date().getFullYear()} DhabaRoute. Built for the road.
            {" · "}
            <Link href="/privacy" className="dr-footer-link">
              Privacy
            </Link>
          </p>
          <p className="text-[12px]" style={{ color: "var(--ink-muted)" }}>
            No tracking.
          </p>
        </div>
      </div>
    </footer>
  );
}

function TelegramIcon({ className }: { className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 16 16" fill="currentColor" className={className}>
      <path d="M14.43 2.2 1.64 7.12a.54.54 0 0 0 .03 1.02l3.27.98 1.27 3.94a.54.54 0 0 0 .9.22l1.77-1.7 3.27 2.4a.54.54 0 0 0 .85-.33l2.14-10.5a.54.54 0 0 0-.71-.63Zm-2.72 3.1L6.5 9.9l-.2 2.3-.92-2.84 6.33-4.06Z" />
    </svg>
  );
}
