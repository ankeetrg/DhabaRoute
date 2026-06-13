/**
 * /for-owners — Owner-facing landing page.
 *
 * Explains the value of claiming a listing on DhabaRoute.
 * Linked from:
 *   - Outreach messages ("visit dhabaroute.com/for-owners")
 *   - About page "Learn more →"
 *   - Footer (add when ready)
 *
 * Intentionally short and action-oriented — owners arriving from a
 * WhatsApp link are on mobile and won't read walls of text.
 */

import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "For Dhaba Owners | DhabaRoute",
  description:
    "Own or manage a dhaba? Claim your free listing on DhabaRoute to update hours, menus, and photos — and get found by truckers and road travelers.",
};

export default async function ForOwnersPage({
  searchParams,
}: {
  searchParams: Promise<{ ref?: string }>;
}) {
  const { ref } = await searchParams;
  const claimHref = ref ? `/claim?ref=${encodeURIComponent(ref)}` : "/claim";

  return (
    <main className="mx-auto w-full px-5 pt-10 pb-[72px] sm:px-8" style={{ maxWidth: 780 }}>

      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <p className="inline-flex items-center gap-1.5 font-ui text-[11px] font-semibold uppercase tracking-[0.08em]" style={{ color: "#1a6b47" }}>
        <span aria-hidden className="h-1 w-1 rounded-full bg-current" />
        For dhaba owners
      </p>
      <h1 className="mt-3 font-display text-[clamp(28px,4vw,42px)] font-extrabold leading-[1.08] text-ink">
        Truckers are finding your dhaba here. Make sure the info is right.
      </h1>
      <p className="mt-4 font-ui text-[16px] leading-[1.78] text-ink-soft">
        DhabaRoute lists dhaba-style Indian food stops across the U.S. for
        long-haul drivers and road travelers. If your restaurant is listed,
        claiming it takes 2 minutes and keeps customers showing up with the
        right expectations.
      </p>

      <Link
        href={claimHref}
        className="mt-6 inline-flex h-12 items-center justify-center rounded-xl px-7 text-[15px] font-semibold text-white shadow-cta transition hover:opacity-90"
        style={{ background: "#df6028" }}
      >
        Claim your listing — it&rsquo;s free
      </Link>

      {/* ── What you get ─────────────────────────────────────────────── */}
      <section className="mt-12">
        <h2 className="font-display text-[22px] font-bold text-ink">
          What you get when you claim
        </h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          {BENEFITS.map(({ title, body }) => (
            <div
              key={title}
              className="rounded-2xl border border-paper-warm bg-white p-5 shadow-card"
            >
              <p className="font-ui text-[13px] font-bold uppercase tracking-[0.07em] text-clay-600">
                {title}
              </p>
              <p className="mt-2 font-ui text-[14px] leading-[1.7] text-ink-soft">
                {body}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────────────────── */}
      <section className="mt-12">
        <h2 className="font-display text-[22px] font-bold text-ink">
          How it works
        </h2>
        <ol className="mt-5 space-y-5">
          {STEPS.map(({ n, title, body }) => (
            <li key={n} className="flex gap-4">
              <span
                className="flex h-7 w-7 flex-none items-center justify-center rounded-full text-[13px] font-bold text-white"
                style={{ background: "#df6028" }}
                aria-hidden
              >
                {n}
              </span>
              <div>
                <p className="font-ui text-[14.5px] font-semibold text-ink">
                  {title}
                </p>
                <p className="mt-1 font-ui text-[13.5px] leading-[1.65] text-ink-soft">
                  {body}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* ── Pricing ──────────────────────────────────────────────────── */}
      <section className="mt-12">
        <h2 className="font-display text-[22px] font-bold text-ink">
          Pricing
        </h2>
        <p className="mt-2 font-ui text-[15px] text-ink-soft">
          Claiming and maintaining your listing is always free.
        </p>
        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          {TIERS.map(({ name, price, features, highlight }) => (
            <div
              key={name}
              className="rounded-2xl border p-5"
              style={{
                borderColor: highlight ? "#1a6b47" : undefined,
                background: highlight ? "rgba(26,107,71,0.04)" : "white",
              }}
            >
              {highlight ? (
                <p className="mb-2 inline-block rounded-full px-2.5 py-0.5 text-[11px] font-semibold text-white" style={{ background: "#1a6b47" }}>
                  Popular
                </p>
              ) : null}
              <p className="font-ui text-[13px] font-bold uppercase tracking-[0.07em] text-ink-muted">
                {name}
              </p>
              <p className="mt-1 font-display text-[26px] font-extrabold text-ink">
                {price}
              </p>
              <ul className="mt-3 space-y-1.5">
                {features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-[13px] text-ink-soft">
                    <span className="mt-0.5 flex-none font-bold" style={{ color: "#1a6b47" }}>✓</span>
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────────── */}
      <section className="mt-12 rounded-2xl border border-paper-warm bg-white p-6 text-center shadow-card sm:p-8">
        <h2 className="font-display text-[22px] font-bold text-ink">
          Ready to claim your listing?
        </h2>
        <p className="mt-2 font-ui text-[14.5px] text-ink-soft">
          Takes 2 minutes. We verify by phone and update your listing within
          48 hours.
        </p>
        <Link
          href={claimHref}
          className="mt-5 inline-flex h-12 items-center justify-center rounded-xl px-8 text-[15px] font-semibold text-white shadow-cta transition hover:opacity-90"
          style={{ background: "#df6028" }}
        >
          Claim your listing →
        </Link>
        <p className="mt-3 font-ui text-[12px] text-ink-muted">
          Questions?{" "}
          <Link href="/contact" className="underline underline-offset-4 hover:text-ink">
            Contact us
          </Link>
          .
        </p>
      </section>

    </main>
  );
}

// ── Content ───────────────────────────────────────────────────────────────

const BENEFITS = [
  {
    title: "Verified badge",
    body: "A verified checkmark on your listing shows travelers your info is owner-confirmed and up to date.",
  },
  {
    title: "Better placement",
    body: "Verified listings rank above unclaimed stops on route and state pages — more visibility for drivers passing through.",
  },
  {
    title: "Control your info",
    body: "Update hours, menus, photos, and specials directly. No more waiting for a stranger to submit a correction.",
  },
  {
    title: "Reach truckers",
    body: "DhabaRoute is built specifically for long-haul drivers and highway travelers looking for Indian food on the road.",
  },
];

const STEPS = [
  {
    n: 1,
    title: "Find your listing and click Claim",
    body: 'Search for your dhaba on DhabaRoute, open your listing, and tap "Claim this listing" at the bottom of the page.',
  },
  {
    n: 2,
    title: "Fill in your details",
    body: "Takes 2 minutes. We collect your name, phone, and email so we can verify you're the owner.",
  },
  {
    n: 3,
    title: "We verify by phone",
    body: "We call within 24 hours to confirm ownership. Once verified, your listing is marked and you can submit updates anytime.",
  },
];

const TIERS = [
  {
    name: "Free",
    price: "$0",
    highlight: false,
    features: [
      "Listed on DhabaRoute",
      "Directions & phone on listing",
      "Community corrections accepted",
    ],
  },
  {
    name: "Verified",
    price: "$19/mo",
    highlight: true,
    features: [
      "Verified owner badge",
      "Rank above unclaimed listings",
      "Update hours, menu & photos",
      "Specials shown on listing",
    ],
  },
  {
    name: "Featured",
    price: "$49/mo",
    highlight: false,
    features: [
      "Everything in Verified",
      "Pinned at top of route pages",
      "Deal callout on listing card",
      "Monthly view report",
    ],
  },
];
