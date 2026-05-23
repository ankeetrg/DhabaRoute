import type { Metadata } from "next";
import Link from "next/link";
import { FormspreeForm, type FormField } from "@/components/FormspreeForm";

export const metadata: Metadata = {
  title: "Update a Listing",
  description:
    "Suggest corrections for an existing DhabaRoute listing, including hours, phone, address, menu links, and traveler notes.",
};

const fields: FormField[] = [
  { name: "listing_name", label: "Listing name", required: true },
  {
    name: "listing_url",
    label: "Listing URL",
    type: "url",
    placeholder: "https://dhabaroute.com/dhabas/...",
  },
  {
    name: "what_needs_updating",
    label: "What needs updating?",
    type: "textarea",
    rows: 4,
    required: true,
  },
  { name: "correct_address", label: "Correct address" },
  { name: "correct_phone", label: "Correct phone", type: "tel" },
  {
    name: "correct_hours",
    label: "Correct hours",
    type: "textarea",
    rows: 3,
  },
  { name: "menu_link", label: "Menu link", type: "url" },
  { name: "photo_link", label: "Photo link if available", type: "url" },
  {
    name: "parking_traveler_notes",
    label: "Parking / traveler notes",
    type: "textarea",
    rows: 3,
  },
  {
    name: "relationship",
    label: "You are the...",
    type: "select",
    required: true,
    options: [
      { value: "owner", label: "Owner" },
      { value: "employee", label: "Employee" },
      { value: "customer", label: "Customer" },
      { value: "visitor", label: "Visitor" },
      { value: "other", label: "Other" },
    ],
  },
  { name: "submitter_name", label: "Your name" },
  { name: "submitter_email", label: "Your email", type: "email" },
  { name: "notes", label: "Notes", type: "textarea", rows: 4 },
];

export default function UpdateListingPage() {
  return (
    <main className="container-page max-w-2xl pt-8 pb-20">
      <nav aria-label="Breadcrumb" className="text-[13px] text-ink-muted">
        <Link href="/" className="underline-offset-4 hover:text-ink hover:underline">
          All dhabas
        </Link>
        <span aria-hidden className="mx-2 text-paper-warm">·</span>
        <span className="text-ink-soft">Update a listing</span>
      </nav>

      <header className="mt-6">
        <p className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-clay-600">
          <span aria-hidden className="h-1 w-1 rounded-full bg-clay-500" />
          Listing updates
        </p>
        <h1 className="mt-2 font-display text-[28px] font-extrabold leading-tight text-ink sm:text-4xl">
          Help keep a listing accurate.
        </h1>
        <p className="mt-3 text-[15px] leading-relaxed text-ink-soft">
          Owners, employees, customers, and visitors can suggest corrections.
          Updates are reviewed before they appear on DhabaRoute.
        </p>
      </header>

      <FormspreeForm
        // TODO: Add NEXT_PUBLIC_FORMSPREE_UPDATE_LISTING_URL in Vercel/env.local.
        actionUrl={process.env.NEXT_PUBLIC_FORMSPREE_UPDATE_LISTING_URL}
        formType="update_listing"
        subject="Listing Update - DhabaRoute"
        fields={fields}
        submitLabel="Send update"
        successMessage="Thanks. We will review the update before changing the listing."
        missingEnvMessage="Formspree is not configured yet. Add NEXT_PUBLIC_FORMSPREE_UPDATE_LISTING_URL to enable listing updates."
      />
    </main>
  );
}
