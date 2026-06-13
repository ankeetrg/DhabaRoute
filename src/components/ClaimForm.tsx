"use client";

/**
 * ClaimForm — owner-facing form for claiming a DhabaRoute listing.
 *
 * Accepts optional dhabaTitle + dhabaSlug props pre-filled from the detail
 * page CTA ("Is this your dhaba? → /claim?dhaba={slug}").
 * If no slug is provided the dhaba name becomes a free-text input.
 *
 * Submits to Formspree (NEXT_PUBLIC_FORMSPREE_CLAIM_URL).
 * Fields collected:
 *   dhaba_name, dhaba_slug, owner_name, owner_email, owner_phone,
 *   owner_role, update_types (multi-checkbox), notes, premium_interest
 */

import { useRef, useState } from "react";

interface ClaimFormProps {
  dhabaTitle?: string;
  dhabaSlug?: string;
  actionUrl?: string;
}

export function ClaimForm({ dhabaTitle, dhabaSlug, actionUrl }: ClaimFormProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [premiumInterest, setPremiumInterest] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!actionUrl) return;
    setStatus("submitting");
    try {
      const res = await fetch(actionUrl, {
        method: "POST",
        body: new FormData(e.currentTarget),
        headers: { Accept: "application/json" },
      });
      if (!res.ok) { setStatus("error"); return; }
      formRef.current?.reset();
      setPremiumInterest(false);
      setStatus("success");
    } catch {
      setStatus("error");
    }
  }

  const disabled = !actionUrl || status === "submitting";

  if (status === "success") {
    return (
      <div className="mt-8 rounded-2xl border border-leaf-line bg-leaf-soft px-6 py-10 text-center">
        <span className="text-3xl" aria-hidden>✓</span>
        <p className="mt-3 font-semibold text-leaf text-[15px]">
          Claim submitted — we&rsquo;ll be in touch soon.
        </p>
        <p className="text-[13px] text-ink-soft mt-1.5 leading-relaxed">
          We&apos;ll call to verify ownership and update your listing within 48 hours.
          {premiumInterest
            ? " We'll also send details on verified and featured listing options."
            : ""}
        </p>
      </div>
    );
  }

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      className="mt-8 rounded-2xl border border-paper-warm bg-white p-5 shadow-card sm:p-8"
      aria-busy={status === "submitting"}
    >
      {/* ── Hidden metadata ─────────────────────────────────────────── */}
      <input type="hidden" name="form_type" value="claim_listing" />
      <input
        type="hidden"
        name="_subject"
        value={`Claim Listing — ${dhabaTitle ?? "Unknown Dhaba"}`}
      />
      {dhabaSlug ? (
        <input type="hidden" name="dhaba_slug" value={dhabaSlug} />
      ) : null}

      {/* ── Env not configured warning ──────────────────────────────── */}
      {!actionUrl ? (
        <div className="mb-5 rounded-xl border border-haldi-soft bg-haldi-soft/25 px-4 py-3 text-[13px] leading-relaxed text-ink-soft">
          Formspree is not configured yet. Add{" "}
          <code className="font-mono text-[12px]">NEXT_PUBLIC_FORMSPREE_CLAIM_URL</code>{" "}
          to .env.local and Vercel to enable claim submissions.
        </div>
      ) : null}

      {/* ── Error banner ────────────────────────────────────────────── */}
      {status === "error" ? (
        <div className="mb-5 rounded-xl border border-clay-200 bg-clay-50 px-4 py-3 text-[14px] text-clay-700">
          Something went wrong sending the form. Please try again in a moment.
        </div>
      ) : null}

      <div className="space-y-5">

        {/* Dhaba — read-only display if pre-filled, text input otherwise */}
        <div>
          <FieldLabel label="Dhaba" required />
          {dhabaTitle ? (
            <>
              <div className="w-full rounded-xl border border-paper-warm bg-paper-soft px-4 py-3 text-[14px] font-medium text-ink">
                {dhabaTitle}
              </div>
              <input type="hidden" name="dhaba_name" value={dhabaTitle} />
            </>
          ) : (
            <input
              type="text"
              name="dhaba_name"
              required
              placeholder="e.g. Punjabi Dhaba · I-40 · Shamrock, TX"
              disabled={disabled}
              className={inputClass}
            />
          )}
        </div>

        {/* Owner name */}
        <Field
          label="Your name"
          name="owner_name"
          required
          disabled={disabled}
          placeholder="First and last name"
        />

        {/* Email */}
        <Field
          label="Your email"
          name="owner_email"
          type="email"
          required
          disabled={disabled}
          hint="For follow-up on your listing and optional premium info."
        />

        {/* Phone — key field for verification callback */}
        <Field
          label="Your phone"
          name="owner_phone"
          type="tel"
          required
          disabled={disabled}
          hint="We call to verify ownership — usually within 24 hours."
          placeholder="(555) 000-0000"
        />

        {/* Role */}
        <div>
          <FieldLabel label="Your role" required />
          <select
            name="owner_role"
            required
            disabled={disabled}
            defaultValue=""
            className={inputClass}
          >
            <option value="" disabled>Select one</option>
            <option value="owner">Owner</option>
            <option value="manager">Manager</option>
            <option value="employee">Employee</option>
          </select>
        </div>

        {/* What to update — checkboxes */}
        <div>
          <p className="mb-2.5 text-[12px] font-semibold uppercase tracking-[0.07em] text-ink-muted">
            What would you like to update?{" "}
            <span className="normal-case font-normal text-ink-muted">(optional)</span>
          </p>
          <div className="grid grid-cols-2 gap-x-4 gap-y-2.5">
            {[
              "Hours",
              "Menu",
              "Photos",
              "Specials & deals",
              "Parking info",
              "Other",
            ].map((item) => (
              <label
                key={item}
                className="flex cursor-pointer items-center gap-2 text-[13.5px] text-ink-soft"
              >
                <input
                  type="checkbox"
                  name="update_types"
                  value={item.toLowerCase().replace(/ & /g, "_")}
                  disabled={disabled}
                  className="rounded border-paper-warm accent-[#df6028]"
                />
                {item}
              </label>
            ))}
          </div>
        </div>

        {/* Notes */}
        <div>
          <FieldLabel label="Notes" />
          <textarea
            name="notes"
            rows={3}
            disabled={disabled}
            placeholder="Anything else you'd like us to know or update."
            className={`${inputClass} resize-none`}
          />
        </div>

        {/* Premium interest — soft opt-in, no hard ask */}
        <div className="rounded-xl border border-leaf-line bg-leaf-soft/40 px-4 py-3.5">
          <label className="flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              name="premium_interest"
              value="yes"
              checked={premiumInterest}
              onChange={(e) => setPremiumInterest(e.target.checked)}
              disabled={disabled}
              className="mt-0.5 flex-none rounded border-paper-warm accent-[#138808]"
            />
            <div>
              <p className="text-[13.5px] font-medium text-ink">
                Tell me about verified &amp; featured listings
              </p>
              <p className="mt-0.5 text-[12px] text-ink-soft">
                Featured dhabas rank above unclaimed stops on every route and
                state page.
              </p>
            </div>
          </label>
        </div>

      </div>

      <button
        type="submit"
        disabled={disabled}
        className="mt-6 h-12 w-full rounded-xl bg-clay-500 text-[14px] font-semibold tracking-[-0.005em] text-white shadow-cta transition hover:bg-clay-600 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60 disabled:active:scale-100"
      >
        {status === "submitting" ? "Sending…" : "Claim this listing"}
      </button>
    </form>
  );
}

// ── Shared primitives ────────────────────────────────────────────────────────

const inputClass =
  "w-full rounded-xl border border-paper-warm bg-paper px-4 py-3 text-[14px] text-ink placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-clay-400 disabled:cursor-not-allowed disabled:opacity-60";

function FieldLabel({
  label,
  required,
}: {
  label: string;
  required?: boolean;
}) {
  return (
    <p className="mb-1.5 text-[12px] font-semibold uppercase tracking-[0.07em] text-ink-muted">
      {label}{" "}
      {required ? (
        <span className="text-clay-500">*</span>
      ) : (
        <span className="normal-case font-normal">(optional)</span>
      )}
    </p>
  );
}

function Field({
  label,
  name,
  type = "text",
  required,
  disabled,
  hint,
  placeholder,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  disabled: boolean;
  hint?: string;
  placeholder?: string;
}) {
  return (
    <div>
      <FieldLabel label={label} required={required} />
      {hint ? (
        <p className="mb-1.5 text-[12px] text-ink-muted">{hint}</p>
      ) : null}
      <input
        type={type}
        name={name}
        required={required}
        placeholder={placeholder}
        disabled={disabled}
        className={inputClass}
      />
    </div>
  );
}
