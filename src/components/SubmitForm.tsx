"use client";

import { useEffect, useRef, useState } from "react";

// Client-side form wrapper. The form itself is uncontrolled (native HTML
// inputs POSTed to Formspree), so we don't track values in React state.
// What we do need is to guarantee the form is blank on every visit:
//   - Fresh load: browsers sometimes auto-fill uncontrolled inputs from a
//     prior visit (autocomplete memory). We reset on mount.
//   - Back-navigation: WebKit/Blink bfcache restores the previous DOM
//     including whatever the user had typed. Listen for pageshow with
//     event.persisted === true and reset there too.
// autoComplete="off" on the form is belt-and-suspenders — most browsers
// ignore it for common fields, which is why we also reset explicitly.
export function SubmitForm() {
  const formRef = useRef<HTMLFormElement>(null);
  // Guards against double-submits on slow networks. Once the browser starts
  // navigating to Formspree the component unmounts, so we never need to flip
  // this back for the happy path. If the user comes back via bfcache, the
  // pageshow handler below resets the form and we reset this state too.
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    formRef.current?.reset();

    const onPageShow = (event: PageTransitionEvent) => {
      if (event.persisted) {
        formRef.current?.reset();
        setIsSubmitting(false);
      }
    };
    window.addEventListener("pageshow", onPageShow);
    return () => window.removeEventListener("pageshow", onPageShow);
  }, []);

  return (
    <form
      ref={formRef}
      action="https://formspree.io/f/mgornaje"
      method="POST"
      autoComplete="off"
      onSubmit={() => setIsSubmitting(true)}
      aria-busy={isSubmitting}
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
        disabled={isSubmitting}
        className="w-full h-12 rounded-xl bg-clay-500 text-white text-[14px] font-semibold tracking-[-0.005em] shadow-cta hover:bg-clay-600 active:scale-[0.99] transition disabled:opacity-60 disabled:cursor-not-allowed disabled:active:scale-100"
      >
        {isSubmitting ? "Sending…" : "Submit for review"}
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
