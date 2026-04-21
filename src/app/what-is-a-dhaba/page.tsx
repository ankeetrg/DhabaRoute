import type { Metadata } from "next";
import Link from "next/link";

// "What is a Dhaba" — a warm editorial explainer.
//
// Voice: specific and sensory. Paragraphs over bullet fragments.
// The goal is for someone who has never heard the word "dhaba" to finish
// reading and feel like they've been there — and want to find one.
//
// Photos: all verified 200 from images.unsplash.com CDN (checked with
// curl --head). Filter stack makes everything read as one consistent set.

export const metadata: Metadata = {
  title: "What is a Dhaba?",
  description:
    "A dhaba is a roadside kitchen — simple food, fresh chai, and a warm welcome. Born on India's Grand Trunk Road, now found along highways across the US and Canada.",
};

// ── Photos — verified 200 ───────────────────────────────────────────────
// All six confirmed with `curl -s -o /dev/null -w "%{http_code}"`.
// To swap: replace the photo-{id} segment; keep the ?w=...&q=80 params.
const IMG = {
  hero:      "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=1800&q=80",
  tawa:      "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=1600&q=80",
  chai:      "https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=1000&q=80",
  cart:      "https://images.unsplash.com/photo-1567337710282-00832b415979?w=1000&q=80",
  truck:     "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1600&q=80",
  usHighway: "https://images.unsplash.com/photo-1547234935-80c7145ec969?w=2000&q=80",
};

// Applied to every photo. Warm, slightly faded, documentary.
const PHOTO_FILTER = {
  filter: "saturate(0.65) contrast(1.12) brightness(0.97)",
};

export default function WhatIsADhabaPage() {
  return (
    <article className="pb-20">

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 1. OPENING — feeling first                                    */}
      {/* ───────────────────────────────────────────────────────────── */}
      <section className="relative w-full overflow-hidden bg-ink">
        <div className="relative aspect-[16/10] sm:aspect-[21/9] w-full">
          <img
            src={IMG.hero}
            alt="A roadside kitchen lit up after dark, people gathered around the stall."
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
      {/* 2. WHAT IS A DHABA                                            */}
      {/* ───────────────────────────────────────────────────────────── */}
      <section className="bg-paper-soft border-b border-paper-warm">
        <div className="container-page max-w-3xl py-10 sm:py-20">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-clay-600">
            The short answer
          </p>
          <h2 className="mt-2 text-[26px] sm:text-[32px] leading-[1.15] tracking-tight font-semibold text-ink">
            A dhaba is a roadside restaurant.
          </h2>
          <p className="mt-5 text-[16.5px] sm:text-[17px] leading-[1.72] text-ink-soft">
            You&rsquo;ll find one where the highway slows down — next to a
            truck stop, a fuel plaza, or a small town just off an exit. The
            kitchen is usually open before dawn and long after dark. The
            menu doesn&rsquo;t change much from year to year, because it
            doesn&rsquo;t need to.
          </p>
          <p className="mt-4 text-[16.5px] sm:text-[17px] leading-[1.72] text-ink-soft">
            The food is fresh — cooked that day, usually without a
            refrigerator in sight, because the best dhabas don&rsquo;t
            need one. Generous portions. Honest prices. And a welcome
            that comes standard, whoever you are.
          </p>
        </div>
      </section>

      {/* Photo — cook on the tawa */}
      <section className="container-page mt-14 sm:mt-20">
        <figure className="relative overflow-hidden rounded-2xl">
          <img
            src={IMG.tawa}
            alt="A cook flipping roti on a wide tawa over open flame, smoke rising."
            style={PHOTO_FILTER}
            className="block w-full h-auto aspect-[16/9] object-cover"
          />
        </figure>
      </section>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 3. ROOTS IN ROAD CULTURE                                      */}
      {/* ───────────────────────────────────────────────────────────── */}
      <section className="container-page max-w-3xl mt-12 sm:mt-24">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-clay-600">
          Roots
        </p>
        <h2 className="mt-2 text-[24px] sm:text-[30px] leading-[1.15] tracking-tight font-semibold text-ink">
          Built along the Grand Trunk Road
        </h2>
        <p className="mt-5 text-[16.5px] leading-[1.72] text-ink-soft">
          Dhabas grew up along the Grand Trunk Road — one of the oldest
          trade routes in the world, running more than a thousand miles
          across northern India from the Himalayas to Bangladesh. The
          road moved grain, salt, soldiers, and pilgrims for centuries.
          The dhabas moved with it, staking out the spots where truckers
          would need to stop.
        </p>
        <p className="mt-4 text-[16.5px] leading-[1.72] text-ink-soft">
          They were built around the tandoor — a clay oven sunk into the
          ground — and designed for people who had been on the road since
          before sunrise. A hot meal. Chai. Somewhere to sit for twenty
          minutes before the next leg. Over time, they became part of the
          journey itself. Not just a place to eat, but a reason to stop.
          The old rule still holds: if you want to know how good a dhaba
          is, count the trucks parked outside, not the cars.
        </p>
      </section>

      {/* Photo — painted truck */}
      <section className="container-page mt-12 sm:mt-16">
        <figure className="relative overflow-hidden rounded-2xl">
          <img
            src={IMG.truck}
            alt="A brightly hand-painted Punjabi freight truck on a rural road."
            style={PHOTO_FILTER}
            className="block w-full h-auto aspect-[16/9] object-cover"
          />
        </figure>
      </section>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 4. THE EXPERIENCE                                              */}
      {/* ───────────────────────────────────────────────────────────── */}
      <section className="container-page max-w-3xl mt-12 sm:mt-24">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-clay-600">
          The experience
        </p>
        <h2 className="mt-2 text-[24px] sm:text-[30px] leading-[1.15] tracking-tight font-semibold text-ink">
          Fresh food, no pretense
        </h2>
        <p className="mt-5 text-[16.5px] leading-[1.72] text-ink-soft">
          You smell a dhaba before you see it — charcoal smoke, cumin
          hitting hot oil, something slow-simmered that&rsquo;s been
          going since morning. The dal has been on the fire for hours.
          The roti gets slapped onto the tawa in front of you, puffs up,
          chars at the edges, and lands on your plate still hot enough
          to burn your fingers. The waiter doesn&rsquo;t write anything
          down.
        </p>
        <p className="mt-4 text-[16.5px] leading-[1.72] text-ink-soft">
          Everything arrives on a steel thali heavy enough to feel
          substantial — dal, sabzi, roti, raw onion on the side. Chai
          comes in a small cup, poured from height so it froths. Plates
          are generous. Prices are fair. Nobody&rsquo;s rushing you out.
        </p>
        <p className="mt-4 text-[17px] leading-[1.5] text-ink font-medium">
          A dhaba is a place to pause. Not just a place to eat.
        </p>

        {/* 2-photo grid — chai + people at stall */}
        <div className="mt-8 sm:mt-10 grid grid-cols-2 gap-3 sm:gap-4">
          <figure className="relative overflow-hidden rounded-xl aspect-[4/5]">
            <img
              src={IMG.chai}
              alt="Chai being poured from height into small cups, steam rising."
              style={PHOTO_FILTER}
              className="absolute inset-0 h-full w-full object-cover"
            />
          </figure>
          <figure className="relative overflow-hidden rounded-xl aspect-[4/5]">
            <img
              src={IMG.cart}
              alt="People gathered at a roadside food stall, mid-conversation."
              style={PHOTO_FILTER}
              className="absolute inset-0 h-full w-full object-cover"
            />
          </figure>
        </div>
      </section>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 5. FROM INDIA TO NORTH AMERICA                                */}
      {/* ───────────────────────────────────────────────────────────── */}
      <section className="container-page max-w-3xl mt-12 sm:mt-24">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-clay-600">
          The route moved
        </p>
        <h2 className="mt-2 text-[24px] sm:text-[30px] leading-[1.15] tracking-tight font-semibold text-ink">
          From India to North America
        </h2>
        <p className="mt-5 text-[16.5px] leading-[1.72] text-ink-soft">
          Punjabi truckers brought the dhaba with them when they came to
          drive in North America. The same community that had been hauling
          goods across the Grand Trunk Road found its way to I-5, I-40,
          the 401, and the long flat stretches in between. They brought
          the food with them — because the road was the same, even if
          the landscape had changed.
        </p>
        <p className="mt-4 text-[16.5px] leading-[1.72] text-ink-soft">
          Today you&rsquo;ll find them at truck stops, in strip malls,
          and inside gurdwaras that stay open late for anyone who walks
          in. The menu is familiar. The welcome is the same. Most
          don&rsquo;t have websites, and many aren&rsquo;t on any
          standard map. DhabaRoute is how you find them.
        </p>
      </section>

      {/* Full-bleed US highway — visual bridge from India to here */}
      <div className="mt-12 sm:mt-16 w-full overflow-hidden bg-ink">
        <img
          src={IMG.usHighway}
          alt="An empty American interstate at sunset, stretching toward the horizon."
          style={PHOTO_FILTER}
          className="block w-full h-auto aspect-[21/9] object-cover"
        />
      </div>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 6. WHY IT MATTERS                                             */}
      {/* ───────────────────────────────────────────────────────────── */}
      <section className="container-page max-w-3xl mt-12 sm:mt-24">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-clay-600">
          Why it matters
        </p>
        <h2 className="mt-2 text-[24px] sm:text-[30px] leading-[1.15] tracking-tight font-semibold text-ink">
          More than a meal
        </h2>
        <p className="mt-5 text-[16.5px] leading-[1.72] text-ink-soft">
          A dhaba is everyday hospitality — the kind that doesn&rsquo;t
          ask who you are before it feeds you. It looks after drivers
          on long hauls. It keeps a piece of home close to the road for
          people a long way from where they grew up.
        </p>
        <p className="mt-4 text-[16.5px] leading-[1.72] text-ink-soft">
          These places have been doing that across India for generations.
          Now they&rsquo;re doing it across North America. That&rsquo;s
          a tradition worth preserving — and worth sharing with anyone
          curious enough to pull off the highway.
        </p>
      </section>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 7. CLOSE                                                      */}
      {/* ───────────────────────────────────────────────────────────── */}
      <section className="container-page mt-16 sm:mt-20">
        <div className="max-w-2xl rounded-2xl bg-paper-soft border border-paper-warm p-6 sm:p-8">
          <h2 className="text-[22px] sm:text-[26px] leading-[1.2] tracking-tight font-semibold text-ink">
            A place to stop, eat, and feel at home.
          </h2>
          <p className="mt-3 text-[15.5px] leading-[1.65] text-ink-soft">
            Whether you&rsquo;re hauling cross-country or just passing
            through, there&rsquo;s one nearby. Find it.
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
