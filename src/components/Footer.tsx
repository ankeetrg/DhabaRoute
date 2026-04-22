import { getDataMeta } from "@/lib/dhabas";
import { getTelegramUrl } from "@/lib/telegram";

export async function Footer() {
  const { count, generatedAt } = getDataMeta();
  // Deterministic (no locale dependency) so SSR and client agree.
  const updated = new Date(generatedAt).toISOString().slice(0, 10);
  // Null when the bot token is missing or the API call fails — we
  // then skip the Telegram link to keep the footer tidy.
  const telegramUrl = await getTelegramUrl();

  return (
    <footer className="mt-16 border-t border-paper-warm">
      <div className="container-page py-7 flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between text-[13px] text-ink-muted">
        <p>
          <span className="font-semibold text-ink">DhabaRoute</span> · Built for the road. · &copy;&nbsp;{new Date().getFullYear()}
        </p>
        <p className="tabular-nums">
          {count} dhabas · Last updated {updated}
        </p>
      </div>
      {telegramUrl ? (
        <div className="container-page pb-6 -mt-3">
          <a
            href={telegramUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-[13px] text-ink-muted hover:text-ink transition"
          >
            <TelegramIcon className="w-3.5 h-3.5" />
            Join our Telegram bot
          </a>
        </div>
      ) : null}
    </footer>
  );
}

function TelegramIcon({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 16 16"
      fill="currentColor"
      className={className}
    >
      <path d="M14.43 2.2 1.64 7.12a.54.54 0 0 0 .03 1.02l3.27.98 1.27 3.94a.54.54 0 0 0 .9.22l1.77-1.7 3.27 2.4a.54.54 0 0 0 .85-.33l2.14-10.5a.54.54 0 0 0-.71-.63Zm-2.72 3.1L6.5 9.9l-.2 2.3-.92-2.84 6.33-4.06Z" />
    </svg>
  );
}
