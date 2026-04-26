// HowItWorks — server component, no client JS needed.
//
// Design spec:
//   Background: rgba(107,142,95,0.08) — sage tint
//   Border: 1px solid rgba(107,142,95,0.12) on top and bottom
//   Padding: 52px vertical (horizontal via container-page)
//   Three cards: white, 1.5px solid #e8dfd4, 16px radius, 24px 22px padding
//   Step number: 11px 700 rgba(28,24,20,0.22) tracking-[0.1em]
//   Icon: 28×28 SVG, color var(--accent)
//   Title: 14.5px 700 #1c1814
//   Body: 13px 1.65 #8a7a6a

const STEPS = [
  {
    num: "01",
    title: "Search or use your location",
    body: "Type a highway, city, or cuisine — or let us sort by what\u2019s closest to you right now.",
    icon: (
      <svg
        aria-hidden
        viewBox="0 0 28 28"
        width="28"
        height="28"
        fill="currentColor"
      >
        <path d="M14 3a8 8 0 00-8 8c0 5.6 7 13.5 7.35 13.9a.85.85 0 001.3 0C15 24.5 22 16.6 22 11a8 8 0 00-8-8zm0 10.5a2.5 2.5 0 110-5 2.5 2.5 0 010 5z" />
      </svg>
    ),
  },
  {
    num: "02",
    title: "See dhabas on the map and list",
    body: "Filter by truck parking, vegetarian, late night — whatever you need at this hour.",
    icon: (
      <svg
        aria-hidden
        viewBox="0 0 28 28"
        width="28"
        height="28"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="13" cy="13" r="7" />
        <path d="M18.5 18.5L24 24" />
      </svg>
    ),
  },
  {
    num: "03",
    title: "Tap \u2018Open in Maps\u2019 to navigate",
    body: "One tap to Google Maps for turn-by-turn directions. No sign-up, no account needed.",
    icon: (
      <svg
        aria-hidden
        viewBox="0 0 28 28"
        width="28"
        height="28"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M22 6L14 14M22 6H16M22 6V12" />
        <path d="M11 6H7a2 2 0 00-2 2v13a2 2 0 002 2h13a2 2 0 002-2v-4" />
      </svg>
    ),
  },
] as const;

export function HowItWorks() {
  return (
    <section
      style={{
        background: "rgba(107,142,95,0.08)",
        borderTop: "1px solid rgba(107,142,95,0.12)",
        borderBottom: "1px solid rgba(107,142,95,0.12)",
        paddingTop: 52,
        paddingBottom: 52,
      }}
    >
      <div className="container-page">
        {/* Sage accent line */}
        <div
          aria-hidden
          style={{
            width: 32,
            height: 2,
            background: "#6b8e5f",
            borderRadius: 999,
            opacity: 0.5,
            marginBottom: 16,
          }}
        />

        {/* Section header */}
        <h2
          className="font-ui font-bold"
          style={{ fontSize: 18, color: "#1c1814" }}
        >
          How it works
        </h2>
        <p
          className="mt-1 font-ui italic"
          style={{ fontSize: 13, color: "#9a8a7a" }}
        >
          Every listing is verified. Real dhabas, real food.
        </p>

        {/* Step cards */}
        <div
          className="mt-8"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: 20,
          }}
        >
          {STEPS.map((step) => (
            <div
              key={step.num}
              style={{
                background: "#fff",
                borderRadius: 16,
                border: "1.5px solid #e8dfd4",
                padding: "24px 22px",
              }}
            >
              {/* Step number */}
              <p
                className="font-ui font-bold"
                style={{
                  fontSize: 11,
                  color: "rgba(28,24,20,0.22)",
                  letterSpacing: "0.1em",
                }}
              >
                {step.num}
              </p>

              {/* Icon */}
              <div
                className="mt-3"
                style={{ color: "var(--accent)", width: 28, height: 28 }}
              >
                {step.icon}
              </div>

              {/* Title */}
              <p
                className="mt-3 font-ui font-bold"
                style={{ fontSize: "14.5px", color: "#1c1814" }}
              >
                {step.title}
              </p>

              {/* Body */}
              <p
                className="mt-2 font-ui leading-[1.65]"
                style={{ fontSize: 13, color: "#8a7a6a" }}
              >
                {step.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
