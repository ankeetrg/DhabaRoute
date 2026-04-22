// Resolve the bot's t.me URL by calling Telegram's getMe endpoint once per
// process. We cache the promise (not just the resolved value) so multiple
// callers during the same server render dedupe onto a single fetch; after
// resolution the cached value is returned synchronously to later callers.
//
// Everything is wrapped in try/catch and falls back to null. Call sites
// render nothing when the URL is null, so the site still builds cleanly
// if the token is missing, revoked, or Telegram is unreachable at build time.

let cached: Promise<string | null> | null = null;

async function resolve(): Promise<string | null> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return null;

  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/getMe`, {
      // Cache at the Next.js data layer — the bot username is stable, so
      // an hour-long revalidation avoids a network hop on every request
      // while still picking up a renamed bot within an hour.
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      ok?: boolean;
      result?: { username?: string };
    };
    const username = data?.result?.username;
    if (!data?.ok || !username) return null;
    return `https://t.me/${username}`;
  } catch {
    return null;
  }
}

export async function getTelegramUrl(): Promise<string | null> {
  if (!cached) cached = resolve();
  return cached;
}
