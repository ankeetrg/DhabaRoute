"use client";

// Mobile-only hamburger + slide-in submenu, rendered by Header.tsx.
// Replaces having search/filters/list-view UI live on the home page itself
// on a phone screen — those now live on their own pages, reachable here.
//
// Pattern mirrors the existing full-size photo lightbox in
// DhabaHeroCarousel.tsx: body-scroll lock while open, Escape-key listener,
// backdrop click to dismiss. Trigger button is `sm:hidden` (desktop keeps
// its existing header nav and never renders this drawer's content).

import Link from "next/link";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

interface MenuLink {
  label: string;
  href: string;
}

const TOP_LINKS: MenuLink[] = [
  { label: "Search Dhabas", href: "/search" },
  { label: "All Dhabas", href: "/all-dhabas" },
  { label: "Submit a new Dhaba", href: "/submit" },
];

const OWNER_LINKS: MenuLink[] = [
  { label: "For owners", href: "/for-owners" },
  { label: "Claim your listing", href: "/claim" },
  { label: "Update listing", href: "/update-listing" },
];

export function MobileNavDrawer() {
  const [open, setOpen] = useState(false);
  const [ownersExpanded, setOwnersExpanded] = useState(false);

  // Body scroll lock while the drawer is open — same technique as the
  // detail-page photo lightbox.
  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  // Collapse the Owners sublist again each time the drawer closes so it
  // doesn't reopen mid-expanded next time.
  useEffect(() => {
    if (!open) setOwnersExpanded(false);
  }, [open]);

  const close = () => setOpen(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open menu"
        aria-expanded={open}
        className="sm:hidden -ml-2 flex h-11 w-11 flex-none items-center justify-center rounded-full text-ink hover:bg-paper-warm transition"
      >
        <svg aria-hidden viewBox="0 0 20 20" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
          <path d="M3 5.5h14M3 10h14M3 14.5h14" />
        </svg>
      </button>

      {open && typeof document !== "undefined"
        ? createPortal(
            // Portaled to <body> — this drawer is rendered from inside
            // Header.tsx, and Header's <header> element sets an inline
            // backdrop-filter, which per spec establishes a new containing
            // block for any `position: fixed` descendant. Without the
            // portal, this panel's `fixed inset-y-0` computed relative to
            // the 60px-tall header box instead of the viewport, collapsing
            // it to a 60px sliver instead of a full-height drawer.
            <div className="sm:hidden">
          {/* Backdrop */}
          <button
            type="button"
            aria-label="Close menu"
            onClick={close}
            className="fixed inset-0 z-40 bg-black/40"
          />

          {/* Panel */}
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Site menu"
            // bg-paper (not bg-white) — matches the site's actual warm
            // cream background (Header.tsx's own background is the same
            // token, just as a translucent rgba). Plain white read as
            // visibly off against the rest of the page.
            className="fixed inset-y-0 left-0 z-50 flex w-72 max-w-[85vw] flex-col bg-paper shadow-cardHover motion-safe:transition-transform motion-safe:duration-200"
          >
            <div className="flex items-center justify-between border-b border-paper-warm px-4 h-[60px] flex-none">
              <span className="font-logo font-extrabold text-[16px] text-ink">Menu</span>
              <button
                type="button"
                aria-label="Close menu"
                onClick={close}
                className="flex h-9 w-9 items-center justify-center rounded-full text-ink-muted hover:text-ink hover:bg-paper-soft transition"
              >
                <svg aria-hidden viewBox="0 0 12 12" className="w-3.5 h-3.5">
                  <path d="M1 1l10 10M11 1L1 11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none" />
                </svg>
              </button>
            </div>

            <nav className="flex-1 overflow-y-auto px-2 py-3">
              <ul role="list" className="flex flex-col gap-0.5">
                {TOP_LINKS.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      onClick={close}
                      className="block rounded-lg px-3 py-3 text-[15px] font-medium text-ink hover:bg-paper-soft transition"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}

                {/* Owners — expands in place to reveal the 3 existing
                    owner-facing pages, same links as the Footer's Owners
                    column. */}
                <li>
                  <button
                    type="button"
                    onClick={() => setOwnersExpanded((v) => !v)}
                    aria-expanded={ownersExpanded}
                    className="flex w-full items-center justify-between rounded-lg px-3 py-3 text-[15px] font-medium text-ink hover:bg-paper-soft transition"
                  >
                    Owners
                    <svg
                      aria-hidden
                      viewBox="0 0 10 6"
                      className={["w-2.5 h-2.5 transition-transform", ownersExpanded ? "rotate-180" : ""].join(" ")}
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M1 1l4 4 4-4" />
                    </svg>
                  </button>
                  {ownersExpanded ? (
                    <ul role="list" className="mt-0.5 flex flex-col gap-0.5 pl-3">
                      {OWNER_LINKS.map((link) => (
                        <li key={link.href}>
                          <Link
                            href={link.href}
                            onClick={close}
                            className="block rounded-lg px-3 py-2.5 text-[14px] text-ink-soft hover:bg-paper-soft hover:text-ink transition"
                          >
                            {link.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </li>
              </ul>
            </nav>
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
