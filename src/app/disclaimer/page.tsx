import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Disclaimer",
  description:
    "Important notes about restaurant information, submissions, photos, maps, and DhabaRoute's independent directory status.",
};

export default function DisclaimerPage() {
  return (
    <main className="mx-auto w-full px-5 pt-10 pb-[72px] sm:px-8" style={{ maxWidth: 760 }}>
      <p className="font-ui text-[10.5px] font-bold uppercase tracking-[0.18em] text-ink-muted">
        Disclaimer
      </p>
      <h1 className="mt-3 font-display text-[clamp(30px,4vw,42px)] font-extrabold leading-[1.08] text-ink">
        Check details before you make the detour.
      </h1>
      <p className="mt-5 font-ui text-[16px] leading-[1.78] text-ink-soft">
        DhabaRoute is an independent directory. It helps travelers discover
        dhaba-style food stops, but restaurant details can change at any time.
      </p>

      <div className="mt-8 space-y-4">
        <Section title="Restaurant details can change">
          Hours, menus, prices, ownership, parking, restroom access, and
          availability can change without notice. Always confirm important
          details with the restaurant before visiting.
        </Section>
        <Section title="Independent directory">
          DhabaRoute is not affiliated with listed restaurants unless clearly
          stated. A listing does not mean a restaurant has sponsored,
          endorsed, or approved the page.
        </Section>
        <Section title="Submissions and updates">
          Community and owner submissions are reviewed, but updates may not
          appear immediately. DhabaRoute may choose what to publish, edit, or
          remove to keep listings useful and respectful.
        </Section>
        <Section title="Photos, maps, and business info">
          Photos, maps, and business details may come from public sources,
          restaurant owners, visitors, or other submitted information when
          available. Attribution is shown where practical.
        </Section>
      </div>

      <Link
        href="/contact"
        className="mt-8 inline-flex h-11 items-center justify-center rounded-xl border border-paper-warm bg-white px-5 text-[14px] font-semibold text-ink-soft transition hover:border-clay-300 hover:text-accent"
      >
        Contact DhabaRoute
      </Link>
    </main>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-paper-warm bg-white p-5 shadow-card sm:p-6">
      <h2 className="font-ui text-[13px] font-bold uppercase tracking-[0.08em] text-clay-600">
        {title}
      </h2>
      <p className="mt-3 font-ui text-[14.5px] leading-[1.72] text-ink-soft">
        {children}
      </p>
    </section>
  );
}
