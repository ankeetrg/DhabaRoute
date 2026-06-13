/**
 * Homepage OG image — generated via next/og at build time.
 * Renders a 1200×630 card with DhabaRoute branding and tagline.
 * Served at /opengraph-image (auto-picked up by Next.js metadata).
 */

import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "DhabaRoute — Authentic dhabas on your route";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "flex-end",
          padding: "64px 72px",
          background: "#1c1814",
          position: "relative",
        }}
      >
        {/* Warm gradient overlay */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(ellipse at 80% 20%, rgba(223,96,40,0.28) 0%, transparent 60%)",
          }}
        />

        {/* Route line decoration */}
        <div
          style={{
            position: "absolute",
            top: 48,
            right: 72,
            display: "flex",
            alignItems: "center",
            gap: 8,
            opacity: 0.35,
          }}
        >
          <div style={{ width: 6, height: 6, borderRadius: 3, background: "#df6028" }} />
          <div style={{ width: 80, height: 2, background: "rgba(223,96,40,0.6)" }} />
          <div style={{ width: 6, height: 6, borderRadius: 3, background: "#df6028" }} />
          <div style={{ width: 40, height: 2, background: "rgba(223,96,40,0.4)" }} />
          <div style={{ width: 6, height: 6, borderRadius: 3, background: "#df6028" }} />
        </div>

        {/* Logo wordmark */}
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            gap: 2,
            marginBottom: 20,
          }}
        >
          <span
            style={{
              fontFamily: "serif",
              fontWeight: 800,
              fontSize: 44,
              color: "#faf8f3",
              letterSpacing: "-0.5px",
            }}
          >
            Dhaba
          </span>
          <span
            style={{
              fontFamily: "sans-serif",
              fontWeight: 700,
              fontSize: 40,
              color: "#df6028",
            }}
          >
            Route
          </span>
        </div>

        {/* Headline */}
        <div
          style={{
            fontFamily: "serif",
            fontWeight: 800,
            fontSize: 68,
            lineHeight: 1.06,
            color: "#faf8f3",
            maxWidth: 780,
            letterSpacing: "-1.5px",
          }}
        >
          Authentic dhabas on your route.
        </div>

        {/* Subtext */}
        <div
          style={{
            marginTop: 20,
            fontFamily: "sans-serif",
            fontWeight: 400,
            fontSize: 26,
            color: "rgba(250,248,243,0.65)",
            maxWidth: 640,
          }}
        >
          Indian food stops mapped for long-haul drivers and highway travelers.
        </div>

        {/* Domain pill */}
        <div
          style={{
            position: "absolute",
            bottom: 52,
            right: 72,
            display: "flex",
            alignItems: "center",
            padding: "10px 20px",
            borderRadius: 100,
            border: "1.5px solid rgba(223,96,40,0.5)",
            background: "rgba(223,96,40,0.12)",
          }}
        >
          <span
            style={{
              fontFamily: "sans-serif",
              fontWeight: 600,
              fontSize: 20,
              color: "#df6028",
            }}
          >
            dhabaroute.com
          </span>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
