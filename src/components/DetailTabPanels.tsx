"use client";

import { useRef, useState, type ReactNode } from "react";

// Mobile tab bar for the dhaba detail page (2026-07 redesign, v2).
//
// v1 had tabs act as scroll anchors — tapping "Amenities" scrolled the
// whole page down past Overview to reach it, which read as the page
// jumping around. v2 makes Overview / Amenities / Menu / Details real
// tab panels: only one is visible at a time, swapped in place directly
// under the sticky tab bar, so tapping a tab never moves the page past
// unrelated content.
//
// "Nearby" is deliberately NOT a panel — the next-stops section lives
// further down the page, outside this component, as a normal long-scroll
// destination. Tapping it keeps the old jump-to-section behavior.
//
// On desktop (md+) there is no tab UI at all (the sidebar covers Details;
// Overview/Amenities/Menu just stack as plain content) — panels marked
// desktopAlwaysVisible render regardless of activeId once md+ kicks in.

export interface DetailPanel {
  id: string;
  label: string;
  content: ReactNode;
  /** Whether this panel keeps showing at md+ regardless of which mobile
   * tab is active. False for panels (like Details) that have a separate
   * always-visible desktop counterpart elsewhere (the sidebar). */
  desktopAlwaysVisible: boolean;
}

interface DetailTabPanelsProps {
  panels: DetailPanel[];
  /** Trailing tab that scrolls to a section living outside this component
   * instead of switching panels — e.g. "Nearby" at the bottom of the page. */
  jumpTab?: { label: string; targetId: string };
}

const HEADER_H = 60;

export function DetailTabPanels({ panels, jumpTab }: DetailTabPanelsProps) {
  const [activeId, setActiveId] = useState(panels[0]?.id ?? "");
  const barRef = useRef<HTMLDivElement | null>(null);

  if (panels.length === 0) return null;

  const onPanelTabClick = (id: string) => {
    setActiveId(id);
    barRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const onJumpTabClick = () => {
    if (!jumpTab) return;
    document
      .getElementById(jumpTab.targetId)
      ?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <>
      <nav
        ref={barRef}
        aria-label="Page sections"
        className="md:hidden sticky z-20 -mx-5 px-5 sm:-mx-8 sm:px-8 flex gap-6 overflow-x-auto no-scrollbar border-b"
        style={{
          top: HEADER_H,
          scrollMarginTop: HEADER_H,
          background: "rgba(250,248,243,0.95)",
          backdropFilter: "blur(10px)",
          WebkitBackdropFilter: "blur(10px)",
          borderColor: "#e4d8c6",
        }}
      >
        {panels.map((panel) => (
          <TabButton
            key={panel.id}
            active={panel.id === activeId}
            onClick={() => onPanelTabClick(panel.id)}
          >
            {panel.label}
          </TabButton>
        ))}
        {jumpTab ? (
          <TabButton active={false} onClick={onJumpTabClick}>
            {jumpTab.label}
          </TabButton>
        ) : null}
      </nav>

      {panels.map((panel) => {
        const isActive = panel.id === activeId;
        const className = isActive
          ? panel.desktopAlwaysVisible
            ? "block"
            : "block md:hidden"
          : panel.desktopAlwaysVisible
            ? "hidden md:block"
            : "hidden";
        return (
          <div key={panel.id} className={className}>
            {panel.content}
          </div>
        );
      })}
    </>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="relative flex-none border-0 bg-transparent cursor-pointer font-ui font-semibold py-2.5"
      style={{ fontSize: 14, color: active ? "#1c1814" : "#8a7a6a" }}
    >
      {children}
      {active ? (
        <span
          aria-hidden
          className="absolute left-0 right-0 -bottom-px h-[3px] rounded-t-[3px]"
          style={{ background: "var(--accent)" }}
        />
      ) : null}
    </button>
  );
}
