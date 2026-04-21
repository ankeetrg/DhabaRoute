#!/usr/bin/env node
// DhabaRoute Weekly Post Generator
// Run: node scripts/generate-posts.mjs
//
// Picks a featured dhaba and generates ready-to-post content for:
//   - Reddit (r/TruckDrivers, r/IndianFood, r/roadtrip, r/ABCDesis)
//   - Instagram caption + hashtags
//   - Twitter/X thread
//   - Facebook group post
//   - Telegram broadcast message
//
// Output is saved to posts/YYYY-MM-DD.md — open it, review, copy-paste into Buffer or post manually.

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT      = join(__dirname, "..");
const DATA_PATH = join(ROOT, "data", "dhabas.json");
const OUT_DIR   = join(ROOT, "posts");

const { dhabas } = JSON.parse(readFileSync(DATA_PATH, "utf8"));

// ── Pick dhaba ────────────────────────────────────────────────────────────────
// Rotate through featured dhabas based on week number so the same one
// isn't picked twice in a row.
function weekNumber() {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 1);
  return Math.ceil(((now - start) / 86400000 + start.getDay() + 1) / 7);
}

const featured = dhabas.filter((d) => d.featured && d.description);
const dhaba    = featured[weekNumber() % featured.length];

if (!dhaba) {
  console.error("No featured dhabas found. Mark some as Featured: Yes in the CSV.");
  process.exit(1);
}

const title    = dhaba.title;
const desc     = dhaba.description;
const route    = dhaba.routeHint ? `off ${dhaba.routeHint}` : "";
const state    = dhaba.tags?.find((t) =>
  ["California","Texas","Arizona","Oregon","Washington","Nevada","Wyoming","Indiana","Ohio","Louisiana","Minnesota","Montana","Colorado","New Mexico","Virginia","New York","Florida"].includes(t)
) ?? "";
const location = [route, state].filter(Boolean).join(", ");
const tags     = dhaba.tags?.filter((t) => t !== state).slice(0, 4).join(", ") ?? "";
const mapsUrl  = dhaba.mapsUrl ?? "https://dhabaroute.com";
const siteUrl  = `https://dhabaroute.com/dhabas/${dhaba.slug}`;

// ── Helpers ───────────────────────────────────────────────────────────────────
const line  = (n = 60) => "─".repeat(n);
const block = (label, content) =>
  `\n## ${label}\n\n${content.trim()}\n\n${line()}\n`;

// ── Reddit posts ──────────────────────────────────────────────────────────────
const redditTitle = `${title}${location ? ` — ${location}` : ""} | DhabaRoute`;

const redditBody = `
I've been building DhabaRoute — a free directory of authentic Indian dhabas along US truck routes. These are the spots that don't have websites, don't run ads, and spread entirely by word of mouth between drivers.

This week's spotlight: **${title}**${location ? ` (${location})` : ""}

${desc}

${tags ? `Amenities: ${tags}` : ""}

[View on DhabaRoute →](${siteUrl})
[Open in Google Maps →](${mapsUrl})

---

We've mapped 157 dhabas so far across the US and Canada. If you know one we're missing, you can [submit it here](https://dhabaroute.com/submit) — takes 2 minutes.

What's the best dhaba you've stopped at? Drop it in the comments.
`.trim();

const subreddits = [
  "r/TruckDrivers",
  "r/IndianFood",
  "r/roadtrip",
  "r/ABCDesis",
  "r/Punjab",
  "r/Truckers",
];

// ── Instagram ─────────────────────────────────────────────────────────────────
const igCaption = `
🛣 Dhaba Spotlight: ${title}
${location ? `📍 ${location}` : ""}

${desc}

${tags ? `✅ ${tags.split(", ").join("  ✅ ")}` : ""}

Find it and 156 more authentic Indian dhabas at dhabaroute.com — the free directory built for drivers on the move.

Know a spot we're missing? Link in bio to submit.

#dhaba #indianfood #truckdriver #punjabifood #roadtrip #indiandispora #dhabaroute #authenticindianfood #truckerlife #i40 #i5 #i80 #southasianfood #desitruckers #roadfood #punjab
`.trim();

// ── Twitter/X thread ──────────────────────────────────────────────────────────
const twitterThread = `
TWEET 1:
There are 157 authentic Indian dhabas along US truck routes that most people have never heard of.

They don't advertise. Word spreads through WhatsApp groups and CB radio.

We mapped them all → dhabaroute.com 🧵

---

TWEET 2:
This week's spotlight: ${title}${location ? ` (${location})` : ""}

${desc}

${mapsUrl}

---

TWEET 3:
A dhaba is a roadside kitchen — built for drivers, not critics.

Big portions. Low prices. Hot chai. Nobody rushes you out.

They followed the Punjabi diaspora from the Grand Trunk Road to I-40, I-5, and every major US corridor in between.

---

TWEET 4:
157 dhabas mapped. All free to browse.

Know one we're missing? Submit it → dhabaroute.com/submit

Every listing reviewed by a human before it goes live.
`.trim();

// ── Facebook group post ───────────────────────────────────────────────────────
const facebookPost = `
🛣 Dhaba Spotlight — ${title}
${location ? `📍 ${location}` : ""}

${desc}
${tags ? `\nAmenities: ${tags}` : ""}

This is one of 157 authentic Indian dhabas we've mapped along US and Canadian truck routes at DhabaRoute.com — a free directory built for drivers who don't have time to scroll through Yelp.

View it here: ${siteUrl}
Google Maps: ${mapsUrl}

If you know a dhaba that isn't on the map yet, submit it at dhabaroute.com/submit. We review every submission and it goes live within a day or two.

What's the best dhaba stop you've found on the road? Comment below 👇
`.trim();

// ── Telegram broadcast ────────────────────────────────────────────────────────
const telegramPost = `
🛣 *Dhaba of the Week*

*${title}*${location ? `\n📍 ${location}` : ""}

${desc}
${tags ? `\n🏷 ${tags}` : ""}

[View on DhabaRoute](${siteUrl}) · [Google Maps](${mapsUrl})

Know a dhaba we're missing? Submit at dhabaroute.com/submit
`.trim();

// ── Outreach email to dhaba owner ─────────────────────────────────────────────
const outreachEmail = `
Subject: Your dhaba is listed on DhabaRoute.com

Hi,

I wanted to let you know that ${title} is now listed on DhabaRoute.com — a free directory of authentic Indian dhabas along US truck routes.

Drivers can find your location, get directions, and read about what makes your stop worth visiting.

Your listing: ${siteUrl}

A few things that would help other drivers find you:
- If you have any photos of the dhaba, I can add them to your listing
- If your menu or hours have changed, let me know and I'll update it
- If you share the listing on your WhatsApp or Instagram, it helps drivers in your area discover you

This is all completely free — DhabaRoute is built by the community, for the community.

Thanks for being part of the route.

Samson
DhabaRoute.com
dhabaroute@gmail.com
`.trim();

// ── Build output ──────────────────────────────────────────────────────────────
const today = new Date().toISOString().split("T")[0];

const output = `# DhabaRoute Weekly Posts — ${today}
## Featured Dhaba: ${title}
${location ? `Location: ${location}` : ""}

${line()}

${block(`REDDIT — Post this in each subreddit separately\nSubreddits: ${subreddits.join("  ·  ")}`, `**Title:** ${redditTitle}\n\n${redditBody}`)}

${block("INSTAGRAM CAPTION", igCaption)}

${block("TWITTER / X THREAD", twitterThread)}

${block("FACEBOOK GROUP POST", facebookPost)}

${block("TELEGRAM BROADCAST", telegramPost)}

${block("OUTREACH EMAIL — Send to the dhaba owner", outreachEmail)}

${line()}
*Generated by scripts/generate-posts.mjs on ${today}*
*Next run will feature a different dhaba automatically.*
`;

mkdirSync(OUT_DIR, { recursive: true });
const outPath = join(OUT_DIR, `${today}.md`);
writeFileSync(outPath, output, "utf8");

console.log(`✅  Posts generated → posts/${today}.md`);
console.log(`\n📋  Featured dhaba: ${title}`);
console.log(`    ${location}`);
console.log(`\n    Open posts/${today}.md to review and copy-paste.`);
console.log(`    Subreddits to post in: ${subreddits.join(", ")}`);
