import type { Metadata } from "next";
import Link from "next/link";
import { FormspreeForm, type FormField } from "@/components/FormspreeForm";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Contact DhabaRoute with questions, listing updates, partnerships, bug reports, or general notes.",
};

const fields: FormField[] = [
  { name: "name", label: "Name", required: true },
  { name: "email", label: "Email", type: "email", required: true },
  {
    name: "reason",
    label: "Reason",
    type: "select",
    required: true,
    options: [
      { value: "general_question", label: "General question" },
      { value: "listing_update", label: "Listing update" },
      { value: "partnership", label: "Partnership" },
      { value: "bug_report", label: "Bug report" },
      { value: "other", label: "Other" },
    ],
  },
  {
    name: "message",
    label: "Message",
    type: "textarea",
    rows: 6,
    required: true,
    placeholder: "Tell us what you need help with.",
  },
];

export default function ContactPage() {
  return (
    <main className="container-page max-w-2xl pt-8 pb-20">
      <nav aria-label="Breadcrumb" className="text-[13px] text-ink-muted">
        <Link href="/" className="underline-offset-4 hover:text-ink hover:underline">
          All dhabas
        </Link>
        <span aria-hidden className="mx-2 text-paper-warm">·</span>
        <span className="text-ink-soft">Contact</span>
      </nav>

      <header className="mt-6">
        <p className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-clay-600">
          <span aria-hidden className="h-1 w-1 rounded-full bg-clay-500" />
          Contact
        </p>
        <h1 className="mt-2 font-display text-[28px] font-extrabold leading-tight text-ink sm:text-4xl">
          Get in touch with DhabaRoute.
        </h1>
        <p className="mt-3 text-[15px] leading-relaxed text-ink-soft">
          Send a question, correction, partnership note, or bug report. For
          listing changes, the update form is usually the fastest path.
        </p>
      </header>

      <FormspreeForm
        // TODO: Add NEXT_PUBLIC_FORMSPREE_CONTACT_URL in Vercel/env.local.
        actionUrl={process.env.NEXT_PUBLIC_FORMSPREE_CONTACT_URL}
        formType="contact"
        subject="New Contact Message - DhabaRoute"
        fields={fields}
        submitLabel="Send message"
        successMessage="Thanks. Your message was sent."
        missingEnvMessage="Formspree is not configured yet. Add NEXT_PUBLIC_FORMSPREE_CONTACT_URL to enable contact messages."
      />
    </main>
  );
}
