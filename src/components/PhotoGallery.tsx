// PhotoGallery — server component, editorial/static.
//
// Design spec:
//   Background: rgba(107,142,95,0.08), padding 68px 0 0
//   Same sage eyebrow: "LIFE ON THE ROAD"
//   Heading: "What a dhaba looks like" — 19px, 700
//   Subline: "Candid. Lived-in. No polish." — 13px, #9a8a7a
//
//   Row 1: grid-template-columns 2fr 1fr, gap 12px, height 270px, radius 14px
//     Left: "chai at dawn" → "First light, first chai."
//     Right: "kitchen prep" → "Behind the counter."
//
//   Row 2: grid-template-columns 1fr 1fr 1fr, gap 12px, height 196px
//     "truck lot, 2am" → "Parking lot, late shift."
//     "driver eating" → "Steel plate, plastic chair."
//     "tawa roti" → "Off the tawa."
//
//   Caption overlay: bottom 10px left 14px, 11px italic rgba(255,255,255,0.75)
//   Placeholder: warm diagonal-stripe gradient until real photos are available

const ROW1: Array<{ label: string; caption: string }> = [
  { label: "chai at dawn",   caption: "First light, first chai." },
  { label: "kitchen prep",   caption: "Behind the counter." },
];

const ROW2: Array<{ label: string; caption: string }> = [
  { label: "truck lot, 2am",  caption: "Parking lot, late shift." },
  { label: "driver eating",   caption: "Steel plate, plastic chair." },
  { label: "tawa roti",       caption: "Off the tawa." },
];

// Warm diagonal-stripe placeholder — same treatment as MenuShowcase photo cells.
function StripePlaceholder({ height }: { height: number }) {
  return (
    <div
      aria-hidden
      style={{
        position: "absolute",
        inset: 0,
        height,
        background:
          "repeating-linear-gradient(-45deg, #f5ede3 0px, #f5ede3 14px, #eddecf 14px, #eddecf 28px)",
      }}
    />
  );
}

// Caption overlay — bottom-left, italic, semi-transparent white.
function Caption({ text }: { text: string }) {
  return (
    <p
      className="font-ui"
      style={{
        position: "absolute",
        bottom: 10,
        left: 14,
        fontSize: 11,
        color: "rgba(255,255,255,0.75)",
        fontStyle: "italic",
        zIndex: 2,
        // Soft text shadow so the caption reads even over light placeholders
        textShadow: "0 1px 3px rgba(0,0,0,0.35)",
      }}
    >
      {text}
    </p>
  );
}

export function PhotoGallery() {
  return (
    <section
      style={{
        background: "rgba(107,142,95,0.08)",
        paddingTop: 68,
        paddingBottom: 0,
      }}
    >
      <div className="container-page">
        {/* Sage eyebrow */}
        <div className="flex items-center gap-3 mb-4">
          <div
            aria-hidden
            style={{
              width: 36,
              height: 2,
              background: "#6b8e5f",
              borderRadius: 999,
              opacity: 0.5,
              flexShrink: 0,
            }}
          />
          <p
            className="font-ui font-bold"
            style={{
              fontSize: "10.5px",
              textTransform: "uppercase",
              letterSpacing: "0.18em",
              color: "var(--sage)",
            }}
          >
            Life on the road
          </p>
        </div>

        <h2
          className="font-ui font-bold"
          style={{ fontSize: 19, color: "#1c1814" }}
        >
          What a dhaba looks like
        </h2>
        <p
          className="mt-1 font-ui"
          style={{ fontSize: 13, color: "#9a8a7a" }}
        >
          Candid. Lived-in. No polish.
        </p>
      </div>

      {/* ── Photo grid ─────────────────────────────────────────── */}
      <div className="container-page mt-8 pb-0">
        {/* Row 1: 2fr 1fr */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "2fr 1fr",
            gap: 12,
          }}
        >
          {ROW1.map((cell) => (
            <div
              key={cell.label}
              className="relative overflow-hidden"
              style={{ height: 270, borderRadius: 14 }}
            >
              <StripePlaceholder height={270} />
              <Caption text={cell.caption} />
            </div>
          ))}
        </div>

        {/* Row 2: 1fr 1fr 1fr */}
        <div
          className="mt-3"
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            gap: 12,
          }}
        >
          {ROW2.map((cell) => (
            <div
              key={cell.label}
              className="relative overflow-hidden"
              style={{ height: 196, borderRadius: 14 }}
            >
              <StripePlaceholder height={196} />
              <Caption text={cell.caption} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
