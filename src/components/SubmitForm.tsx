import { FormspreeForm, type FormField } from "@/components/FormspreeForm";

const submitFields: FormField[] = [
  {
    name: "restaurant_name",
    label: "Restaurant / Dhaba name",
    required: true,
    placeholder: "e.g. Punjabi Dhaba",
  },
  {
    name: "address",
    label: "Address",
    required: true,
    placeholder: "Street address if you know it",
  },
  { name: "city", label: "City", required: true },
  { name: "state", label: "State", required: true },
  { name: "phone", label: "Phone", type: "tel" },
  { name: "website_or_menu", label: "Website or menu link", type: "url" },
  {
    name: "google_maps_link",
    label: "Google Maps link",
    type: "url",
    hint: "Open the place in Google Maps and paste the URL if available.",
  },
  {
    name: "recommended_dishes",
    label: "Recommended dishes",
    type: "textarea",
    rows: 3,
    placeholder: "Chai, paratha, thali, biryani, or anything worth trying.",
  },
  {
    name: "parking_notes",
    label: "Parking notes",
    type: "textarea",
    rows: 3,
    placeholder: "Truck parking, easy turn-in, tight lot, nearby fuel, etc.",
  },
  {
    name: "hours_if_known",
    label: "Hours if known",
    type: "textarea",
    rows: 3,
  },
  {
    name: "why_listed",
    label: "Why should this place be listed?",
    type: "textarea",
    rows: 4,
    required: true,
  },
  { name: "submitter_name", label: "Your name" },
  { name: "submitter_email", label: "Your email", type: "email" },
  {
    name: "submitter_relationship",
    label: "You are the...",
    type: "select",
    required: true,
    options: [
      { value: "owner", label: "Owner" },
      { value: "customer", label: "Customer" },
      { value: "visitor", label: "Visitor" },
      { value: "other", label: "Other" },
    ],
  },
  {
    name: "notes",
    label: "Notes",
    type: "textarea",
    rows: 4,
  },
];

export function SubmitForm() {
  return (
    <FormspreeForm
      // TODO: Add NEXT_PUBLIC_FORMSPREE_SUBMIT_DHABA_URL in Vercel/env.local.
      actionUrl={process.env.NEXT_PUBLIC_FORMSPREE_SUBMIT_DHABA_URL}
      formType="submit_dhaba"
      subject="New Dhaba Submission - DhabaRoute"
      fields={submitFields}
      submitLabel="Submit for review"
      successMessage="Thanks. We will review the submission before adding it to DhabaRoute."
      missingEnvMessage="Formspree is not configured yet. Add NEXT_PUBLIC_FORMSPREE_SUBMIT_DHABA_URL to enable dhaba submissions."
    />
  );
}
