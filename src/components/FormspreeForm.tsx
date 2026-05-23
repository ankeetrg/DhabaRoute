"use client";

import { useEffect, useRef, useState } from "react";

type FieldOption = {
  value: string;
  label: string;
};

export type FormField = {
  name: string;
  label: string;
  type?: "text" | "email" | "tel" | "url" | "textarea" | "select";
  required?: boolean;
  placeholder?: string;
  hint?: string;
  rows?: number;
  options?: FieldOption[];
};

type FormspreeFormProps = {
  actionUrl?: string;
  formType: string;
  subject: string;
  fields: FormField[];
  submitLabel: string;
  successMessage: string;
  missingEnvMessage: string;
};

export function FormspreeForm({
  actionUrl,
  formType,
  subject,
  fields,
  submitLabel,
  successMessage,
  missingEnvMessage,
}: FormspreeFormProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [pageUrl, setPageUrl] = useState("");

  useEffect(() => {
    setPageUrl(window.location.href);
  }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!actionUrl) return;

    setStatus("submitting");
    const formData = new FormData(event.currentTarget);

    try {
      const res = await fetch(actionUrl, {
        method: "POST",
        body: formData,
        headers: { Accept: "application/json" },
      });

      if (!res.ok) {
        setStatus("error");
        return;
      }

      formRef.current?.reset();
      setStatus("success");
    } catch {
      setStatus("error");
    }
  }

  const disabled = !actionUrl || status === "submitting";

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      className="mt-8 rounded-2xl border border-paper-warm bg-white p-5 shadow-card sm:p-8"
      aria-busy={status === "submitting"}
    >
      <input type="hidden" name="form_type" value={formType} />
      <input type="hidden" name="_subject" value={subject} />
      <input type="hidden" name="source_page_url" value={pageUrl} />

      {!actionUrl ? (
        <div className="mb-5 rounded-xl border border-haldi-soft bg-haldi-soft/25 px-4 py-3 text-[13px] leading-relaxed text-ink-soft">
          {missingEnvMessage}
        </div>
      ) : null}

      {status === "success" ? (
        <div className="mb-5 rounded-xl border border-leaf-line bg-leaf-soft px-4 py-3 text-[14px] text-leaf">
          {successMessage}
        </div>
      ) : null}

      {status === "error" ? (
        <div className="mb-5 rounded-xl border border-clay-200 bg-clay-50 px-4 py-3 text-[14px] text-clay-700">
          Something went wrong sending the form. Please try again in a moment.
        </div>
      ) : null}

      <div className="space-y-5">
        {fields.map((field) => (
          <Field key={field.name} field={field} disabled={disabled} />
        ))}
      </div>

      <button
        type="submit"
        disabled={disabled}
        className="mt-6 h-12 w-full rounded-xl bg-clay-500 text-[14px] font-semibold tracking-[-0.005em] text-white shadow-cta transition hover:bg-clay-600 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60 disabled:active:scale-100"
      >
        {status === "submitting" ? "Sending..." : submitLabel}
      </button>
    </form>
  );
}

function Field({
  field,
  disabled,
}: {
  field: FormField;
  disabled: boolean;
}) {
  const id = `form-${field.name}`;
  const commonClass =
    "w-full rounded-xl border border-paper-warm bg-paper px-4 py-3 text-[14px] text-ink placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-clay-400 disabled:cursor-not-allowed disabled:opacity-60";

  return (
    <div>
      <label
        htmlFor={id}
        className="mb-1.5 block text-[12px] font-semibold uppercase tracking-[0.07em] text-ink-muted"
      >
        {field.label}{" "}
        {field.required ? (
          <span className="text-clay-500">*</span>
        ) : (
          <span className="normal-case font-normal">(optional)</span>
        )}
      </label>
      {field.hint ? (
        <p className="mb-1.5 text-[12px] text-ink-muted">{field.hint}</p>
      ) : null}
      {field.type === "textarea" ? (
        <textarea
          id={id}
          name={field.name}
          rows={field.rows ?? 4}
          required={field.required}
          placeholder={field.placeholder}
          disabled={disabled}
          className={`${commonClass} resize-none`}
        />
      ) : field.type === "select" ? (
        <select
          id={id}
          name={field.name}
          required={field.required}
          disabled={disabled}
          className={commonClass}
          defaultValue=""
        >
          <option value="" disabled>
            Select one
          </option>
          {field.options?.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      ) : (
        <input
          id={id}
          name={field.name}
          type={field.type ?? "text"}
          required={field.required}
          placeholder={field.placeholder}
          disabled={disabled}
          className={commonClass}
        />
      )}
    </div>
  );
}
