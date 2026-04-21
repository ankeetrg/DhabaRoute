import type { Metadata } from "next";
import Link from "next/link";

// "What is a Dhaba" — a short, warm explainer page.
//
// Voice: conversational but not casual. Short sentences. Plain words.
// The goal isn't literary — it's to make a first-time visitor feel at
// home and understand why these places matter. Photos do the mood work
// so the copy can stay simple.
//
// Structure follows the editorial brief:
//   1. Opening hook (feeling, not definition)
//   2. What is a dhaba (plain answer)
//   3. Roots in road culture
//   4. The experience
//   5. From India to North America
//   6. Why it matters
//   7. Close

export const metadata: Metadata = {
  title: "What is a Dhaba?",
  description:
    "A dhaba is a roadside kitchen — simple food, fresh chai, and a warm welcome. Born on India's Grand Trunk Road, now found along highways across the US and Canada.",
};

// ── Photos ─────────────────────────────────────────────────────────────
// Unsplash short-IDs picked from candid documentary searches. One place
// to swap if any image goes stale. `U()` keeps the URL construction
// consistent across tiles.
const U = (id: string, size: string) =>
  `https://source.unsplash.com/${id}/${size}`;

const IMG = {
  hero:       U("_-luqYQSnTA", "1800x1000"),  // warm night street stall
  tawa:       U("bKrLCNjS_oQ", "1600x1000"),  // cook on a wide tawa
  truck:      U("d_su8Ugdmj0", "1600x1000"),  // hand-painted Punjabi truck
  chai:       U("hfdncZdKbWI", "1000x1200"),  // vendor pouring chai
  cart:       U("yOIHawAsRqA", "1000x1200"),  // people at a food cart
  usHighway:  U("iscEFQJzJiM", "2000x1100"),  // empty US interstate at sunset
};

// Shared look for every photo — warm, slightly faded, documentary.
// Kept as a plain object so the filter travels inline with each <img>.
const PHOTO_FILTER = {
  filter: "saturate(0.65) contrast(1.12) brightness(0.97)",
};

export default function WhatIsADhabaPage() {
  return (
    <article className="pb-20">
      {/* ───────────────────────────────────────────────────────────── */}
      {/* 1. OPENING — feeling first. No definition yet.                */}
      {/* ───────────────────────────────────────────────────────────── */}
      <section className="relative w-full overflow-hidden bg-ink">
        <div className="relative aspect-[16/10] sm:aspect-[21/9] w-full">
          <img
            src={IMG.hero}
            alt="A roadside kitchen lit up after dark, steam rising from the pans."
            style={PHOTO_FILTER}
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div
            aria-hidden
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(to bottom, rgba(17,17,17,0.15) 0%, rgba(17,17,17,0.35) 55%, rgba(17,17,17,0.82) 100%)",
            }}
          />
          <div className="absolute inset-0 flex items-end">
            <div className="container-page pb-10 sm:pb-16">
              <p className="text-[11px] sm:text-[12px] font-semibold uppercase tracking-[0.18em] text-clay-200">
                A place to pause
              </p>
              <h1 className="mt-3 max-w-3xl text-[34px] sm:text-5xl md:text-[60px] leading-[1.02] tracking-tight font-semibold text-paper">
                What is a Dhaba?
              </h1>
              <p className="mt-4 max-w-xl text-[15px] sm:text-[17px] text-paper/85 leading-[1.55]">
                A long drive. A quiet highway. A stop that feels like home.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 2. WHAT IS A DHABA — plain answer, one short section.         */}
      {/* ───────────────────────────────────────────────────────────── */}
      <section className="bg-paper-soft border-b border-paper-warm">
        <div className="container-page max-w-3xl py-10 sm:py-20">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-clay-600">
            The short answer
          </p>
          <h2 className="mt-2 text-[26px] sm:text-[32px] leading-[1.15] tracking-tight font-semibold text-ink">
            A dhaba is a roadside restaurant.
          </h2>
          <p className="mt-5 text-[16.5px] sm:text-[17.5px] leading-[1.6] text-ink-soft">
            You&rsquo;ll find one where the highway slows down.
          </p>
          <p className="mt-2.5 text-[16.5px] sm:text-[17.5px] leading-[1.6] text-ink-soft">
            Next to a truck stop. A fuel plaza. A small town just off an exit.
          </p>
          <p className="mt-5 text-[16.5px] sm:text-[17.5px] leading-[1.6] text-ink-soft">
            Fresh food. Generous portions. A welcome that&rsquo;s part of the meal.
          </p>
        </div>
      </section>

      {/* Photo break — cook on the tawa. No caption; the image speaks. */}
      <section className="container-page mt-14 sm:mt-20">
        <figure className="relative overflow-hidden rounded-2xl">
          <img
            src={IMG.tawa}
            alt="A cook flipping roti on a wide tawa over open flame."
            style={PHOTO_FILTER}
            className="block w-full h-auto aspect-[16/9] object-cover"
          />
        </figure>
      </section>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 3. ROOTS IN ROAD CULTURE — Grand Trunk Road, why drivers.     */}
      {/* ───────────────────────────────────────────────────────────── */}
      <section className="container-page max-w-3xl mt-12 sm:mt-24">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-clay-600">
          Roots
        </p>
        <h2 className="mt-2 text-[24px] sm:text-[30px] leading-[1.15] tracking-tight font-semibold text-ink">
          Built along the Grand Trunk Road
        </h2>

        <p className="mt-5 text-[16.5px] leading-[1.65] text-ink-soft">
          Dhabas grew up along the Grand Trunk Road — a thousand miles of
          highway across northern India.
        </p>
        <p className="mt-5 text-[16.5px] leading-[1.65] text-ink-soft">
          Built for truck drivers. A hot meal. Chai. A few quiet minutes
          before the next leg.
        </p>
        <p className="mt-5 text-[16.5px] leading-[1.65] text-ink-soft">
          Over time, they became part of the journey itself — not just a
          place to eat, but a reason to stop.
        </p>
      </section>

      {/* Photo break — painted truck. Connects road culture + aesthetic. */}
      <section className="container-page mt-12 sm:mt-16">
        <figure className="relative overflow-hidden rounded-2xl">
          <img
            src={IMG.truck}
            alt="A brightly painted Punjabi freight truck on a rural road."
            style={PHOTO_FILTER}
            className="block w-full h-auto aspect-[16/9] object-cover"
          />
        </figure>
      </section>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 4. THE EXPERIENCE — what makes a dhaba feel different.        */}
      {/* ───────────────────────────────────────────────────────────── */}
      <section className="container-page max-w-3xl mt-12 sm:mt-24">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-clay-600">
          The experience
        </p>
        <h2 className="mt-2 text-[24px] sm:text-[30px] leading-[1.15] tracking-tight font-semibold text-ink">
          Fresh food, no pretense
        </h2>

        <p className="mt-5 text-[16.5px] leading-[1.65] text-ink-soft">
          Food cooked the same day. Hot roti off the tawa. Dal simmering
          since morning. Chai from a pot that never empties.
        </p>
        <p className="mt-5 text-[16.5px] leading-[1.65] text-ink-soft">
          Plates are heavy. Prices are fair. Nobody rushes you out.
        </p>
        <p className="mt-5 text-[17px] leading-[1.5] text-ink font-medium">
          A dhaba is a place to pause. Not just a place to eat.
        </p>

        {/* Small 2-photo grid — chai + cart, side by side. */}
        <div className="mt-8 sm:mt-10 grid grid-cols-2 gap-3 sm:gap-4">
          <figure className="relative overflow-hidden rounded-xl aspect-[4/5]">
            <img
              src={IMG.chai}
              alt="A vendor pouring chai from height into small cups."
              style={PHOTO_FILTER}
              className="absolute inset-0 h-full w-full object-cover"
            />
          </figure>
          <figure className="relative overflow-hidden rounded-xl aspect-[4/5]">
            <img
              src={IMG.cart}
              alt="People gathered around a roadside food cart."
              style={PHOTO_FILTER}
              className="absolute inset-0 h-full w-full object-cover"
            />
          </figure>
        </div>
      </section>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 5. FROM INDIA TO NORTH AMERICA — the bridge.                  */}
      {/* ───────────────────────────────────────────────────────────── */}
      <section className="container-page max-w-3xl mt-12 sm:mt-24">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-clay-600">
          The route moved
        </p>
        <h2 className="mt-2 text-[24px] sm:text-[30px] leading-[1.15] tracking-tight font-semibold text-ink">
          From India to North America
        </h2>

        <p className="mt-5 text-[16.5px] leading-[1.65] text-ink-soft">
          Punjabi truckers brought it with them to North America.
        </p>
        <p className="mt-5 text-[16.5px] leading-[1.65] text-ink-soft">
          Today you&rsquo;ll find them along I-40, I-5, the 401, and
          plenty of stretches in between.
        </p>
        <p className="mt-2.5 text-[16.5px] leading-[1.65] text-ink-soft">
          At truck stops. In strip malls. Inside gurdwaras that stay open late.
        </p>
        <p className="mt-5 text-[16.5px] leading-[1.65] text-ink-soft">
          The menu is familiar. The welcome is the same.
        </p>
        <p className="mt-5 text-[16.5px] leading-[1.65] text-ink-soft">
          Most don&rsquo;t have websites. Many aren&rsquo;t on any map.
        </p>
        <p className="mt-2.5 text-[16.5px] leading-[1.65] text-ink-soft">
          DhabaRoute is how you find them.
        </p>
      </section>

      {/* Full-bleed US highway — the visual handoff from India to here. */}
      <div className="mt-12 sm:mt-16 w-full overflow-hidden bg-ink">
        <img
          src={IMG.usHighway}
          alt="An empty American interstate at sunset, stretching toward the horizon."
          style={PHOTO_FILTER}
          className="block w-full h-auto aspect-[21/9] object-cover"
        />
      </div>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 6. WHY IT MATTERS — hospitality, drivers, culture.            */}
      {/* ───────────────────────────────────────────────────────────── */}
      <section className="container-page max-w-3xl mt-12 sm:mt-24">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-clay-600">
          Why it matters
        </p>
        <h2 className="mt-2 text-[24px] sm:text-[30px] leading-[1.15] tracking-tight font-semibold text-ink">
          More than a meal
        </h2>

        <p className="mt-5 text-[16.5px] leading-[1.65] text-ink-soft">
          A dhaba is everyday hospitality.
        </p>
        <p className="mt-2.5 text-[16.5px] leading-[1.65] text-ink-soft">
          It looks after drivers. It keeps a piece of home close to the road.
        </p>
        <p className="mt-5 text-[16.5px] leading-[1.65] text-ink-soft">
          A tradition worth preserving — and worth sharing.
        </p>
      </section>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 7. CLOSE — simple, inviting, one action.                      */}
      {/* ───────────────────────────────────────────────────────────── */}
      <section className="container-page mt-16 sm:mt-20">
        <div className="max-w-2xl rounded-2xl bg-paper-soft border border-paper-warm p-6 sm:p-8">
          <h2 className="text-[22px] sm:text-[26px] leading-[1.2] tracking-tight font-semibold text-ink">
            A place to stop, eat, and feel at home.
          </h2>
          <p className="mt-3 text-[15.5px] leading-[1.6] text-ink-soft">
            Whether you&rsquo;re hauling cross-country or just passing through,
            there&rsquo;s one nearby.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/"
              className={[
                "inline-flex items-center justify-center gap-2 h-12 px-6 rounded-xl",
                "bg-clay-500 text-white text-[14px] font-semibold tracking-[-0.005em]",
                "shadow-cta hover:bg-clay-600 active:scale-[0.99] transition",
              ].join(" ")}
            >
              Find a dhaba near you
              <svg aria-hidden viewBox="0 0 12 12" className="w-3 h-3 flex-none opacity-90">
                <path
                  d="M1 6h10M7 2l4 4-4 4"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                />
              </svg>
            </Link>
            <Link
              href="/submit"
              className={[
                "inline-flex items-center justify-center h-12 px-5 rounded-xl",
                "bg-white border border-paper-warm text-ink-soft text-[14px] font-medium",
                "hover:border-clay-300 hover:text-ink active:scale-[0.99] transition",
              ].join(" ")}
            >
              Know one we&rsquo;re missing?
            </Link>
          </div>
        </div>
      </section>
    </article>
  );
}
