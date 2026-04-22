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
// All from Wikimedia Commons (freely licensed). Verified with curl --head.
// To swap: get the direct upload.wikimedia.org URL from the file's Commons page.
const IMG = {
  // Cook silhouetted in dhaba doorway, Palampur — Hindi signage, mountains beyond
  hero:      "https://upload.wikimedia.org/wikipedia/commons/6/6c/The_Dhaba_of_Palampur.jpg",
  // Bharawan Da Dhaba, Amritsar — est. 1912, bold signage, auto-rickshaws outside
  tawa:      "https://upload.wikimedia.org/wikipedia/commons/4/41/Street_with_Vegetarian_Dhaba_Restaurant%2C_Amritsar%2C_Punjab%2C_India_-_September_2014.jpg",
  // Flour-dusted roti work surface — rolling pin, dough, fresh rotis on steel plate
  chai:      "https://upload.wikimedia.org/wikipedia/commons/4/4a/Tandoor_rotis.jpg",
  // Small roadside stall, Varanasi — woman cooking, man eating outside, raw and candid
  cart:      "https://upload.wikimedia.org/wikipedia/commons/0/0e/Varanasi_673_-_dhaba_%2833262795054%29.jpg",
  // Haveli Dhaba, Maujgarh, Punjab — "Traditional Punjabi Veg. Restaurant", outdoor seating
  truck:     "https://upload.wikimedia.org/wikipedia/commons/2/26/Photograph_of_the_Sartaj_Haveli_dhaba_in_Maujgarh%2C_Punjab%2C_India%2C_8_April_2023.jpg",
  // Empty American interstate at sunset — visual bridge from India to here
  usHighway: "https://images.unsplash.com/photo-1547234935-80c7145ec969?w=2000&q=80",
};

// Applied to every photo. Warm, slightly faded, documentary.
const PHOTO_FILTER = {
  filter: "saturate(0.72) contrast(1.08) brightness(0.95)",
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
            alt="A cook silhouetted in the open doorway of a dhaba in Palampur — Hindi signage overhead, mountains visible beyond."
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
            A dhaba is a roadside kitchen.
          </h2>
          <p className="mt-5 text-[16.5px] sm:text-[17px] leading-[1.72] text-ink-soft">
            Dal that&rsquo;s been cooking since morning. Roti off the tawa.
            Chai in a steel glass. Nobody&rsquo;s plating anything.
          </p>
          <p className="mt-4 text-[16.5px] sm:text-[17px] leading-[1.72] text-ink-soft">
            You sit down, you eat, you get back on the road.
          </p>
        </div>
      </section>

      {/* Photo — cook on the tawa */}
      <section className="container-page mt-14 sm:mt-20">
        <figure className="relative overflow-hidden rounded-2xl">
          <img
            src={IMG.tawa}
            alt="Bharawan Da Dhaba in Amritsar — established 1912, bold red and white signage on the building facade, auto-rickshaws parked outside."
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
          They started along the Grand Trunk Road in northern India —
          built for truck drivers who needed a hot meal and somewhere
          to rest.
        </p>
        <p className="mt-4 text-[16.5px] leading-[1.72] text-ink-soft">
          Simple setup. A tandoor in the corner, a few plastic chairs,
          a cook who&rsquo;s had the same menu for twenty years because
          it doesn&rsquo;t need to change.
        </p>
      </section>

      {/* Photo — painted truck */}
      <section className="container-page mt-12 sm:mt-16">
        <figure className="relative overflow-hidden rounded-2xl">
          <img
            src={IMG.truck}
            alt="Haveli Dhaba in Maujgarh, Punjab — red banner reading 'The Traditional Punjabi Veg. Restaurant', canopy seating in the foreground."
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
          I grew up eating at dhabas in India. When I moved to the US
          and started driving cross-country, I got a craving for that
          food. Not restaurant Indian food — dhaba food. I spent hours
          on Google trying to find them. They&rsquo;re out there, but
          there was no map, no list, nothing.
        </p>
        <p className="mt-4 text-[16.5px] leading-[1.72] text-ink-soft">
          Eventually I found one off an interstate. Hand-painted sign.
          Trucks parked outside. I walked in and it smelled exactly
          right. Steel plates, plastic chairs, a guy behind the counter
          who didn&rsquo;t need to ask what I wanted. For a while I
          wasn&rsquo;t on a road trip in America. I was just home.
        </p>
        <p className="mt-4 text-[17px] leading-[1.5] text-ink font-medium">
          A dhaba is a place to pause. Not just a place to eat.
        </p>

        {/* 2-photo grid — chai + people at stall */}
        <div className="mt-8 sm:mt-10 grid grid-cols-2 gap-3 sm:gap-4">
          <figure className="relative overflow-hidden rounded-xl aspect-[4/5]">
            <img
              src={IMG.chai}
              alt="A flour-dusted roti-making surface at a dhaba — rolling pin, raw dough, and fresh rotis resting on a steel plate."
              style={PHOTO_FILTER}
              className="absolute inset-0 h-full w-full object-cover"
            />
          </figure>
          <figure className="relative overflow-hidden rounded-xl aspect-[4/5]">
            <img
              src={IMG.cart}
              alt="A small roadside dhaba stall in Varanasi — a woman cooking behind the counter, a man seated at a table outside."
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
          Punjabi truckers brought dhaba culture to the US. You&rsquo;ll
          find them off I-40, I-5, I-80 — tucked into travel centers,
          strip malls, truck stops. Most don&rsquo;t have websites. Word
          spreads through WhatsApp groups and packed parking lots at 2am.
        </p>
        <p className="mt-4 text-[16.5px] leading-[1.72] text-ink-soft">
          I&rsquo;ve been to several of the dhabas on this list
          personally. I built DhabaRoute because no directory like this
          existed. These places deserve to be found.
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
