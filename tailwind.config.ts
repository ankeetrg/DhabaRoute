import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Neutrals — 90% of the surface area.
        // Warm off-white paper against near-black ink; soft warm gray for
        // borders so the palette still reads Indian/earthy, not clinical.
        ink: {
          DEFAULT: "#111111", // primary text
          soft: "#333333",
          muted: "#555555",   // secondary text
        },
        paper: {
          DEFAULT: "#FAF7F2", // background
          soft: "#F4EFE7",    // elevated surface (cards sitting on bg)
          warm: "#E5E0D8",    // subtle warm border
        },
        line: "#DDDDDD",      // neutral border when a cooler edge is wanted

        // Accents — 10% of the surface area. Muted, no saturation spikes.
        // "clay" kept as the token name since it's used across the codebase;
        // the value is now the spec's muted saffron.
        clay: {
          50:  "#FCF1E9",
          100: "#F7DFC9",
          200: "#EFC09C",
          300: "#E69E6F",
          400: "#E88247",
          500: "#E46A2E", // primary CTA & highlights
          600: "#C2622A", // hover/active — spec anchor (#c2622a)
          700: "#A84619",
          800: "#833717",
          900: "#5C2712",
        },
        // Vegetarian / success — muted green
        leaf: {
          DEFAULT: "#2F7D4C",
          soft:    "#E6F0EB",
          line:    "#C9DDD1",
        },
        // Links / focus — deep blue
        ocean: {
          DEFAULT: "#2C5F8D",
          soft:    "#E8EEF5",
        },
        haldi: {
          DEFAULT: "#D99A2B",
          soft:    "#F3C760",
        },
        // Design-spec aliases — wired to CSS custom properties so changing
        // a token in globals.css automatically propagates everywhere.
        // These sit alongside the clay-* scale; use whichever the spec calls.
        accent:    "var(--accent)",   // #df6028 — same family as clay-500/600
        sage: {
          DEFAULT: "var(--sage)",     // #6b8e5f
          soft:    "var(--sage-soft)",// rgba(107,142,95,0.08)
        },
      },
      fontFamily: {
        sans: [
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Inter",
          "Helvetica Neue",
          "Arial",
          "sans-serif",
        ],
        // Design-spec type scale.
        // font-display → Bricolage Grotesque for H1/H2 editorial headings.
        // font-ui      → DM Sans for nav, labels, body, button text.
        // Both loaded via Google Fonts in layout.tsx; system fallbacks fire
        // until the webfonts arrive so there's no invisible text.
        display: ["Bricolage Grotesque", "system-ui", "sans-serif"],
        ui:      ["DM Sans", "system-ui", "sans-serif"],
      },
      borderRadius: {
        xl: "14px",
        "2xl": "20px",
      },
      boxShadow: {
        // Soft elevations against warm paper — cool shadow reads premium.
        card:           "0 1px 2px rgba(17, 17, 17, 0.04), 0 4px 16px -10px rgba(17, 17, 17, 0.10)",
        cardHover:      "0 2px 4px rgba(17, 17, 17, 0.06), 0 10px 26px -12px rgba(17, 17, 17, 0.16)",
        cta:            "0 1px 2px rgba(228, 106, 46, 0.20), 0 6px 18px -8px rgba(228, 106, 46, 0.35)",
        // Spec card hover — slightly deeper for the new card lift animation.
        cardHoverSpec:  "0 8px 32px rgba(28,24,20,0.11), 0 2px 6px rgba(28,24,20,0.06)",
      },
      maxWidth: {
        content: "1200px",
      },
    },
  },
  plugins: [],
};

export default config;
