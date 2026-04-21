# DhabaRoute

Authentic dhabas on your route — for long-haul truck drivers and highway travelers.

Built with **Next.js 15 (App Router)**, **TypeScript**, **Tailwind CSS**, and a **map-first homepage** powered by Leaflet + react-leaflet. The data pipeline converts a CSV into typed JSON at build time. Every dhaba detail page is statically pre-rendered.

## What's in the homepage

- Interactive map (Leaflet + OpenStreetMap via CARTO light basemap, no API key).
- One-tap "Use my location" — plots you on the map and sorts dhabas by distance.
- Search + filter chips (Truck Parking, Vegetarian, Late Night, Fuel Stop, Restrooms, Quick Stop, Buffet).
- Synced list below/beside the map. Click a pin → card highlights; hover a card → pin highlights.
- Featured dhabas and "Built for the rig" rows below the interactive area.

## Getting started

```bash
# 1. Install Node 18.18+ (ideally Node 20+) and npm
# 2. Install dependencies
npm install

# 3. Run the dev server (auto-runs `build:data` first)
npm run dev
# -> http://localhost:3000
```

Other scripts:

```bash
npm run build:data   # regenerate data/dhabas.json from data/dhabas.csv
npm run build        # production build (auto-runs build:data)
npm run start        # serve production build
npm run lint
npm run typecheck
```

## Updating the dhaba data

The source of truth is `data/dhabas.csv`. Expected columns:

| Column | Required | Notes |
| --- | --- | --- |
| `Title` | ✅ | Display name. Preserved as-is (whitespace collapsed). |
| `Slug` | ✅ | Human-readable URL slug. Duplicates auto-suffixed `-2`, `-3`, … |
| `Maps URL` | ✅ | Full Google Maps URL. Linked from every card. |
| `Description` | ⬜ | Short 1–3 sentence summary. Empty is fine. |
| `Tags` | ⬜ | Pipe- or comma-separated. Merged with inferred tags. |
| `Priority` | ⬜ | `High`, `Medium`, or `Low`. Defaults to `Medium`. |
| `Route Hint` | ⬜ | Free text (`I-40 Exit 216`). Inferred from title if empty. |
| `Featured` | ⬜ | `Yes` / `No`. Drives the Featured section. |
| `Needs Review` | ⬜ | `Yes` / `No`. Shown as a pending-review badge. |
| `Published` | ⬜ | `Yes` / `No`. Only `Yes` rows are exported. |
| `Source` | ⬜ | Free text (e.g. `Google Maps`). |
| `Lat` | ⬜ | Decimal degrees (e.g. `34.0522`). Takes precedence over title-based inference. |
| `Lng` | ⬜ | Decimal degrees (e.g. `-118.2437`). Required alongside `Lat` to plot a pin. |

### Workflow

1. Edit `data/dhabas.csv` (keep the header row intact).
2. Run `npm run build:data` (or just `npm run dev` / `npm run build` — they chain it).
3. `data/dhabas.json` is regenerated with stable IDs, deduped slugs, and inferred tags/routes.

The transform script is [`scripts/build-data.mjs`](scripts/build-data.mjs) — pure Node, zero dependencies, safe to tweak.

## Project layout

```
data/
  dhabas.csv          # source of truth (edit here)
  dhabas.json         # generated, imported by the app
scripts/
  build-data.mjs      # CSV -> JSON transform
src/
  app/
    layout.tsx
    page.tsx                 # homepage (server)
    not-found.tsx
    dhabas/[slug]/page.tsx   # detail page (static per slug)
  components/
    DhabaCard.tsx
    DhabaRow.tsx             # server-rendered card rail
    Footer.tsx
    Header.tsx
    Hero.tsx
    HomeInteractive.tsx      # client island: map + search + list
    MapView.tsx               # react-leaflet map (ssr:false)
    MapsButton.tsx
    Tag.tsx
  lib/
    dhabas.ts                # typed data accessors
    geo.ts                   # haversine + distance formatting + ranking
    types.ts
    useGeolocation.ts        # browser geolocation hook
```

## Deployment

Zero-config on **Vercel**:

1. Push the repo to GitHub/GitLab/Bitbucket.
2. Import into Vercel. Framework preset: **Next.js**.
3. No env vars needed. The build command runs `npm run build`, which regenerates data from the CSV.

Any other Node host (Netlify, Fly, Render, self-hosted) works the same way — `npm run build && npm run start`.

Because every route is statically generated (ISR-compatible), you can also export a fully static site (`next build` + `next export` equivalent) if preferred for CDN hosting.

## License

Private / unpublished. Data provenance: community + Google Maps.
