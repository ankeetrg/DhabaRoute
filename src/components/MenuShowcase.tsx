// MenuShowcase — server component, editorial/static.
//
// Design spec:
//   Padding: 68px top, 0 bottom (content bleeds into next section)
//   Sage eyebrow "ON THE MENU": 10.5px, 700, 0.18em tracking
//   Section heading: "What you'll find inside" — 19px, 700
//   4 dish cards: repeat(auto-fill, minmax(250px, 1fr)), gap 16px
//   Photo placeholder: 180px tall, warm diagonal-stripe
//   Subname: 10.5px, 600, uppercase, 0.08em tracking, var(--sage)
//   Name: 15px, 700
//   Body: 12.5px, 1.65, #8a7a6a

const DISHES = [
  {
    subname: "murgh makhani",
    name: "Butter Chicken",
    description:
      "Tender chicken in a rich tomato-cream gravy. The benchmark of every dhaba worth stopping for.",
  },
  {
    subname: "kali dal",
    name: "Dal Makhani",
    description:
      "Black lentils slow-cooked overnight with cream and butter. A dhaba staple since before your truck existed.",
  },
  {
    subname: "stuffed flatbread",
    name: "Aloo Paratha",
    description:
      "Spiced potato, white butter, and achaar. The original trucker\u2019s breakfast, served hot off the tawa.",
  },
  {
    subname: "sweet or salted",
    name: "Lassi",
    description:
      "A steel glass of cold lassi after a dal-roti meal is the whole point of stopping.",
  },
] as const;

export function MenuShowcase() {
  return (
    <section style={{ paddingTop: 68, paddingBottom: 0 }}>
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
            On the menu
          </p>
        </div>

        {/* Section heading */}
        <h2
          className="font-ui font-bold"
          style={{ fontSize: 19, color: "#1c1814" }}
        >
          What you&apos;ll find inside
        </h2>
        <p
          className="mt-1 font-ui"
          style={{ fontSize: 13, color: "#9a8a7a" }}
        >
          Across all dhabas, some dishes are non-negotiable.
        </p>

        {/* Dish cards */}
        <div
          className="mt-7"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
            gap: 16,
          }}
        >
          {DISHES.map((dish) => (
            <div key={dish.name} className="rounded-2xl overflow-hidden bg-white" style={{ border: "1.5px solid #e8dfd4" }}>
              {/* Warm diagonal-stripe placeholder (180px tall) */}
              <div
                aria-hidden
                style={{
                  height: 180,
                  background:
                    "repeating-linear-gradient(-45deg, #f5ede3 0px, #f5ede3 14px, #eddecf 14px, #eddecf 28px)",
                }}
              />

              {/* Card body */}
              <div className="p-4">
                <p
                  className="font-ui font-semibold"
                  style={{
                    fontSize: "10.5px",
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    color: "var(--sage)",
                  }}
                >
                  {dish.subname}
                </p>
                <p
                  className="mt-1 font-ui font-bold"
                  style={{ fontSize: 15, color: "#1c1814" }}
                >
                  {dish.name}
                </p>
                <p
                  className="mt-2 font-ui leading-[1.65]"
                  style={{ fontSize: "12.5px", color: "#8a7a6a" }}
                >
                  {dish.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
