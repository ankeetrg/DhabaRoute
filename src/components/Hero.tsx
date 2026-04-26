import Link from "next/link";
import { HeroGeoButton } from "./HeroGeoButton";

// Editorial hero — gradient canvas + decorative pin cluster + road line.
//
// Design spec:
//   Background: linear-gradient(155deg, #faf8f3 0%, #f5ede0 55%, #eee4d4 100%)
//   Padding: 60px top, 52px bottom (horizontal via container-page)
//   Decorative pins: 5 teardrop shapes, top-right, 4–7% opacity
//   Road line: 2px gradient stripe at bottom, 0.12 opacity
//   H1: clamp(36px, 4.8vw, 62px), Bricolage Grotesque 800, -0.025em tracking
//   CTA: "Use my location" — handled by HeroGeoButton (client)
//   Stats: "{count} dhabas · 28 states · always free", 12px, 45% ink

interface HeroProps {
  count: number;
}

// Decorative pin cluster — tear-drop circles, no semantic value.
const PINS: Array<{
  size: number;
  top: string;
  right: string;
  opacity: number;
}> = [
  { size: 40, top: "12%",  right: "8%",  opacity: 0.05 },
  { size: 28, top: "38%",  right: "18%", opacity: 0.07 },
  { size: 22, top: "8%",   right: "22%", opacity: 0.04 },
  { size: 16, top: "52%",  right: "6%",  opacity: 0.06 },
  { size: 32, top: "25%",  right: "32%", opacity: 0.04 },
];

export function Hero({ count }: HeroProps) {
  return (
    <section
      className="relative overflow-hidden"
      style={{
        background:
          "linear-gradient(155deg, #faf8f3 0%, #f5ede0 55%, #eee4d4 100%)",
        paddingTop: 60,
        paddingBottom: 52,
      }}
    >
      {/* ── Decorative pin cluster (top-right quadrant) ─────────── */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
      >
        {PINS.map((p, i) => (
          <span
            key={i}
            className="absolute"
            style={{
              width: p.size,
              height: p.size * 1.25,
              top: p.top,
              right: p.right,
              borderRadius: "50% 50% 50% 0",
              transform: "rotate(-45deg)",
              background: "var(--accent)",
              opacity: p.opacity,
            }}
          />
        ))}
      </div>

      {/* ── Road line (bottom edge) ──────────────────────────────── */}
      <div
        aria-hidden
        className="absolute bottom-0 left-0 right-0"
        style={{
          height: 2,
          background:
            "linear-gradient(to right, transparent 0%, var(--accent) 25%, var(--accent) 75%, transparent 100%)",
          opacity: 0.12,
        }}
      />

      {/* ── Content ─────────────────────────────────────────────── */}
      <div className="container-page relative">
        <h1
          className="font-display font-extrabold leading-[1.1]"
          style={{
            fontSize: "clamp(36px, 4.8vw, 62px)",
            color: "#1c1814",
            letterSpacing: "-0.025em",
            maxWidth: 620,
          }}
        >
          Find real dhabas on your route.
        </h1>

        <p
          className="mt-4 font-ui leading-[1.65]"
          style={{
            fontSize: "16.5px",
            color: "#6a5a4a",
            maxWidth: 440,
          }}
        >
          Built for drivers who are hungry and on the move.
        </p>

        <div className="mt-7 flex items-center gap-5 flex-wrap">
          {/* Primary CTA — client component for geo access */}
          <HeroGeoButton />

          {/* Secondary link — arrow gap widens on hover */}
          <Link
            href="/what-is-a-dhaba"
            className="font-ui font-medium inline-flex items-center gap-[5px] motion-safe:transition-[gap] motion-safe:duration-150 motion-safe:hover:gap-[9px]"
            style={{ fontSize: "13.5px", color: "var(--accent)" }}
          >
            What is a dhaba?
            <span aria-hidden>→</span>
          </Link>
        </div>

        {/* Stats line */}
        <p
          className="mt-6 font-ui"
          style={{ fontSize: 12, color: "rgba(28,24,20,0.45)" }}
        >
          {count} dhabas · 28 states · always free
        </p>
      </div>
    </section>
  );
}
