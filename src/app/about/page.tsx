import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About",
  description:
    "Learn what DhabaRoute is, who it is for, and how listings are improved over time.",
};

export default function AboutPage() {
  return (
    <main className="mx-auto w-full px-5 pt-10 pb-[72px] sm:px-8" style={{ maxWidth: 780 }}>
      <p className="font-ui text-[10.5px] font-bold uppercase tracking-[0.18em] text-ink-muted">
        About
      </p>
      <h1 className="mt-3 font-display text-[clamp(30px,4vw,44px)] font-extrabold leading-[1.08] text-ink">
        DhabaRoute helps people find dhaba-style food stops on the road.
      </h1>
      <p className="mt-5 font-ui text-[16.5px] leading-[1.78] text-ink-soft">
        DhabaRoute is a practical directory for Indian and Punjabi dhaba-style
        restaurants, truck-stop eateries, and roadside food stops across the
        U.S. It is built for road-trippers, truckers, Indian food lovers, and
        families who want a better answer than scrolling a generic restaurant
        app from the passenger seat.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <InfoCard title="Built for quick decisions">
          Listings focus on the things travelers actually need: route context,
          address, phone, hours when available, parking notes, and directions.
        </InfoCard>
        <InfoCard title="Improving over time">
          DhabaRoute is a living directory. Owners and visitors can submit new
          places or suggest corrections, and updates are reviewed before being
          added.
        </InfoCard>
      </div>

      <section className="mt-10 rounded-2xl border border-paper-warm bg-white p-5 shadow-card sm:p-7">
        <h2 className="font-display text-[22px] font-bold text-ink">A note on trust</h2>
        <p className="mt-3 font-ui text-[15px] leading-[1.75] text-ink-soft">
          Restaurant details can change quickly. Hours, menus, prices, photos,
          and parking information should be checked with the restaurant before
          making a detour. DhabaRoute is here to make discovery easier, not to
          replace a final call or map check.
        </p>
      </section>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Link
          href="/submit"
          className="inline-flex h-11 items-center justify-center rounded-xl bg-clay-500 px-5 text-[14px] font-semibold text-white shadow-cta transition hover:bg-clay-600"
        >
          Submit a dhaba
        </Link>
        <Link
          href="/update-listing"
          className="inline-flex h-11 items-center justify-center rounded-xl border border-paper-warm bg-white px-5 text-[14px] font-semibold text-ink-soft transition hover:border-clay-300 hover:text-accent"
        >
          Update a listing
        </Link>
      </div>
    </main>
  );
}

function InfoCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-paper-warm bg-white p-5 shadow-card">
      <h2 className="font-ui text-[13px] font-bold uppercase tracking-[0.08em] text-clay-600">
        {title}
      </h2>
      <p className="mt-3 font-ui text-[14.5px] leading-[1.7] text-ink-soft">
        {children}
      </p>
    </section>
  );
}
