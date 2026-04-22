import type { Metadata } from "next";
import Link from "next/link";

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

function SubmitForm() {
  return (
    <form
      action="https://formspree.io/f/mgornaje"
      method="POST"
      className="mt-8 rounded-2xl bg-white border border-paper-warm p-6 sm:p-8 shadow-card space-y-5"
    >
      {/* Formspree routing — _replyto sets the destination inbox for the
          submission email, _subject sets the subject line. These are
          submitted as hidden inputs rather than form config so the repo
          contains the routing and it's easy to audit. _next redirects the
          user back here with ?submitted=true so we can show a success banner. */}
      <input type="hidden" name="_replyto" value="dhabaroute@gmail.com" />
      <input type="hidden" name="_subject" value="New Dhaba Submission — DhabaRoute" />
      <input type="hidden" name="_next" value="https://dhabaroute.com/submit?submitted=true" />

      <Field
        id="dhaba-name"
        name="name"
        label="Dhaba name"
        placeholder="e.g. Punjabi Dhaba, Indian Kitchen…"
        required
      />
      <Field
        id="maps-url"
        name="maps_url"
        label="Google Maps link"
        placeholder="https://maps.google.com/…"
        type="url"
        hint="Open the place in Google Maps and paste the URL"
      />
      <Field
        id="route-hint"
        name="route_hint"
        label="Highway / route"
        placeholder="e.g. I-40 westbound, Exit 53"
        hint="Helps drivers find it without GPS"
      />
      <div>
        <label
          htmlFor="notes"
          className="block text-[12px] font-semibold uppercase tracking-[0.07em] text-ink-muted mb-1.5"
        >
          Driver notes <span className="normal-case font-normal">(optional)</span>
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={3}
          placeholder="Truck parking, open 24h, best dish, anything useful…"
          className="w-full rounded-xl border border-paper-warm bg-paper px-4 py-3 text-[14px] text-ink placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-clay-400 resize-none"
        />
      </div>
      <Field
        id="submitter"
        name="submitted_by"
        label="Your name or handle"
        placeholder="Optional — we'll credit you if you want"
      />

      <button
        type="submit"
        className="w-full h-12 rounded-xl bg-clay-500 text-white text-[14px] font-semibold tracking-[-0.005em] shadow-cta hover:bg-clay-600 active:scale-[0.99] transition"
      >
        Submit for review
      </button>
    </form>
  );
}

function Field({
  id,
  name,
  label,
  placeholder,
  type = "text",
  hint,
  required,
}: {
  id: string;
  name: string;
  label: string;
  placeholder?: string;
  type?: string;
  hint?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label
        htmlFor={id}
        className="block text-[12px] font-semibold uppercase tracking-[0.07em] text-ink-muted mb-1.5"
      >
        {label}{" "}
        {required ? (
          <span className="text-clay-500">*</span>
        ) : (
          <span className="normal-case font-normal">(optional)</span>
        )}
      </label>
      {hint && (
        <p className="text-[12px] text-ink-muted mb-1.5">{hint}</p>
      )}
      <input
        id={id}
        name={name}
        type={type}
        placeholder={placeholder}
        required={required}
        className="w-full rounded-xl border border-paper-warm bg-paper px-4 py-3 text-[14px] text-ink placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-clay-400"
      />
    </div>
  );
}
