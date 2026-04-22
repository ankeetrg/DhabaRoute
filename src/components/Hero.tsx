import Link from "next/link";
import { getTelegramUrl } from "@/lib/telegram";

// Compact hero — sits above the search without competing with it.
// Headline stays short and factual; the list + map do the heavy lifting.
// Count + link orient first-time visitors: what this is, how big it is,
// and where to go if they've never heard of a dhaba.

interface HeroProps {
  count: number;
}

export async function Hero({ count }: HeroProps) {
  // Null when the bot token is missing or the API call fails — we
  // then skip the Telegram secondary link entirely.
  const telegramUrl = await getTelegramUrl();

  return (
    <section className="container-page pt-6 sm:pt-8 pb-1">
      <h1 className="text-[20px] sm:text-[22px] font-semibold tracking-tight text-ink leading-[1.15]">
        Authentic dhabas on your route
      </h1>
      <p className="text-[14px] sm:text-[15px] text-ink-muted mt-2 leading-relaxed max-w-lg">
        {count} Indian roadside kitchens mapped across US truck routes. Free,
        no ads, built for drivers.
      </p>
      <Link
        href="/what-is-a-dhaba"
        className="text-[13px] text-clay-600 hover:text-clay-700 underline-offset-4 hover:underline transition mt-2 inline-block"
      >
        New here? Learn what a dhaba is →
      </Link>
      {telegramUrl ? (
        <a
          href={telegramUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="block text-[13px] text-clay-600 hover:text-clay-700 underline-offset-4 hover:underline transition mt-1"
        >
          Get route updates on our Telegram bot →
        </a>
      ) : null}
    </section>
  );
}
