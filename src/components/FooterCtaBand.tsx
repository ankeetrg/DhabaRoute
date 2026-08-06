"use client";

// Footer's top band — the site's "Submit a dhaba" CTA. Per explicit user
// request, this only stays a CTA on the home page ("/"); every other
// page's footer shows an ad placeholder instead. Split out of the
// otherwise-server Footer.tsx because usePathname() needs a client
// component.

import Link from "next/link";
import { usePathname } from "next/navigation";

export function FooterCtaBand() {
  const pathname = usePathname();
  const isHome = pathname === "/";

  if (!isHome) {
    return (
      <div
        className="px-5 sm:px-8 py-12"
        style={{ background: "var(--paper-soft)", borderBottom: "1px solid var(--paper-warm)" }}
      >
        <div
          aria-hidden
          className="container-page flex h-20 items-center justify-center rounded-xl border border-dashed"
          style={{ borderColor: "var(--paper-warm)" }}
        >
          <span
            className="text-[11px] font-medium uppercase"
            style={{ color: "var(--ink-muted)", letterSpacing: "0.08em" }}
          >
            Ad space
          </span>
        </div>
      </div>
    );
  }

  return (
    <div
      className="px-0 sm:px-8 py-12"
      style={{ background: "var(--accent)" }}
    >
      <div className="container-page flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
        <div className="max-w-[380px]">
          <h2 className="font-display text-[22px] font-normal italic text-white leading-snug">
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
  );
}
