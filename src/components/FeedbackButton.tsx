"use client";

import { useEffect, useState } from "react";

// Floating feedback widget — unobtrusive pill in the corner that expands
// into a lightweight form. Submits JSON to Formspree via fetch() so the
// user never leaves the page. Success message auto-dismisses after 2.5s.
//
// Why fetch instead of a native <form> POST: Formspree supports JSON
// submissions on the same endpoint, and keeping the user on the current
// page matters more here than on the /submit or contribute flows, where
// a full redirect to a success banner feels more substantial. A floating
// widget should stay out of the way.

export function FeedbackButton() {
  const [open, setOpen] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  // Auto-close after success so the user doesn't have to dismiss manually.
  useEffect(() => {
    if (!sent) return;
    const t = window.setTimeout(() => {
      setOpen(false);
      setSent(false);
      setFeedback("");
    }, 2500);
    return () => window.clearTimeout(t);
  }, [sent]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!feedback.trim() || sending) return;
    setSending(true);
    try {
      await fetch("https://formspree.io/f/mgornaje", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          feedback,
          _subject: "DhabaRoute Feedback",
          _replyto: "dhabaroute@gmail.com",
        }),
      });
      setSent(true);
    } catch {
      // Swallow: the user can retry. Feedback isn't critical enough to
      // surface a red error banner that ruins the quiet corner vibe.
      setSending(false);
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-5 right-5 z-50 inline-flex items-center gap-1.5 h-9 px-3.5 rounded-full bg-white border border-paper-warm shadow-card text-[12.5px] font-medium text-ink-soft hover:border-clay-300 hover:text-ink transition"
        aria-label="Send feedback"
      >
        <svg
          aria-hidden
          viewBox="0 0 16 16"
          className="w-3.5 h-3.5"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinejoin="round"
        >
          <path d="M2 2h12v9H9l-3 3v-3H2z" />
        </svg>
        Feedback
      </button>
    );
  }

  return (
    <div className="fixed bottom-5 right-5 z-50 w-72 rounded-2xl bg-white border border-paper-warm shadow-cardHover p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-[13px] font-semibold text-ink">Send feedback</h3>
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            setSent(false);
            setSending(false);
          }}
          aria-label="Close feedback"
          className="text-ink-muted hover:text-ink transition text-[16px] leading-none"
        >
          ×
        </button>
      </div>

      {sent ? (
        <p className="text-[13px] text-ink-soft text-center py-2">
          Thanks — your feedback helps make DhabaRoute better.
        </p>
      ) : (
        <form onSubmit={handleSubmit}>
          <textarea
            name="feedback"
            rows={3}
            placeholder="What would make DhabaRoute better?"
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            className="rounded-xl border border-paper-warm bg-paper px-3 py-2.5 text-[13px] w-full mt-3 focus:outline-none focus:ring-2 focus:ring-clay-400 resize-none"
          />
          <button
            type="submit"
            disabled={sending || !feedback.trim()}
            className="w-full h-10 mt-3 bg-clay-500 text-white text-[13px] font-semibold rounded-xl hover:bg-clay-600 transition disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {sending ? "Sending…" : "Send"}
          </button>
        </form>
      )}
    </div>
  );
}
