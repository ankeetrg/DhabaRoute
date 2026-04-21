import type { Metadata } from "next";
import Link from "next/link";

// Editorial page — the "why this exists" story of DhabaRoute. Tone is
// deliberately documentary, not marketing: specific sensory detail over
// adjectives, short declarative sentences over copy-deck hype. The whole
// page should read like a magazine feature a reader might actually finish,
// not a brand explainer.
//
// Visual system matches the rest of the site — same paper-warm palette,
// same type scale. Photos get a cross-page desaturation + mild contrast
// bump so they sit inside the muted palette without fighting it. See the
// shared `photo` class below.

export const metadata: Metadata = {
  title: "What is a Dhaba?",
  description:
    "A short field guide to dhabas — the trucker kitchens that grew up along India's highways, now quietly reopening along America's interstates.",
};

// ── Image URLs ─────────────────────────────────────────────────────────
// Unsplash CDN photos chosen to match the tone of the accompanying copy.
// Swap any of these by pointing to a different photo-<id> — they all share
// the same sizing/crop params. Kept in one place so editors don't have to
// hunt through JSX.
const IMG = {
  hero:        "https://images.unsplash.com/photo-1617692855027-33b14f061079?w=1800&q=80&auto=format&fit=crop",
  highway:     "https://images.unsplash.com/photo-1580746738099-1cbf7fd4b07c?w=1200&q=80&auto=format&fit=crop",
  tawa:        "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=1200&q=80&auto=format&fit=crop",
  charpoy:     "https://images.unsplash.com/photo-1566552881560-0be862a7c445?w=1200&q=80&auto=format&fit=crop",
  chai:        "https://images.unsplash.com/photo-1571934811356-5cc061b6821f?w=1200&q=80&auto=format&fit=crop",
  dal:         "https://images.unsplash.com/photo-1546833998-877b37c2e5c6?w=1200&q=80&auto=format&fit=crop",
  roti:        "https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=1200&q=80&auto=format&fit=crop",
  sabzi:       "https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=1200&q=80&auto=format&fit=crop",
  truckDriver: "https://images.unsplash.com/photo-1519138432193-4a5b947779aa?w=1600&q=80&auto=format&fit=crop",
  interstate:  "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=1600&q=80&auto=format&fit=crop",
};

// Shared image treatment — keeps every photo on-brand and stops the page
// from feeling like a stock-photo quilt. Inline-style because Tailwind v3
// can't do arbitrary filter values cleanly.
const PHOTO_FILTER = { filter: "saturate(0.72) contrast(1.08)" };

export default function WhatIsADhabaPage() {
  return (
    <article className="pb-20">
      {/* ── 1. HERO ─────────────────────────────────────────────────────
          Full-bleed photo with a muted overlay so the headline stays
          legible regardless of which direction the image leans. No
          call-to-action here — this is a read, not a funnel. */}
      <section className="relative w-full overflow-hidden bg-ink">
        <div className="relative aspect-[16/9] sm:aspect-[21/9] w-full">
          <img
            src={IMG.hero}
            alt="A roadside dhaba at dusk, smoke rising from a tandoor, charpoys lined along the verge."
            style={PHOTO_FILTER}
            className="absolute inset-0 h-full w-full object-cover"
          />
          {/* Gradient: darker at the bottom where the headline sits */}
          <div
            aria-hidden
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(to bottom, rgba(17,17,17,0.15) 0%, rgba(17,17,17,0.35) 55%, rgba(17,17,17,0.78) 100%)",
            }}
          />
          <div className="absolute inset-0 flex items-end">
            <div className="container-page pb-10 sm:pb-14">
              <p className="text-[11px] sm:text-[12px] font-semibold uppercase tracking-[0.16em] text-clay-200">
                A field guide
              </p>
              <h1 className="mt-3 max-w-3xl text-[32px] sm:text-5xl md:text-[56px] leading-[1.02] tracking-tight font-semibold text-paper">
                What is a dhaba?
              </h1>
              <p className="mt-3 max-w-xl text-[14px] sm:text-[15px] text-paper/85 leading-relaxed">
                Truckers&rsquo; kitchens. Built on the shoulders of highways,
                fed by the people who drive them.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── 2. INTRO — two short paragraphs ─────────────────────────── */}
      <section className="container-page max-w-3xl pt-14 sm:pt-20">
        <p className="text-[17px] sm:text-[18px] leading-[1.62] text-ink">
          A dhaba is a roadside kitchen. Smoke from a clay tandoor, steel
          plates that ring when they land on the table, a row of charpoys
          strung with rope where drivers sleep off the afternoon heat. The
          menu rarely needs writing down. Dal, roti, sabzi, chicken if the
          butcher came that morning, chai in a kulhad that stains your lips.
          The price is whatever keeps the place running.
        </p>
        <p className="mt-6 text-[15.5px] sm:text-[16px] leading-[1.72] text-ink-soft">
          Dhabas grew up along the Grand Trunk Road — the 1,500-mile artery
          that runs from the Bay of Bengal into the foothills of the Hindu
          Kush. They fed the drivers who fed the country: grain trucks,
          cement trucks, petrol tankers, the long-haul men who lived
          three weeks on the road for every week at home. The food was
          cheap because the customer was particular. The customer was
          particular because the food was all there was.
        </p>
      </section>

      {/* ── 3. UNEVEN 4-PHOTO GRID ──────────────────────────────────────
          Asymmetric layout reads more like a magazine spread than a
          symmetric stock-photo grid. Captions tight, italic, muted. */}
      <section className="container-page mt-14 sm:mt-20">
        <div className="grid grid-cols-6 gap-2 sm:gap-3">
          <PhotoTile
            src={IMG.highway}
            alt="Two-lane blacktop cutting through Punjab farmland, a line of painted trucks idling on the verge."
            caption="The Grand Trunk Road, early morning."
            className="col-span-6 sm:col-span-4 aspect-[4/3] sm:aspect-[16/10]"
          />
          <PhotoTile
            src={IMG.charpoy}
            alt="A charpoy — a rope-strung daybed — pulled up to a low wooden table outside a dhaba."
            caption="Charpoy. Bed, bench, table."
            className="col-span-6 sm:col-span-2 aspect-[4/3] sm:aspect-auto"
          />
          <PhotoTile
            src={IMG.chai}
            alt="Kulhad chai — tea in a small unglazed clay cup — steaming on a steel counter."
            caption="Chai. Served in a kulhad."
            className="col-span-3 sm:col-span-2 aspect-square sm:aspect-[4/5]"
          />
          <PhotoTile
            src={IMG.tawa}
            alt="A cook flipping rotis on a blackened iron tawa over a wood flame."
            caption="The tawa, always hot."
            className="col-span-3 sm:col-span-4 aspect-square sm:aspect-[16/10]"
          />
        </div>
      </section>

      {/* ── 4. PULL QUOTE ──────────────────────────────────────────────
          Large serif italic, left-aligned but generously margined so the
          eye slows down. Quiet clay rule above, no quotation marks. */}
      <section className="container-page max-w-3xl mt-16 sm:mt-24">
        <div className="border-t border-clay-200 pt-8 sm:pt-10">
          <blockquote className="font-display italic text-[24px] sm:text-[32px] leading-[1.18] tracking-tight text-ink">
            A dhaba isn&rsquo;t a restaurant that happens to be by the road.
            It&rsquo;s a kitchen that answers to the road. The road tells it
            what to cook, who to feed, how late to stay open.
          </blockquote>
        </div>
      </section>

      {/* ── 5. "BUILT FOR PEOPLE GOING SOMEWHERE" ───────────────────────
          Three food photos in a row, supported by a short paragraph. The
          photos carry most of the weight — the copy just anchors them. */}
      <section className="container-page mt-16 sm:mt-24">
        <h2 className="text-[22px] sm:text-[28px] leading-[1.15] tracking-tight font-semibold text-ink max-w-2xl">
          Built for people going somewhere
        </h2>
        <p className="mt-3 max-w-2xl text-[15.5px] leading-[1.7] text-ink-soft">
          A dhaba cooks for a body that&rsquo;s been sitting for ten hours
          and has three hundred miles left. The food is hot, heavy, and
          fast. You eat with your hands. You leave a tip the size of a
          handshake. You&rsquo;re back on the road inside forty minutes.
        </p>
        <div className="mt-6 sm:mt-8 grid grid-cols-3 gap-2 sm:gap-3">
          <PhotoTile
            src={IMG.dal}
            alt="A steel bowl of thick yellow dal, a pat of butter dissolving on top."
            caption="Dal. Tempered, heavy, cheap."
            className="aspect-[4/5]"
          />
          <PhotoTile
            src={IMG.roti}
            alt="A stack of rotis — wholewheat flatbreads — still puffing steam."
            caption="Roti. Off the tawa, not a shelf."
            className="aspect-[4/5]"
          />
          <PhotoTile
            src={IMG.sabzi}
            alt="A karahi of sabzi — curried vegetables — set on a rough wooden counter."
            caption="Sabzi. Whatever the market had."
            className="aspect-[4/5]"
          />
        </div>
      </section>

      {/* ── 6. FROM THE GRAND TRUNK ROAD TO I-40 ────────────────────────
          The diaspora beat. Pairs a photo of a long interstate with the
          historical throughline. Two-column layout on desktop, stacked on
          mobile; reads as one argument either way. */}
      <section className="container-page mt-16 sm:mt-24">
        <div className="grid gap-6 sm:gap-10 md:grid-cols-2 md:items-center">
          <div className="relative overflow-hidden rounded-2xl">
            <img
              src={IMG.interstate}
              alt="An American interstate at dawn, a semi-truck receding toward a flat horizon."
              style={PHOTO_FILTER}
              className="w-full h-full object-cover aspect-[4/3]"
            />
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-clay-600">
              The route moved
            </p>
            <h2 className="mt-2 text-[22px] sm:text-[28px] leading-[1.15] tracking-tight font-semibold text-ink">
              From the Grand Trunk Road to I-40
            </h2>
            <p className="mt-3 text-[15.5px] leading-[1.7] text-ink-soft">
              Punjabi truckers came to the United States, and when they
              stayed, they drove. Today more than a hundred and fifty
              thousand of them are behind the wheel of a long-haul rig.
              You&rsquo;ll find them at truck stops from Barstow to
              Flagstaff, from Carlisle to Laredo.
            </p>
            <p className="mt-4 text-[15.5px] leading-[1.7] text-ink-soft">
              The kitchens followed. A second-generation son parks a steam
              table inside a Shell station off I-40. A family opens a
              twenty-seat room behind a car wash in Fontana. The menu
              doesn&rsquo;t change: dal, roti, sabzi, chicken, chai. Cheap,
              hot, fast, late.
            </p>
            <p className="mt-4 text-[15.5px] leading-[1.7] text-ink-soft">
              A dhaba on the interstate isn&rsquo;t a novelty. It&rsquo;s the
              same kitchen, relocated.
            </p>
          </div>
        </div>
      </section>

      {/* ── 7. REQUIREMENTS CARD ────────────────────────────────────────
          What qualifies as a dhaba in our listing — written as a short
          checklist the reader can scan. The bottom line is the editorial
          stance, not a marketing boast. */}
      <section className="container-page max-w-3xl mt-16 sm:mt-24">
        <div className="rounded-2xl bg-white border border-paper-warm shadow-card p-6 sm:p-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-clay-600">
            Editorial line
          </p>
          <h2 className="mt-2 text-[22px] sm:text-[26px] leading-[1.15] tracking-tight font-semibold text-ink">
            What counts as a dhaba on DhabaRoute
          </h2>

          <ul role="list" className="mt-6 space-y-4">
            <Requirement
              icon="🍛"
              title="Punjabi or North Indian food, cooked fresh"
              body="Dal, roti, sabzi, chicken, chai. Not a pan-Asian buffet with a token curry."
            />
            <Requirement
              icon="🚛"
              title="Reachable from a long-haul route"
              body="Within a few minutes of an interstate, highway truck stop, or well-known trucker corridor."
            />
            <Requirement
              icon="📍"
              title="A real, verified address"
              body="Open as of the last check, with a working Google Maps pin. No ghost kitchens, no closed listings."
            />
            <Requirement
              icon="🚫"
              title="No chains, no sponsorships"
              body="Independent or family-run. We don&rsquo;t take money to list a place, and we don&rsquo;t dress up a franchise."
            />
          </ul>

          <p className="mt-8 pt-6 border-t border-paper-warm text-[14.5px] italic text-ink-soft leading-[1.65]">
            We&rsquo;d rather list 150 real dhabas than 500 questionable ones.
          </p>
        </div>
      </section>

      {/* ── 8. CTA ──────────────────────────────────────────────────────
          One action. Submit. The whole page is set up to make that feel
          like the natural next move, not a conversion target. */}
      <section className="container-page mt-16 sm:mt-20">
        <div className="max-w-2xl">
          <h2 className="text-[22px] sm:text-[26px] leading-[1.15] tracking-tight font-semibold text-ink">
            Know a dhaba we&rsquo;re missing?
          </h2>
          <p className="mt-3 text-[15.5px] leading-[1.7] text-ink-soft">
            If you&rsquo;ve eaten somewhere a driver should know about, tell
            us. We review every submission before it goes on the map.
          </p>
          <div className="mt-6">
            <Link
              href="/submit"
              className={[
                "inline-flex items-center justify-center gap-2 h-12 px-6 rounded-xl",
                "bg-clay-500 text-white text-[14px] font-semibold tracking-[-0.005em]",
                "shadow-cta hover:bg-clay-600 active:scale-[0.99] transition",
              ].join(" ")}
            >
              Submit a dhaba
              <svg aria-hidden viewBox="0 0 12 12" className="w-3 h-3 flex-none opacity-90">
                <path
                  d="M3 1h8v8M11 1L1 11"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                />
              </svg>
            </Link>
          </div>
        </div>
      </section>
    </article>
  );
}

// ── Small helpers ─────────────────────────────────────────────────────

// One visual tile: a photo + a short italic caption. The desaturation
// filter is applied inline so it travels with the tile wherever it's used.
function PhotoTile({
  src,
  alt,
  caption,
  className = "",
}: {
  src: string;
  alt: string;
  caption: string;
  className?: string;
}) {
  return (
    <figure className={["relative overflow-hidden rounded-xl", className].join(" ")}>
      <img
        src={src}
        alt={alt}
        style={PHOTO_FILTER}
        className="absolute inset-0 h-full w-full object-cover"
      />
      <figcaption
        className={[
          "absolute inset-x-0 bottom-0 px-3 py-2",
          "bg-gradient-to-t from-ink/70 via-ink/30 to-transparent",
          "text-[11.5px] italic text-paper/90 leading-snug",
        ].join(" ")}
      >
        {caption}
      </figcaption>
    </figure>
  );
}

// One row of the requirements card.
function Requirement({
  icon,
  title,
  body,
}: {
  icon: string;
  title: string;
  body: string;
}) {
  return (
    <li className="flex gap-3.5">
      <span
        aria-hidden
        className="flex-none w-8 h-8 rounded-lg bg-paper-soft border border-paper-warm flex items-center justify-center text-[15px] leading-none"
      >
        {icon}
      </span>
      <div className="min-w-0">
        <h3 className="text-[14.5px] font-semibold text-ink leading-snug">
          {title}
        </h3>
        <p className="mt-1 text-[13.5px] text-ink-muted leading-[1.6]">
          {body}
        </p>
      </div>
    </li>
  );
}
