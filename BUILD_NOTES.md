# BUILD_NOTES

Short, honest notes on the choices in this MVP. Written for the next engineer.

## Product stance

DhabaRoute is a utility, not a directory. Drivers don't need Yelp-for-dhabas — they need the fastest path from "I'm hungry on this highway" to "I'm parked and eating." Every design decision optimizes for that.

- **Map-first homepage.** The map is the primary UI; the list below it is synced to what's visible on the map.
- **One primary CTA per screen:** Open in Google Maps. That's the moment of truth.
- **Mobile-first, large tap targets:** 44–48px controls minimum, single-column default, horizontal filter rail.
- **No stars, no reviews, no comment threads.** Reviews already live in Google Maps — we don't replicate them.
- **English-only UI.** Gurmukhi inside actual dhaba titles stays because it's source data.

## Stack & rationale

- **Next.js 15 (App Router) + React 19 + TypeScript.** Static generation for every route.
- **Tailwind v3.** Stable, small CSS, trivial to onboard onto.
- **Data as a baked-in JSON import.** No runtime fetch, no database, no API routes.
- **Leaflet 1.9 + react-leaflet 5** for the map. Free OSM tiles via CARTO's light basemap (no API key).
- **One client island** ([HomeInteractive](src/components/HomeInteractive.tsx)) owns map + search + filters + list. Everything else stays server-rendered for fast first paint.

## Map architecture

```
HomeInteractive (client)
 ├─ useGeolocation()          → user Coords | null
 ├─ search + filter state     → filtered dhabas
 ├─ rankByDistance()          → ranked list (distance when coords are known)
 ├─ selectedId state          → map↔list sync key
 ├─ <MapView … />  (dynamic, ssr:false)
 └─ <ul> of <DhabaCard />
```

- **SSR safety.** `MapView` is loaded via `next/dynamic(() => import("./MapView"), { ssr: false })`. Leaflet touches `window` on import, so it never executes on the server.
- **Tile layer.** CARTO Light (OSM-derived) — calm colour, free, no API key. Swap to MapTiler or self-hosted tiles before production scale.
- **Markers.** Custom `L.divIcon` CSS-drawn pins (clay for dhabas, blue for user). Avoids the well-known Leaflet marker-icon-path issue in bundlers.
- **Fit-to-bounds.** The `FitToBounds` helper re-frames the map whenever the filtered set or user location changes.
- **Map→list sync.** Clicking a pin calls `onSelect(id)` → list scrolls & ring-highlights the card.
- **List→map sync.** Hovering/focusing a card calls `setSelectedId` → map pans to the pin and the icon swaps to its active state.
- **No crashes for missing coords.** Dhabas without `lat`/`lng` are filtered out of the map (still appear in the list).

## Geolocation flow

- No auto-prompt. The hero shows a clearly-labeled "Use my location" button → `navigator.geolocation.getCurrentPosition` fires on click.
- Four clean states: `idle` → `locating` → `granted` | `denied`. `unsupported`/`error` reuse the "denied" UI.
- Coords are cached in `sessionStorage` so the prompt doesn't flicker on nav.
- Distance is computed via haversine ([`src/lib/geo.ts`](src/lib/geo.ts)), displayed in miles (US driver default). Sort is stable: dhabas without coords sort last.

## Data pipeline

`data/dhabas.csv` → `scripts/build-data.mjs` → `data/dhabas.json` → typed accessors in `src/lib/dhabas.ts`.

Build script is vanilla Node with a hand-rolled CSV parser (no deps). The `predev` / `prebuild` npm hooks run it automatically.

### Schema

157 published rows. Columns used: `Title`, `Slug`, `Maps URL`, `Description`, `Tags`, `Priority`, `Route Hint`, `Featured`, `Needs Review`, `Published`, `Source`, plus optional new `Lat` / `Lng`.

Current fill rate:
- Title / Slug / Maps URL / Priority / Featured / Needs Review / Published / Source: 100%
- Description / Tags / Route Hint / Lat / Lng: 0% in the CSV

In other words: the dataset is names + Maps URLs; curation hasn't started. The app is honest about that.

### Transformations (auditable)

1. **Published filter.** Only `Published == Yes` rows are exported.
2. **Slug uniqueness.** Duplicates (31 of them, e.g. `punjabi-dhaba` × 17) get deterministic `-2`, `-3` suffixes in CSV order. URLs are stable across rebuilds.
3. **Tag inference from title** (conservative):
   - `truck parking | truck stop` → `Truck Parking`
   - `travel center | travel plaza | fuel` → `Fuel Stop` + `Truck Parking`
   - `veg | vegetarian | veggie` → `Vegetarian`
   - `24/7 | 24 hrs | 24 hours` → `Late Night`
   - `buffet` → `Buffet`
   - CSV-provided tags are merged (and win on duplicates).
4. **Route-hint inference from title.** Interstate references (`I-5`, `I-40`) and `Exit ##` only.
5. **Coordinate inference from title.** Tiny hand-curated gazetteer of US cities/towns that actually appear in the dataset (Dixon, Hicksville, Yreka, Eloy, Hammond…). When a title contains a gazetteer city, we attach its centroid and tag the row `coordAccuracy: "city"`. A smaller state-centroid fallback covers "Missouri Dhaba" / "Alabama" / "Mississippi" with `coordAccuracy: "state"` (low precision, deliberately used sparingly). CSV `Lat`/`Lng` always wins over inference.
6. **Priority** normalized to `High` / `Medium` / `Low`. Unknown → `Medium`.

### Coverage today

After inference:
- **Tags:** Truck Parking 8, Fuel Stop 6, Vegetarian 3, Late Night 1, Buffet 1. 13 dhabas tagged overall.
- **Route hints:** 6.
- **Coordinates:** 18 (16 city-level, 2 state-level).

The rest need curator input.

## UI decisions worth knowing

- **Featured + High-priority rows fall back** to heuristic picks (≥2 tags; `Truck Parking`) because no row has `Featured: Yes` or `Priority: High` in the CSV yet. See `pick()` in [`src/app/page.tsx`](src/app/page.tsx).
- **Pending-review badge** only on the detail page, under a muted label — honest, not alarming.
- **Sticky map + list.** Map stays on the left on desktop (≥ lg); stacks above the list on mobile.
- **Filter semantics.** AND across chips; OR across search fields (title, description, route hint, tags).
- **Detail page.** Two-column on desktop (content + dark "Get there" card). One prominent Maps button — because that's the whole job.
- **Accessibility.** Semantic landmarks, skip link, `aria-pressed` on chips, `aria-live` on the result count, `aria-label` on the map region, focus-visible ring in the brand color.

## What I intentionally didn't build

- **Geocoding service integration.** Would unlock the rest of the dataset but needs an API key and rate-limit handling. For now we lean on the hand-curated gazetteer plus optional CSV `Lat`/`Lng` columns.
- **User accounts, reviews, photos.** Out of scope — Google Maps already has them.
- **Server / DB.** Unnecessary at 157 rows.

## Next manual enrichment (priority order)

1. **Add real lat/lng** to the CSV (`Lat`, `Lng` columns). One-shot geocode in a spreadsheet via Google Maps / any geocoder, paste in, rebuild. Unlocks map pins for the remaining 139 dhabas.
2. **Write descriptions** for the top ~30 high-traffic stops. Even one sentence transforms the card.
3. **Flag `Featured: Yes`** on 6–10 spots that deserve the top row.
4. **Set `Priority: High`** on known 24/7, big-parking locations.
5. **Fill `Tags`** — especially `Restrooms`, `Quick Stop`, `Late Night` which title-inference can't detect.

## Deploy checklist

- `npm install`
- `npm run typecheck`
- `npm run build`
- Deploy to Vercel (no env vars needed) or any Node host.

## Photo storage — Vercel Blob (added 2026-06)

### Why it exists

The original photo pipeline fetched images live from Google Places API on every page request via `/api/place-photo/[placeId]`. This worked but had two fragile dependencies:

1. `GOOGLE_PLACES_API_KEY` must be valid and in Vercel's environment
2. Google Places API must be reachable and not rate-limited

If either failed, every card showed a fallback utensil glyph. Vercel Blob solves this permanently.

### How it works

1. Run `node scripts/download-photos.mjs` locally (needs `.env.local` with both keys)
2. The script fetches each dhaba's photo via the production API proxy and uploads to Vercel Blob
3. Blob URLs are written back to `data/dhabas.json` as `storedImageUrl`
4. `src/lib/photo-url.ts` uses `storedImageUrl` first — no API key needed at runtime

### Priority order (in `src/lib/photo-url.ts`)

```
storedImageUrl  →  /api/place-photo/{placeId}  →  imageUrl (legacy lh3)
```

### Running the script

```bash
# First time — install the Blob SDK
npm install @vercel/blob

# Make sure .env.local has both:
# BLOB_READ_WRITE_TOKEN=...   (from Vercel Dashboard → Storage → Blob → .env.local tab)
# GOOGLE_PLACES_API_KEY=...   (already set up)

# Download and store all photos
node scripts/download-photos.mjs

# Re-run after adding new dhabas (skips already-stored ones automatically)
node scripts/download-photos.mjs

# Force refresh all photos
node scripts/download-photos.mjs --force
```

After running, commit `data/dhabas.json` and push — Vercel will redeploy with the new Blob URLs.

### Storage

Blob files are stored at `dhabas/{slug}.jpg` in your Vercel Blob store. View and manage them in Vercel Dashboard → Storage → your Blob store.

The free Vercel Blob tier covers ~1 GB — more than enough for 157 photos (~500 KB each = ~80 MB total).

## Detail page improvements (added 2026-06)

A focused pass on `/dhabas/[slug]` to make the page useful for a driver deciding whether to stop, not just a directory entry. Six changes — each narrow, additive, and verifiable.

### 1. Open/closed badge on the hero photo
- **File:** [`src/components/DhabaHeroPhoto.tsx`](src/components/DhabaHeroPhoto.tsx), wired from [`src/app/dhabas/[slug]/page.tsx`](src/app/dhabas/[slug]/page.tsx)
- **What:** New optional `hours?: string[]` prop. Renders a pill absolutely positioned `top-3 right-3` over the photo: green (`#138808`) "Open now" or red (`#b94040`) "Closed". `"unknown"` renders nothing — we don't fabricate a status.
- **Why:** "Are they open?" is the single most expensive question a driver answers via a phone call right now. Putting the answer on the hero turns a 30-second decision into a 1-second one.

### 2. Amenity strip under the header
- **File:** [`src/app/dhabas/[slug]/page.tsx`](src/app/dhabas/[slug]/page.tsx) — new local `AmenityStrip` component
- **What:** Light tiles between `TagList` and the CTA buttons. Derives up to four tiles from data we already have: "Truck parking" (tag contains "Truck"), "24 hours" (open status + any hours line containing "24"), "Gas" (tag contains "Gas"), "Showers" (tag contains "Shower"). Renders nothing when no tiles match. Each tile uses an accent-colored dot — no emoji.
- **Why:** Tags work for filtering on the homepage, but on a detail page a driver wants the few stop-decision facts surfaced as distinct chips, not buried in a comma list. The derivation is conservative — only render what we can prove from the data.

### 3. Equal-weight CTA buttons
- **File:** [`src/app/dhabas/[slug]/page.tsx`](src/app/dhabas/[slug]/page.tsx) — `PrimaryAction` and `SecondaryAction`, plus the header CTA wrapper
- **What:** Added `flex-1` to both `<a>` components and changed the header wrapper from `flex-col gap-2.5 sm:flex-row` to `flex gap-3` so the buttons are always side-by-side and split the row evenly.
- **Why:** On mobile, "Get directions" and "Call" are equal-priority actions for a hungry driver. Stacking the call button below de-emphasizes it; splitting the row gives both equal optical weight and bigger tap targets without changing the layout language.

### 4. "What to order" replaces the placeholder food card
- **File:** [`src/app/dhabas/[slug]/page.tsx`](src/app/dhabas/[slug]/page.tsx) — new local `WhatToOrderCard` component plus `extractDishes` helper
- **What:** Replaced the static "Menu details are being verified" block with a card that scans the description for any of 17 dish keywords (paratha, biryani, dal, chai, roti, naan, curry, tandoori, lassi, dosa, samosa, chaat, thali, paneer, chole, rice, kebab), takes the first three matches, and renders the dish name with the surrounding sentence (trimmed to 60 chars) as a note. When no keywords match, falls back to "Known for: {tags}" — and to a single verification line when even tags are empty.
- **Why:** Most descriptions already mention specific dishes ("famous for their parathas and biryani") but that signal was being buried in a paragraph. Surfacing it as a structured "What to order" list turns a paragraph into a scannable shortlist — and it costs nothing in data because it reads from the description we already have.

### 5. Route badge in the Visit details sidebar
- **File:** [`src/app/dhabas/[slug]/page.tsx`](src/app/dhabas/[slug]/page.tsx) — new local `getRouteBadgeData` helper
- **What:** When the dhaba's `routeHint` has a parseable highway, the Visit details card now ends with a leaf-green pill linking to `/routes/{highway}`, labelled e.g. "I-80 · 12 stops on this route →". `null` when no highway parses; uses the existing `parseRoute` + `highwaySlug` so it stays consistent with the homepage card.
- **Why:** A driver on I-80 will hit several stops on the same trip. Right now the detail page is a dead-end — surfacing the highway count here turns each detail page into an entry point to route planning, and reuses an existing route page (zero new pages).

### 6. Distance on similar stops
- **File:** [`src/app/dhabas/[slug]/page.tsx`](src/app/dhabas/[slug]/page.tsx) — `getRelatedDhabas` return type changed to `Array<{ dhaba: Dhaba; distanceMi: number | null }>`
- **What:** The related-dhabas scorer already computes great-circle km; we now round it to miles and pass it through as `distanceLabel="{n} mi"` to each `DhabaCard` in the "Similar stops" section. Cards without coords on either end (or when the current dhaba has no coords) get `null` and render without a distance — same DhabaCard handles that gracefully.
- **Why:** "Similar stops" without distance is just "more dhabas." With a mileage figure the section turns into actionable backup options ("23 mi away on the same route"). Reuses the existing `DhabaCard` `distanceLabel` prop — no card edits required.

### Verification
- `npx tsc --noEmit` — clean.
- No new dependencies, no schema changes. All six changes read from existing fields on `Dhaba`.

## Mobile-first detail page redesign (2026-06)

A ground-up restructure of `/dhabas/[slug]` for the actual reading environment: a phone held in one hand at a truck stop. The previous version was a two-column desktop card layout that collapsed to mobile; this version is mobile-first at every breakpoint.

### Layout philosophy

- **Single column at every breakpoint.** No `lg:grid-cols-*`. Container `max-width: 640px` centered — desktop visitors see the same column a phone visitor sees, just centered with whitespace on either side. Easier to design, easier to maintain, faster to read.
- **Dividers, not cards.** Every `<SectionCard>` (white background, 1.5px border, soft shadow) is gone. Sections are separated by `<Divider />` — a thin `<hr>` (`border-top: 1px solid #ede5da; margin: 18px 0`). Whitespace and type hierarchy do the work boxes used to. Result: less visual noise, faster scanning, lighter feel.
- **CTAs above the fold.** "Get directions" and "Call · {phone}" land immediately under the title, before any divider, before any prose. Both full-width (`w-full`), stacked vertically (`flex flex-col gap-2`). For a driver who already knows the place, the page is essentially "title + tap" with zero scroll.
- **Information hierarchy follows decision time.** Order is: title → CTAs → open status → description → amenities → menu → facts → route badge → map → secondary surfaces. Decision-critical info is up top; engagement surfaces (community contribute, owner update, similar stops) are below.

### "On the menu" inline-text format

Replaces the old "What to order" card with a single line of prose:

```
Aloo Paratha, Dal Makhani, Samosa, Chana Masala, Lassi
```

- **Source priority:** structured `dhaba.menu` first (flattened across all categories' items), falls back to keyword extraction from `description` if no menu is on file. If neither produces dishes, the whole section is skipped — no placeholder.
- **Popular dishes highlighted in saffron** (`#df6028`, `font-weight: 600`). Popularity is driven by the `POPULAR_DISHES` constant defined at the top of [`src/app/dhabas/[slug]/page.tsx`](src/app/dhabas/[slug]/page.tsx) — 12 entries covering the staples (paratha, dal, chai, biryani, lassi, paneer, naan, chole, tandoori, plus their `aloo`/`makhani`/`masala` qualified forms). Matching is case-insensitive substring on each dish name, so "Aloo Paratha" matches both `aloo paratha` and `paratha`.
- **Why inline text and not chips?** Chips imply filtering or interactivity; this is informational. Prose reads faster, keeps section height tight, and the saffron highlights still make the "headline" items pop visually.

### `TodayStatus` component

New client component at [`src/components/TodayStatus.tsx`](src/components/TodayStatus.tsx). Renders one line: `● Open · 9:00 AM – 8:30 PM` or `● Closed · Opens tomorrow 9:00 AM`; nothing when status is `unknown`.

- **Must be a client component.** `getOpenStatus()` uses `new Date()` — server-rendering it would freeze the status at build time. Lives in its own file because page.tsx is a Server Component (with `await params`, `notFound()`, `generateMetadata`) and `"use client"` can't be added partway down a module. The spec called for "in page.tsx" — same logical location, separate file by necessity.
- **`suppressHydrationWarning`** on the root `<p>`. SSR will render the build-time status; the client hydrates with the user's real current time; these legitimately differ and the warning isn't actionable.
- **Closed-state "Opens tomorrow X" lookup walks up to 7 days forward** in case multiple consecutive days are closed (rare but real — some dhabas close Sun + Mon). Day label is "tomorrow" only when literally tomorrow; otherwise the actual day name ("Opens Wednesday 9:00 AM").

### Other changes worth noting

- **CTA buttons swapped from `flex-1` to `w-full`.** The previous round added `flex-1` for the side-by-side variant; the stacked variant needs `w-full` instead — `flex-1` in a `flex-col` would stretch buttons vertically rather than horizontally.
- **Fact rows are `<div>`-wrapped `<dt>`/`<dd>` inside a plain `<dl>`** (HTML5 valid). 56px label column, body text in `#3c3128`, phone is the only tappable row (`#df6028 font-semibold` `tel:` link). Rows skip themselves when the underlying field is missing — no "Address being verified" placeholders.
- **`AmenityStrip` restyled to flat pills.** "Truck parking" and "24 hours" get the leaf-green treatment (`rgba(19,136,8,*)`); "Gas" and "Showers" use the warm beige (`#f3ede2` / `#e4d8c6`). Dot prefix removed — pills don't need it.
- **`TagList` removed from the detail page render** (the component definition is gone too). The amenity strip is now the only chip-style surface on the page; the long tag list was redundant noise.
- **"Been here?" lost its card wrapper.** The success state still uses a tinted leaf pill (`#f0f7f0` background, `rgba(26,107,71,0.20)` border), but the surrounding white card box is gone.
- **Deleted local components:** `SectionCard`, `FactList`, `FactRow`, `WhatToOrderCard`, `HoursList`. No longer referenced after the redesign.

### Verification
- `npx tsc --noEmit` — clean.
- One new component file (`TodayStatus.tsx`). No new dependencies. No schema changes.

## Detail page: two-column desktop layout + Blob URL restore (2026-06)

### Layout redesign — dead space fix
- **Problem**: `maxWidth: 640` on `<article>` left ~230px dead space on each side on desktop.
- **Fix**: Replaced the single-column narrow wrapper with `container-page` (max 1200px) and a
  `md:grid-cols-[minmax(0,1fr)_296px]` two-column grid below the hero.
  - Left column: header, description, amenity pills, menu, "Been here?", owner CTA
  - Right sidebar (sticky `top-24`): Get directions + Call CTAs, TodayStatus, fact rows
    (address/phone/route), route badge, 210px map
  - Mobile: single column — CTAs and TodayStatus appear inline after the header;
    facts/route badge/map appear after the menu section; sidebar is `hidden md:flex`
- **Hero photo**: now full container width (`h-[260px] md:h-[400px]`); removed "Photo via Google"
  caption (photos permanently stored in Vercel Blob); updated `sizes` attribute.
- **DhabaDetailMap**: added optional `height` prop (sidebar uses `"210px"`, mobile default
  `clamp(260px, 40vw, 460px)`).
- **Files changed**: `src/app/dhabas/[slug]/page.tsx`, `src/components/DhabaHeroPhoto.tsx`,
  `src/components/DhabaDetailMap.tsx`

### storedImageUrl restore
- All 157 dhabas had `storedImageUrl` wiped by a prior Vercel build (field was missing from
  `PRESERVED_FIELDS` in `build-data.mjs`).
- Recovery: `head()` check in `download-photos.mjs` reused existing Blob URLs without
  re-uploading. All 157 restored in one run.
- `dhabas.json` now has 157/157 `storedImageUrl` entries pointing to
  `public.blob.vercel-storage.com`.

## Owner claim flow (2026-06)

### New pages and components
- **`/claim`** (`src/app/claim/page.tsx`) — Owner-facing claim page. Server component reads
  `?dhaba={slug}` from the URL, looks up the dhaba title via `getDhabaBySlug()`, and passes
  it to `ClaimForm` as a pre-filled read-only field. Falls back to a free-text input if no
  slug is provided (e.g. direct navigation).
- **`ClaimForm`** (`src/components/ClaimForm.tsx`) — Client component. Collects: dhaba name
  (pre-filled or free text), owner name*, email*, phone*, role, what to update (checkboxes:
  hours/menu/photos/specials/parking/other), notes, premium interest opt-in. Submits to
  Formspree (`NEXT_PUBLIC_FORMSPREE_CLAIM_URL`). Success state acknowledges premium interest.

### Detail page CTA
- Changed "Is this your dhaba?" button from:
    `href="/update-listing"` text: "Update your listing →"
  to:
    `href="/claim?dhaba={slug}"` text: "Claim this listing →"
- Updated subtext to: "Verified listings rank above unclaimed stops on route pages."
- Removed the unused Airtable `formUrl` variable.

### Env var required
Add to `.env.local` and Vercel:
  NEXT_PUBLIC_FORMSPREE_CLAIM_URL=https://formspree.io/f/<your-form-id>
Create the form at formspree.io — set subject to "Claim Listing - DhabaRoute".
Until this is set, the form renders a yellow notice but the page still loads.
