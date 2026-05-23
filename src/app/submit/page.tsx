import type { Metadata } from "next";
import Link from "next/link";
import { SubmitForm } from "@/components/SubmitForm";

export const metadata: Metadata = {
  title: "Submit a Dhaba",
  description:
    "Submit a missing dhaba-style restaurant or roadside Indian food stop for review on DhabaRoute.",
};

export default function SubmitPage() {
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
          Help fellow travelers find useful Indian and Punjabi food stops. Share
          what you know, including location, menu links, parking notes, and why
          the place belongs on DhabaRoute.
        </p>
        <p className="mt-3 text-[13px] text-ink-muted leading-relaxed">
          Submissions are reviewed before being added.
        </p>
      </header>

      <SubmitForm />

      <p className="mt-8 text-[13px] text-ink-muted">
        Spot an error on an existing listing?{" "}
        <Link
          href="/update-listing"
          className="underline underline-offset-4 hover:text-ink"
        >
          Send a listing update.
        </Link>
      </p>
    </div>
  );
}
