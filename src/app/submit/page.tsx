import type { Metadata } from "next";
import Link from "next/link";
import { SubmitForm } from "@/components/SubmitForm";

export const metadata: Metadata = {
  title: "Submit a Dhaba",
  description:
    "Know a dhaba we're missing? Share the spot — name, location, and anything a driver should know.",
};

export default async function SubmitPage({
  searchParams,
}: {
  searchParams: Promise<{ submitted?: string }>;
}) {
  const { submitted } = await searchParams;

  return (
    <div className="container-page pt-8 pb-20 max-w-2xl">
      <nav aria-label="Breadcrumb" className="text-[13px] text-ink-muted">
        <Link href="/" className="hover:text-ink underline-offset-4 hover:underline">
          All dhabas
        </Link>
        <span aria-hidden className="mx-2 text-paper-warm">·</span>
        <span className="text-ink-soft">Submit a Dhaba</span>
      </nav>

      <header className="mt-6">
        <p className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-clay-600">
          <span aria-hidden className="w-1 h-1 rounded-full bg-clay-500" />
          Community
        </p>
        <h1 className="mt-2 text-[28px] sm:text-4xl leading-tight font-semibold tracking-tight text-ink">
          Know a dhaba we&apos;re missing?
        </h1>
        <p className="mt-3 text-[15px] text-ink-soft leading-relaxed">
          Help fellow drivers find their next meal. Drop us the name, a Google Maps link,
          and anything worth knowing — parking, specialties, truck access. We review every
          submission before it goes live.
        </p>
      </header>

      {submitted === "true" ? (
        <div className="rounded-xl bg-leaf-soft border border-leaf-line text-leaf px-4 py-3 text-[14px] mt-6">
          Thanks — we&rsquo;ll review your submission and it&rsquo;ll go live within a day or two.
        </div>
      ) : (
        <SubmitForm />
      )}

      <p className="mt-8 text-[13px] text-ink-muted">
        Spot an error on an existing listing?{" "}
        <a
          href="mailto:dhabaroute@gmail.com?subject=DhabaRoute correction"
          className="underline underline-offset-4 hover:text-ink"
        >
          Email us directly.
        </a>
      </p>
    </div>
  );
}
