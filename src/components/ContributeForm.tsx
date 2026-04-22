"use client";

import { useState } from "react";

// Client-side wrapper so we can disable the submit button while the browser
// is sending the multipart POST. With large photo attachments the upload
// can take several seconds, during which a second click would produce a
// duplicate submission. isSubmitting flips true on submit; the browser then
// navigates to the Formspree _next redirect and this component unmounts —
// so we never have to flip it back for the happy path.
export function ContributeForm({
  dhabaTitle,
  dhabaSlug,
}: {
  dhabaTitle: string;
  dhabaSlug: string;
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  return (
    <form
      action="https://formspree.io/f/mgornaje"
      method="POST"
      encType="multipart/form-data"
      onSubmit={() => setIsSubmitting(true)}
      aria-busy={isSubmitting}
      className="mt-5 space-y-4"
    >
      {/* Formspree routing */}
      <input type="hidden" name="_replyto" value="dhabaroute@gmail.com" />
      <input
        type="hidden"
        name="_subject"
        value={`Community contribution — ${dhabaTitle}`}
      />
      <input
        type="hidden"
        name="_next"
        value={`https://dhabaroute.com/dhabas/${dhabaSlug}?contributed=true`}
      />
      {/* Dhaba context so Samson knows which listing to update */}
      <input type="hidden" name="dhaba_title" value={dhabaTitle} />
      <input type="hidden" name="dhaba_slug" value={dhabaSlug} />

      {/* Photos */}
      <div>
        <label
          htmlFor={`photos-${dhabaSlug}`}
          className="block text-[12px] font-semibold uppercase tracking-[0.07em] text-ink-muted mb-1.5"
        >
          Photos <span className="normal-case font-normal">(optional)</span>
        </label>
        <p className="text-[12px] text-ink-muted mb-1.5">
          Food, signage, parking lot — anything helpful. Up to 10 MB per file.
        </p>
        <input
          id={`photos-${dhabaSlug}`}
          name="photos"
          type="file"
          accept="image/*"
          multiple
          className="block w-full text-[13px] text-ink-soft file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-[12px] file:font-semibold file:bg-paper-soft file:text-ink-soft hover:file:bg-paper-warm cursor-pointer"
        />
      </div>

      {/* Menu */}
      <div>
        <label
          htmlFor={`menu-${dhabaSlug}`}
          className="block text-[12px] font-semibold uppercase tracking-[0.07em] text-ink-muted mb-1.5"
        >
          Menu <span className="normal-case font-normal">(optional)</span>
        </label>
        <p className="text-[12px] text-ink-muted mb-1.5">
          Photo of the menu board or a PDF. We&rsquo;ll add it to the listing.
        </p>
        <input
          id={`menu-${dhabaSlug}`}
          name="menu"
          type="file"
          accept="image/*,.pdf"
          className="block w-full text-[13px] text-ink-soft file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-[12px] file:font-semibold file:bg-paper-soft file:text-ink-soft hover:file:bg-paper-warm cursor-pointer"
        />
      </div>

      {/* Notes */}
      <div>
        <label
          htmlFor={`notes-${dhabaSlug}`}
          className="block text-[12px] font-semibold uppercase tracking-[0.07em] text-ink-muted mb-1.5"
        >
          Notes <span className="normal-case font-normal">(optional)</span>
        </label>
        <textarea
          id={`notes-${dhabaSlug}`}
          name="notes"
          rows={2}
          placeholder="Hours, best dish, truck parking, anything useful…"
          className="w-full rounded-xl border border-paper-warm bg-paper px-4 py-3 text-[14px] text-ink placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-clay-400 resize-none"
        />
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className={[
          "inline-flex h-10 items-center justify-center px-5 rounded-xl",
          "bg-clay-500 text-white text-[13px] font-semibold tracking-[-0.005em]",
          "shadow-cta hover:bg-clay-600 active:scale-[0.99] transition",
          "disabled:opacity-60 disabled:cursor-not-allowed disabled:active:scale-100",
        ].join(" ")}
      >
        {isSubmitting ? "Sending…" : "Send contribution"}
      </button>
    </form>
  );
}
