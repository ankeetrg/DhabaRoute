/**
 * /claim — Owner claim page for DhabaRoute listings.
 *
 * Entry points:
 *   1. Detail page CTA: "Is this your dhaba? → Claim this listing"
 *      Links to /claim?dhaba={slug} — pre-fills the dhaba name and locks it.
 *   2. Direct navigation (/claim) — shows a free-text dhaba name field.
 *
 * On submit, sends to Formspree (NEXT_PUBLIC_FORMSPREE_CLAIM_URL).
 * Collected: owner name, email, phone, role, what to update, premium interest.
 * We call to verify ownership within 24 hours.
 */

import type { Metadata } from "next";
import Link from "next/link";
import { getDhabaBySlug } from "@/lib/dhabas";
import { ClaimForm } from "@/components/ClaimForm";

export const metadata: Metadata = {
  title: "Claim Your Listing | DhabaRoute",
  description:
    "Own or manage a dhaba on DhabaRoute? Claim your listing to control hours, menu, and photos — and rank above unclaimed stops.",
};

type SearchParams = Promise<{ dhaba?: string }>;

export default async function ClaimPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { dhaba: slugParam } = await searchParams;
  const dhaba = slugParam ? getDhabaBySlug(slugParam) : undefined;

  return (
    <div className="container-page max-w-2xl pt-8 pb-20">

      {/* ── Breadcrumb ───────────────────────────────────────────────── */}
      <nav aria-label="Breadcrumb" className="text-[13px] text-ink-muted">
        <Link href="/" className="underline-offset-4 hover:text-ink hover:underline">
          All dhabas
        </Link>
        <span aria-hidden className="mx-2 text-paper-warm">·</span>
        {dhaba ? (
          <>
            <Link
              href={`/dhabas/${dhaba.slug}`}
              className="underline-offset-4 hover:text-ink hover:underline"
            >
              {dhaba.title}
            </Link>
            <span aria-hidden className="mx-2 text-paper-warm">·</span>
          </>
        ) : null}
        <span className="text-ink-soft">Claim listing</span>
      </nav>

      {/* ── Header ──────────────────────────────────────────────────── */}
      <header className="mt-6">
        <p className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-clay-600">
          <span aria-hidden className="h-1 w-1 rounded-full bg-clay-500" />
          For owners
        </p>
        <h1 className="mt-2 font-display text-[28px] font-extrabold leading-tight tracking-tight text-ink sm:text-4xl">
          {dhaba ? "Is this your dhaba?" : "Claim your listing"}
        </h1>
        {dhaba ? (
          <p className="mt-1 text-[16px] font-medium text-ink-soft">
            {dhaba.title}
          </p>
        ) : null}
        <p className="mt-3 text-[15px] leading-relaxed text-ink-soft">
          Claim your listing to keep hours, menu, and photos accurate. Verified
          listings rank above unclaimed stops on every route and state page —
          and it&rsquo;s free to start.
        </p>
      </header>

      {/* ── Value props ─────────────────────────────────────────────── */}
      <ul className="mt-5 space-y-2.5" aria-label="Benefits of claiming">
        {[
          { icon: "✓", text: "Verified badge on your listing" },
          { icon: "✓", text: "Rank above unclaimed stops on route pages" },
          { icon: "✓", text: "Update hours, menu, photos, and specials" },
          { icon: "✓", text: "Free to claim — premium options available" },
        ].map(({ icon, text }) => (
          <li key={text} className="flex items-start gap-2.5 text-[13.5px] text-ink-soft">
            <span className="mt-0.5 flex-none font-bold" style={{ color: "#138808" }}>
              {icon}
            </span>
            {text}
          </li>
        ))}
      </ul>

      {/* ── Form ────────────────────────────────────────────────────── */}
      <ClaimForm
        dhabaTitle={dhaba?.title}
        dhabaSlug={dhaba?.slug}
        actionUrl={process.env.NEXT_PUBLIC_FORMSPREE_CLAIM_URL}
      />

      {/* ── Footer note ─────────────────────────────────────────────── */}
      <p className="mt-6 text-center text-[13px] text-ink-muted">
        Not the owner?{" "}
        <Link
          href="/update-listing"
          className="underline underline-offset-4 hover:text-ink"
        >
          Suggest a correction instead.
        </Link>
      </p>

    </div>
  );
}
