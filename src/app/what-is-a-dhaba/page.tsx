import type { Metadata } from "next";
import Link from "next/link";

// Editorial long-read on the history and character of the dhaba — what it
// is in Punjab, how it travels, how we decide what belongs on DhabaRoute.
//
// Voice: specific, sensory, first-person-removed. No marketing tone, no
// adjectives doing work that nouns could do. Sentences are short more
// often than long. If a line could appear in a travel-magazine caption
// instead of a brand site, it's pulling its weight.
//
// Visuals: documentary photos only — actual people, actual dhabas, actual
// smoke. All images pass through the same filter stack so they sit
// together as one set rather than a stock quilt. If a photo ever looks
// retouched or menu-styled, swap it.

export const metadata: Metadata = {
  title: "What is a Dhaba?",
  description:
    "Dhabas are India's highway kitchens — charcoal tandoors, simmered dal, steel plates, chai poured from height. Born on the Grand Trunk Road, they now line American truck routes from Fontana to Flagstaff.",
};

// ── Photos ─────────────────────────────────────────────────────────────
// Unsplash short-IDs chosen from candid India searches — each was picked
// for signals of actually-there-ness: a cook over a flame, a painted
// truck, a street vendor pouring chai, an empty desert interstate at
// dusk. URLs go through source.unsplash.com with a fixed size so every
// tile requests an appropriately-sized asset.
//
// To swap: open the photo page on unsplash.com, copy the short ID out
// of the URL, drop it in here. Sizing stays in the consumer's className
// via aspect-ratio — no need to match W×H exactly.
const U = (id: string, size: string) =>
  `https://source.unsplash.com/${id}/${size}`;

const IMG = {
  // Night-lit food stall, the cook facing away. Reads immediately as
  // "street kitchen after dark" — sets the entire tone in one frame.
  hero: U("_-luqYQSnTA", "1800x1000"),

  // Row 1 (wide, spans two columns): cook flipping flatbread on a huge
  // griddle. This IS the tawa shot — no need to describe it, just show it.
  rowWide: U("bKrLCNjS_oQ", "1600x1000"),
  // Row 2 (portrait): street vendor pouring chai for customers.
  rowChai: U("hfdncZdKbWI", "900x1200"),
  // Row 3 (portrait): people buying from a cart, hands mid-transaction.
  rowCrowd: U("yOIHawAsRqA", "900x1200"),

  // Hand-painted highway truck on a rural Indian road — Punjabi truck art
  // carries half the visual history of the diaspora story on its own.
  truck: U("d_su8Ugdmj0", "1600x1000"),

  // The bridge: an empty American interstate at sunset. Full-bleed, this
  // is the frame every long-haul driver has seen at 4am.
  usHighway: U("iscEFQJzJiM", "2000x1100"),
};

// Applied to every photo. Cuts saturation enough that nothing reads like
// a menu photograph; a small contrast nudge keeps shadows alive; a hair
// of brightness reduction pulls the whole page toward warm dusk.
const PHOTO_FILTER = {
  filter: "saturate(0.65) contrast(1.12) brightness(0.97)",
};

export default function WhatIsADhabaPage() {
  return (
    <article className="pb-20">
      {/* ─────────────────────────────────────────────────────────────── */}
      {/* 1. HERO — full-bleed, dark gradient from bottom, headline overlay */}
      {/* ─────────────────────────────────────────────────────────────── */}
      <section className="relative w-full overflow-hidden bg-ink">
        <div className="relative aspect-[16/10] sm:aspect-[21/9] w-full">
          <img
            src={IMG.hero}
            alt="A cook behind a street food stall after dark, steam rising from the pans."
            style={PHOTO_FILTER}
            className="absolute inset-0 h-full w-full object-cover"
          />
          {/* Heavier gradient at the bottom so headline + subhead clear
              the photo regardless of which frame source.unsplash returns. */}
          <div
            aria-hidden
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(to bottom, rgba(17,17,17,0.20) 0%, rgba(17,17,17,0.38) 50%, rgba(17,17,17,0.82) 100%)",
            }}
          />
          <div className="absolute inset-0 flex items-end">
            <div className="container-page pb-10 sm:pb-16">
              <p className="text-[11px] sm:text-[12px] font-semibold uppercase tracking-[0.18em] text-clay-200">
                A field guide
              </p>
              <h1 className="mt-3 max-w-3xl text-[34px] sm:text-5xl md:text-[60px] leading-[1.02] tracking-tight font-semibold text-paper">
                What is a Dhaba?
              </h1>
              <p className="mt-4 max-w-xl text-[14.5px] sm:text-[16px] text-paper/85 leading-[1.55]">
                Born on the Grand Trunk Road. Found off every major American
                interstate.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────── */}
      {/* 2. INTRO — two short paragraphs on a warm cream band, drop cap  */}
      {/* ─────────────────────────────────────────────────────────────── */}
      <section className="bg-paper-soft border-b border-paper-warm">
        <div className="container-page max-w-3xl py-14 sm:py-20">
          <p className="text-[17px] sm:text-[18.5px] leading-[1.62] text-ink">
            {/* Drop cap: larger clay-toned letter, float-left, tight
                leading so the body text wraps cleanly around it. */}
            <span className="float-left font-display text-[64px] sm:text-[72px] leading-[0.9] mr-2 mt-1 text-clay-600">
              A
            </span>
            dhaba is a roadside kitchen. Open before light, still open after
            midnight. The cook is standing over a tandoor dug into the
            ground or a tawa wide as a tractor tyre. The dal has been
            simmering since morning — some of it since last night. The
            menu, if there is one at all, is painted on the wall. You order
            by pointing.
          </p>
          <p className="mt-6 text-[15.5px] sm:text-[16.5px] leading-[1.72] text-ink-soft">
            The oldest dhabas were built for truckers — the long-haul men
            moving grain and cement and petrol up and down the Grand Trunk
            Road, the thousand-mile spine that cuts Punjab in half. If you
            wanted to know where a truck driver would stop for dinner, you
            didn&rsquo;t read reviews. You counted the rigs in the lot.
          </p>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────── */}
      {/* 3. 3-PHOTO ROW — one wide (2 cols) + two stacked on desktop;    */}
      {/*    stacked on mobile. All candid, all through PHOTO_FILTER.     */}
      {/* ─────────────────────────────────────────────────────────────── */}
      <section className="container-page mt-14 sm:mt-20">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          <Photo
            src={IMG.rowWide}
            alt="A cook flipping a roti on a wide blackened tawa over open flame."
            caption="The tawa is never off."
            className="sm:col-span-2 aspect-[4/3] sm:aspect-[16/10]"
          />
          <Photo
            src={IMG.rowChai}
            alt="A street vendor pouring chai from height into small cups on a tray."
            caption="Chai, poured from height."
            className="aspect-[4/5] sm:aspect-auto"
          />
          <Photo
            src={IMG.rowCrowd}
            alt="Men gathered at a roadside food cart, handing money across the counter."
            caption="The cart knows its regulars."
            className="aspect-[4/5] sm:col-span-2"
          />
          <Photo
            src={IMG.truck}
            alt="A Punjabi freight truck in hand-painted blue and red, parked on a rural road."
            caption="Every truck is a shrine to itself."
            className="aspect-[4/5] sm:aspect-auto"
          />
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────── */}
      {/* 4. PULL QUOTE — centered serif italic, clay rule above & below  */}
      {/* ─────────────────────────────────────────────────────────────── */}
      <section className="container-page max-w-3xl mt-16 sm:mt-24">
        <div className="border-y border-clay-200 py-10 sm:py-14 text-center">
          <blockquote className="font-display italic text-[24px] sm:text-[34px] leading-[1.22] tracking-tight text-clay-700">
            You eat. You drink your chai. You get back on the road.
          </blockquote>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────── */}
      {/* 5. "SMOKE, FIRE, AND A DAL..." — three paragraphs of substance  */}
      {/* ─────────────────────────────────────────────────────────────── */}
      <section className="container-page max-w-3xl mt-16 sm:mt-20">
        <h2 className="text-[24px] sm:text-[32px] leading-[1.12] tracking-tight font-semibold text-ink">
          Smoke, fire, and a dal that&rsquo;s been going since morning
        </h2>

        <p className="mt-6 text-[16px] leading-[1.72] text-ink-soft">
          You sit on a charpoy — a four-legged wooden frame strung with
          rope, daybed and dinner table at once — and the food arrives on a
          steel thali heavy enough that you feel it settle. Dal makhani
          black from twelve hours on the coals. A stack of roti slapped off
          the tawa so recently it&rsquo;s still puffing. Whatever sabzi the
          market had that morning. A raw onion quartered on the side. No
          garnish. No plating. The plate will be wiped with a rag and sent
          back out before you finish standing up.
        </p>

        <p className="mt-5 text-[16px] leading-[1.72] text-ink-soft">
          Chai comes in a kulhad — an unglazed clay cup the size of a
          shot — and the cook pours it from a foot above the tray so it
          cools and froths on the way down. When you&rsquo;re done you
          drop the cup on the ground. It&rsquo;s fired earth. It goes
          back to earth. Nothing gets washed that doesn&rsquo;t need to
          be. Nothing gets refrigerated if you can help it, because you
          can&rsquo;t, really — the fridge is the afternoon and the
          afternoon is hot.
        </p>

        <p className="mt-5 text-[16px] leading-[1.72] text-ink-soft">
          The people running the place are usually a family. A father at
          the tandoor, a son at the tawa, a brother taking money, a kid
          running orders. A radio on somewhere playing old film songs
          you&rsquo;ll hear again at the next dhaba a hundred kilometres
          down. Mangy dogs sleep in the dust and get fed the ends of the
          rotis. Trucks pull in, idle through dinner, pull out. Nobody is
          trying to impress anybody. The food is just better this way.
        </p>
      </section>

      {/* ─────────────────────────────────────────────────────────────── */}
      {/* 6. FROM THE GRAND TRUNK ROAD TO THE AMERICAN INTERSTATE         */}
      {/*    Ends with a full-bleed wide US highway photo (no border).    */}
      {/* ─────────────────────────────────────────────────────────────── */}
      <section className="container-page max-w-3xl mt-16 sm:mt-24">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-clay-600">
          The route moved
        </p>
        <h2 className="mt-2 text-[24px] sm:text-[32px] leading-[1.12] tracking-tight font-semibold text-ink">
          From the Grand Trunk Road to the American Interstate
        </h2>

        <p className="mt-6 text-[16px] leading-[1.72] text-ink-soft">
          Punjab has been sending people outward for a hundred and fifty
          years — to East Africa, to England, to Canada, to California&rsquo;s
          Central Valley. The ones who came to the United States
          eventually found the thing that had always made sense in Ludhiana
          and Jalandhar: driving. Today more than a hundred and fifty
          thousand Sikh men sit behind the wheel of a long-haul rig
          somewhere on American asphalt.
        </p>

        <p className="mt-5 text-[16px] leading-[1.72] text-ink-soft">
          The kitchens followed the men. A cousin sets up a steam table
          inside a Shell station off I-40. A family opens a twenty-seat
          room behind a car wash in Fontana. A gurdwara off I-5 runs a
          langar that stays open through the night for anyone who walks
          in. The menu is the same. The chai is the same. The kulhad
          isn&rsquo;t always a kulhad anymore — sometimes it&rsquo;s a
          paper cup — but the pour is still from height.
        </p>

        <p className="mt-5 text-[16px] leading-[1.72] text-ink-soft">
          A dhaba on the interstate isn&rsquo;t a novelty or a fusion
          concept. It&rsquo;s the same kitchen, relocated, cooking for
          the same customer. The customer is just wearing a different
          cap now.
        </p>
      </section>

      {/* Full-bleed US highway photo — the emotional close of section 6. */}
      <div className="mt-12 sm:mt-16 w-full overflow-hidden bg-ink">
        <img
          src={IMG.usHighway}
          alt="An empty American interstate cutting through desert at sunset, the road disappearing toward an orange horizon."
          style={PHOTO_FILTER}
          className="block w-full h-auto aspect-[21/9] object-cover"
        />
      </div>

      {/* ─────────────────────────────────────────────────────────────── */}
      {/* 7. REQUIREMENTS CARD — editorial line, 4 criteria, bottom note  */}
      {/* ─────────────────────────────────────────────────────────────── */}
      <section className="container-page max-w-3xl mt-16 sm:mt-24">
        <div className="rounded-2xl bg-white border border-paper-warm shadow-card p-6 sm:p-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-clay-600">
            Editorial line
          </p>
          <h2 className="mt-2 text-[22px] sm:text-[28px] leading-[1.15] tracking-tight font-semibold text-ink">
            What counts as a Dhaba?
          </h2>

          <ul role="list" className="mt-6 space-y-4">
            <Requirement
              icon="🍛"
              title="Real Punjabi or Indian food, made fresh"
              body="Cooked that day. No fast-casual. No chains. No token curry on a pan-Asian menu."
            />
            <Requirement
              icon="🚛"
              title="Reachable by truck"
              body="Parking that fits a rig, a location close to a highway or travel center, or a community address a driver can find on a short break."
            />
            <Requirement
              icon="📍"
              title="An active Google Maps listing"
              body="Confirmed open, with a working pin. If we can&rsquo;t route a driver to it tonight, it doesn&rsquo;t belong on the map."
            />
            <Requirement
              icon="🚫"
              title="Not fine dining"
              body="Dhabas are for people on the move, not people on a date. If the menu has a tasting flight, the listing isn&rsquo;t for us."
            />
          </ul>

          <p className="mt-8 pt-6 border-t border-paper-warm text-[14.5px] italic text-ink-soft leading-[1.65]">
            We&rsquo;d rather list 150 real dhabas than 500 questionable ones.
          </p>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────── */}
      {/* 8. CTA — one action, clay button                                 */}
      {/* ─────────────────────────────────────────────────────────────── */}
      <section className="container-page mt-16 sm:mt-20">
        <div className="max-w-2xl">
          <h2 className="text-[22px] sm:text-[26px] leading-[1.15] tracking-tight font-semibold text-ink">
            Know a spot we&rsquo;re missing?
          </h2>
          <p className="mt-3 text-[15.5px] leading-[1.72] text-ink-soft">
            If you&rsquo;ve eaten somewhere a driver should know about —
            off I-40, I-5, I-80, the 95, anywhere — tell us. We check every
            submission before it goes on the map.
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

// ── Helpers ───────────────────────────────────────────────────────────

// One photo tile: image + short italic caption overlaid at the bottom.
// `className` controls sizing + aspect ratio so callers compose the grid
// without needing to know the internals.
function Photo({
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
    <figure className={["relative overflow-hidden rounded-xl bg-ink/5", className].join(" ")}>
      <img
        src={src}
        alt={alt}
        style={PHOTO_FILTER}
        className="absolute inset-0 h-full w-full object-cover"
      />
      <figcaption
        className={[
          "absolute inset-x-0 bottom-0 px-3 py-2",
          "bg-gradient-to-t from-ink/75 via-ink/30 to-transparent",
          "text-[11.5px] italic text-paper/90 leading-snug",
        ].join(" ")}
      >
        {caption}
      </figcaption>
    </figure>
  );
}

// One row of the requirements card: icon tile + title + body.
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
