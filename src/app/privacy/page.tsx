import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "Plain-language privacy summary for DhabaRoute, including forms, analytics, ads, and correction requests.",
};

const LAST_UPDATED = "May 22, 2026";

export default function PrivacyPage() {
  return (
    <main className="mx-auto w-full px-5 pt-10 pb-[72px] font-ui sm:px-8" style={{ maxWidth: 760 }}>
      <p className="text-[10.5px] font-bold uppercase tracking-[0.18em] text-ink-muted">
        Privacy
      </p>
      <h1 className="mt-3 font-display text-[clamp(30px,4vw,42px)] font-extrabold leading-[1.08] text-ink">
        Privacy Policy
      </h1>
      <p className="mt-2 text-[13px] text-ink-muted">Last updated: {LAST_UPDATED}</p>
      <p className="mt-6 text-[16px] leading-[1.78] text-ink-soft">
        This page is a plain-language summary and may be updated as
        DhabaRoute grows. It is not formal legal advice.
      </p>

      <div className="mt-8 space-y-4">
        <Section title="Information you submit">
          DhabaRoute may collect form submissions. Depending on the form, this
          can include your name, email, message, restaurant details, listing
          corrections, menu links, parking notes, and other information you
          choose to send.
        </Section>
        <Section title="How submissions are used">
          Submissions help improve DhabaRoute listings, respond to questions,
          fix errors, and review new places. DhabaRoute does not sell submitted
          personal information.
        </Section>
        <Section title="Analytics and ads">
          DhabaRoute may use analytics in the future to understand site usage.
          DhabaRoute may also use ads in the future. If those tools are added,
          this page may be updated with more detail about the providers used.
        </Section>
        <Section title="Third-party forms">
          Contact, submission, and listing update forms may be processed by
          Formspree. Do not submit sensitive personal information through these
          forms.
        </Section>
        <Section title="Location features">
          If you use a near-me or distance feature, your browser may ask for
          location permission. DhabaRoute uses that location to sort stops in
          your browser experience; you can decline or change location
          permissions in your browser settings.
        </Section>
        <Section title="Maps, photos, and service providers">
          Maps, remote photos, hosting, analytics, and form delivery may involve
          third-party providers such as OpenStreetMap, Google-hosted photo
          services, Vercel, and Formspree. Those providers may receive standard
          technical information like your IP address when their resources load.
        </Section>
        <Section title="Cookies and advertising">
          DhabaRoute may use ads in the future. If advertising is enabled, ad
          partners may use cookies or similar technologies to measure and serve
          ads. You can manage cookies and ad personalization through your
          browser and ad provider settings.
        </Section>
        <Section title="Corrections and removal">
          You can contact DhabaRoute to request correction or removal of
          submitted personal information, or to ask questions about a listing
          update you sent.
        </Section>
      </div>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Link
          href="/contact"
          className="inline-flex h-11 items-center justify-center rounded-xl bg-clay-500 px-5 text-[14px] font-semibold text-white shadow-cta transition hover:bg-clay-600"
        >
          Contact DhabaRoute
        </Link>
        <Link
          href="/disclaimer"
          className="inline-flex h-11 items-center justify-center rounded-xl border border-paper-warm bg-white px-5 text-[14px] font-semibold text-ink-soft transition hover:border-clay-300 hover:text-accent"
        >
          Read disclaimer
        </Link>
      </div>
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
      <p className="mt-3 text-[14.5px] leading-[1.72] text-ink-soft">
        {children}
      </p>
    </section>
  );
}
