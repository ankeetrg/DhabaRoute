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
