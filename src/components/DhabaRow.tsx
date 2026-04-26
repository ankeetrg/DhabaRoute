// DhabaRow — server component.
//
// Design spec (Step 10):
//   Heading: 19px, font-ui 700, #1c1814
//   Accent underline: 48×2px, var(--accent), 999px radius, 0.5 opacity
//   Stop count: 12px, #c4b4a4, right-aligned beside heading
//   Subtitle: 13px, #9a8a7a
//   Grid: repeat(auto-fill, minmax(272px, 1fr)), gap 16px

import type { Dhaba } from "@/lib/types";
import { DhabaCard } from "./DhabaCard";

export function DhabaRow({
  title,
  subtitle,
  dhabas,
  emphasis = false,
}: {
  title: string;
  subtitle?: string;
  dhabas: Dhaba[];
  emphasis?: boolean;
}) {
  if (dhabas.length === 0) return null;

  return (
    <section className="container-page mt-10 sm:mt-14">
      {/* Row header — heading + count + accent underline + subtitle */}
      <div className="mb-6">
        <div className="flex items-start justify-between gap-4">
          <h2
            className="font-ui font-bold"
            style={{ fontSize: 19, color: "#1c1814" }}
          >
            {title}
          </h2>
          <p
            className="font-ui whitespace-nowrap pt-0.5"
            style={{ fontSize: 12, color: "#c4b4a4" }}
          >
            {dhabas.length} stop{dhabas.length !== 1 ? "s" : ""}
          </p>
        </div>

        {/* Accent underline */}
        <div
          aria-hidden
          style={{
            width: 48,
            height: 2,
            background: "var(--accent)",
            borderRadius: 999,
            opacity: 0.5,
            marginTop: 8,
          }}
        />

        {subtitle ? (
          <p
            className="mt-2 font-ui"
            style={{ fontSize: 13, color: "#9a8a7a" }}
          >
            {subtitle}
          </p>
        ) : null}
      </div>

      {/* Card grid */}
      <ul
        role="list"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(272px, 1fr))",
          gap: 16,
        }}
      >
        {dhabas.map((d) => (
          <li key={d.id}>
            <DhabaCard dhaba={d} emphasis={emphasis} />
          </li>
        ))}
      </ul>
    </section>
  );
}
