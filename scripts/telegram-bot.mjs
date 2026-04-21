#!/usr/bin/env node
// DhabaRoute Telegram Bot
// Setup: node scripts/telegram-bot.mjs
// Requires: TELEGRAM_BOT_TOKEN in environment
//
// Get a token from @BotFather on Telegram:
//   1. Open Telegram, search @BotFather
//   2. Send /newbot, follow prompts, name it "DhabaRoute Bot"
//   3. Copy the token and run: TELEGRAM_BOT_TOKEN=your_token node scripts/telegram-bot.mjs

import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_PATH = join(__dirname, "../data/dhabas.json");

// ── Load dhaba data ───────────────────────────────────────────────────────────
const { dhabas } = JSON.parse(readFileSync(DATA_PATH, "utf8"));

// ── Telegram API helpers ──────────────────────────────────────────────────────
const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
if (!TOKEN) {
  console.error("❌  Set TELEGRAM_BOT_TOKEN environment variable first.");
  console.error("    Get a token from @BotFather on Telegram.");
  process.exit(1);
}

const API = `https://api.telegram.org/bot${TOKEN}`;

async function tg(method, body = {}) {
  const res = await fetch(`${API}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return res.json();
}

async function send(chatId, text, extra = {}) {
  return tg("sendMessage", {
    chat_id: chatId,
    text,
    parse_mode: "Markdown",
    disable_web_page_preview: true,
    ...extra,
  });
}

// ── Dhaba helpers ─────────────────────────────────────────────────────────────
function haversine(lat1, lng1, lat2, lng2) {
  const R = 3958.8; // miles
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function formatDhaba(d, dist = null) {
  const lines = [];
  lines.push(`*${d.title}*`);
  if (d.routeHint) lines.push(`📍 ${d.routeHint}`);
  if (d.description) lines.push(d.description);
  if (dist != null) lines.push(`📏 ${Math.round(dist)} miles away`);
  if (d.tags?.length) lines.push(`🏷 ${d.tags.slice(0, 4).join(" · ")}`);
  if (d.mapsUrl) lines.push(`[Open in Google Maps](${d.mapsUrl})`);
  return lines.join("\n");
}

function findByHighway(query) {
  const q = query.toLowerCase().replace(/\s+/g, "");
  return dhabas
    .filter((d) => {
      const tagMatch = d.tags?.some((t) =>
        t.toLowerCase().replace(/\s+/g, "").includes(q)
      );
      const hintMatch = d.routeHint?.toLowerCase().replace(/\s+/g, "").includes(q);
      const titleMatch = d.title?.toLowerCase().replace(/\s+/g, "").includes(q);
      return tagMatch || hintMatch || titleMatch;
    })
    .slice(0, 5);
}

function nearestDhabas(lat, lng, n = 5) {
  return dhabas
    .filter((d) => d.lat != null && d.lng != null)
    .map((d) => ({ ...d, dist: haversine(lat, lng, d.lat, d.lng) }))
    .sort((a, b) => a.dist - b.dist)
    .slice(0, n);
}

function randomFeatured() {
  const featured = dhabas.filter((d) => d.featured);
  return featured[Math.floor(Math.random() * featured.length)];
}

// ── Command handlers ──────────────────────────────────────────────────────────
async function handleMessage(msg) {
  const chatId = msg.chat.id;
  const text = (msg.text || "").trim();
  const lower = text.toLowerCase();

  // /start
  if (lower === "/start" || lower === "/help") {
    await send(
      chatId,
      `🛣 *Welcome to DhabaRoute Bot!*\n\nFind authentic Indian dhabas along US truck routes.\n\n*Commands:*\n/find I\\-40 — dhabas on a specific highway\n/nearest — share your location for closest dhabas\n/random — surprise me with a dhaba\n/submit — add a dhaba we're missing\n/help — show this menu\n\n[Browse all dhabas →](https://dhabaroute.com)`,
      {}
    );
    return;
  }

  // /find [highway]
  if (lower.startsWith("/find")) {
    const query = text.replace(/^\/find\s*/i, "").trim();
    if (!query) {
      await send(chatId, "Tell me which highway! Example:\n`/find I-40`");
      return;
    }
    const results = findByHighway(query);
    if (results.length === 0) {
      await send(
        chatId,
        `No dhabas found for *${query}* yet.\n\nKnow one? [Submit it here →](https://dhabaroute.com/submit)`
      );
      return;
    }
    await send(chatId, `*${results.length} dhabas on ${query.toUpperCase()}:*\n`);
    for (const d of results) {
      await send(chatId, formatDhaba(d));
      await new Promise((r) => setTimeout(r, 300));
    }
    return;
  }

  // /nearest — asks for location
  if (lower === "/nearest") {
    await send(chatId, "📍 Share your location and I'll find the closest dhabas.", {
      reply_markup: {
        keyboard: [[{ text: "📍 Share my location", request_location: true }]],
        resize_keyboard: true,
        one_time_keyboard: true,
      },
    });
    return;
  }

  // Location message
  if (msg.location) {
    const { latitude, longitude } = msg.location;
    const nearest = nearestDhabas(latitude, longitude, 5);
    await send(chatId, `*5 nearest dhabas to you:*`);
    for (const d of nearest) {
      await send(chatId, formatDhaba(d, d.dist));
      await new Promise((r) => setTimeout(r, 300));
    }
    return;
  }

  // /random
  if (lower === "/random") {
    const d = randomFeatured();
    if (!d) { await send(chatId, "No featured dhabas yet!"); return; }
    await send(chatId, `🎲 *Random dhaba pick:*\n\n${formatDhaba(d)}`);
    return;
  }

  // /submit
  if (lower === "/submit") {
    await send(
      chatId,
      `Know a dhaba we're missing? Submit it here:\n[dhabaroute.com/submit](https://dhabaroute.com/submit)\n\nWe review every submission before it goes live.`
    );
    return;
  }

  // Free-text search — treat as highway/name search
  if (text.length > 1) {
    const results = findByHighway(text);
    if (results.length > 0) {
      await send(chatId, `*Found ${results.length} matching dhabas:*`);
      for (const d of results) {
        await send(chatId, formatDhaba(d));
        await new Promise((r) => setTimeout(r, 300));
      }
    } else {
      await send(
        chatId,
        `Couldn't find dhabas matching *${text}*.\n\nTry:\n/find I\\-40\n/find California\n/nearest`
      );
    }
    return;
  }

  await send(chatId, "Type /help to see what I can do.");
}

// ── Polling loop ──────────────────────────────────────────────────────────────
let offset = 0;

async function poll() {
  try {
    const data = await tg("getUpdates", {
      offset,
      timeout: 30,
      allowed_updates: ["message"],
    });
    if (!data.ok) { console.error("Telegram error:", data); return; }

    for (const update of data.result) {
      offset = update.update_id + 1;
      if (update.message) {
        handleMessage(update.message).catch((e) =>
          console.error("Handler error:", e)
        );
      }
    }
  } catch (e) {
    console.error("Poll error:", e.message);
  }
  setTimeout(poll, 1000);
}

console.log("🛣  DhabaRoute Telegram Bot starting...");
console.log("   Send /start to your bot on Telegram to test it.");
poll();
