"use client";

import { useEffect, useState } from "react";

// Sticky in-page tab bar for the dhaba detail page (2026-07 redesign).
// Tabs are scroll anchors, not view switchers — one server-rendered page,
// one scroll. Active tab tracks the viewport via IntersectionObserver.
// Mobile-only by the caller (md:hidden): desktop keeps the sticky sidebar
// and doesn't need a second navigation layer.

export interface DetailTab {
  id: string;
  label: string;
}

// Header is sticky at 60px; the tab bar sits directly under it. Sections
// use scroll-margin-top ≈ header + tab bar so anchored scrolls land clear.
const HEADER_H = 60;

export function DetailTabs({ tabs }: { tabs: DetailTab[] }) {
  const [active, setActive] = useState(tabs[0]?.id ?? "");

  useEffect(() => {
    const sections = tabs
      .map((t) => document.getElementById(t.id))
      .filter((el): el is HTMLElement => el !== null);
    if (sections.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        // Prefer the topmost section currently intersecting the band just
        // below the sticky bars.
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: `-${HEADER_H + 56}px 0px -55% 0px` },
    );
    sections.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [tabs]);

  const onTabClick = (id: string) => {
    setActive(id);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  if (tabs.length < 2) return null;

  return (
    <nav
      aria-label="Page sections"
      className="sticky z-20 -mx-5 px-5 sm:-mx-8 sm:px-8 mt-5 flex gap-6 overflow-x-auto no-scrollbar border-b"
      style={{
        top: HEADER_H,
        background: "rgba(250,248,243,0.95)",
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
        borderColor: "#e4d8c6",
      }}
    >
      {tabs.map((tab) => {
        const isActive = tab.id === active;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onTabClick(tab.id)}
            className="relative flex-none border-0 bg-transparent cursor-pointer font-ui font-semibold py-2.5"
            style={{
              fontSize: 14,
              color: isActive ? "#1c1814" : "#8a7a6a",
            }}
          >
            {tab.label}
            {isActive ? (
              <span
                aria-hidden
                className="absolute left-0 right-0 -bottom-px h-[3px] rounded-t-[3px]"
                style={{ background: "var(--accent)" }}
              />
            ) : null}
          </button>
        );
      })}
    </nav>
  );
}
