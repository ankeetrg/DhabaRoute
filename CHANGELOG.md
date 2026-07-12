# Changelog

A log of user-facing fixes and features pushed to `main`, kept alongside the
code so the history survives outside chat history. Newest entries first.

Each entry: date, commit hash, what changed, why, and how it was verified.

---

## 2026-07-13 — Detail page: full-size photo lightbox

**Commit:** [`ba4200d`](https://github.com/ankeetrg/DhabaRoute/commit/ba4200d)

The hero carousel (`DhabaHeroCarousel.tsx`) already supported multiple
photos with arrows/dots, but there was no way to see a photo at full
size — asked for directly by the user.

**What changed:** clicking/tapping the hero photo now opens a full-screen
lightbox showing the uncropped image (new `objectFit` prop on
`DhabaPhoto.tsx`, `"cover"` by default so every existing caller is
unaffected — the lightbox is the first to opt into `"contain"`). When a
dhaba has more than one photo, the lightbox gets its own prev/next
arrows, a "2 / 5" counter, and reuses the same swipe handlers as the
inline carousel. Closes via the X button, clicking the dark backdrop, or
Escape; body scroll is locked while it's open.

**Verified:** deploy confirmed via the GitHub commit-status API
(`state: success`) — Node still isn't installed locally.

---

## 2026-07-12 — Fix: no way to close the expanded contribute form

**Commits:** [`be5aecc`](https://github.com/ankeetrg/DhabaRoute/commit/be5aecc), [`8ead1e8`](https://github.com/ankeetrg/DhabaRoute/commit/8ead1e8)

Tapping "Add Photo / Menu / Note" on the detail page expanded the
contribution form in place with no way back to the collapsed view —
flagged by the user.

**Fix:** added a "Close" control above the form (`ContributeCard.tsx`)
that collapses it back to the initial intent-button state. First shipped
as plain muted text, then restyled as an orange outline pill button
(same shape/family as "Add Photo / Menu / Note") per follow-up feedback,
since the plain text read as secondary/easy to miss.

**Verified:** deploys confirmed via the GitHub commit-status API
(`state: success` on both commits) — Node still isn't installed locally.

---

## 2026-07-12 — Desktop detail page: 60/40 hero/facts split with a collapsible map ribbon

**Commit:** [`1fd67cd`](https://github.com/ankeetrg/DhabaRoute/commit/1fd67cd)

Follow-up to the desktop hero+sidebar layout above, iterated through
several rounds of user feedback on a static mockup before shipping:

- **Column widths changed from 50/50 to 60% photo / 40% CTAs+facts+map.**
- **The map now collapses into a "View map" ribbon** (new `MapRibbon.tsx`)
  instead of always showing a full 210px map, which had made the info
  column noticeably taller than the photo. Desktop: hover the ribbon (or
  focus it via keyboard) to expand; move the cursor away (or blur) and it
  collapses. Mobile/touch: tap to open, tap again to close — reusing the
  `(pointer: coarse)` check already used by `MapView.tsx`. Also swapped
  into the mobile "Details" tab panel, so mobile gets the same behavior.
- **Get directions / Call / View map shrink to 80% width (centered), 36px
  tall, 13px font** (previously full-width, 44px, 14px) so they read as
  normal buttons instead of oversized bars in the narrower column. The
  map itself stays full width once opened — only the trigger shrinks.
- **Hero photo height bumped from 20vh (200–260px) to 24vh (230–280px)**
  so its fixed size lands close to the now-compact info column's natural
  height, minimizing empty space beneath it. The photo is still never
  stretched/deformed — it keeps a fixed size and is centered in the row;
  the two column *boxes* are height-matched via flex's default
  `items-stretch`.

**Verified:** iterated through five rounds of a static HTML mockup
(Node isn't installed locally) matching the real Tailwind classes,
approved by the user before each push; deploy confirmed via the GitHub
commit-status API (`state: success`).

---

## 2026-07-12 — Fix: detail-page hero photo took up too much of the mobile screen

**Commit:** [`5687d90`](https://github.com/ankeetrg/DhabaRoute/commit/5687d90)

The hero photo carousel's fixed 260px mobile height ate most of the
screen above the fold on short phones — flagged by the user with a
screenshot showing the name and "Closed" badge barely visible below it.

**Fix:** mobile height changed from a fixed `260px` to `30vh`, clamped
between `160px` (so it never collapses on very short viewports) and
`280px` (so it doesn't balloon on tall ones). Desktop keeps its
unrelated fixed `400px` hero.

**Verified:** deploy confirmed via the GitHub commit-status API
(`state: success`) — Node still isn't installed locally, so this is
reviewed-then-shipped rather than build-tested first.

---

## 2026-07-12 — Home page: Submit link merged into the view-toggle row

**Commit:** [`d00fc63`](https://github.com/ankeetrg/DhabaRoute/commit/d00fc63)

The "+ Submit" link (added below the filters in `89fa663`) had its own row,
which was mostly empty space and made the page noticeably longer — flagged
by the user with a screenshot.

**Fix:** moved it inline next to the list/split/map toggle — both now share
one `flex items-center gap-3` row instead of Submit getting a dedicated row
underneath. The view toggle still only renders when there are pins to show
(`hasAnyPins`); Submit always renders regardless.

**Verified:** static mobile mockup at a 375px viewport — Submit and the
toggle share one 49px-tall row, and the sticky filter header now ends
immediately after it with no extra gap.

---

## 2026-07-12 — Fix: blank/broken map on the detail page's mobile Details tab

**Commit:** [`551bd64`](https://github.com/ankeetrg/DhabaRoute/commit/551bd64)

Regression from the tab-panels rework above: the Details panel now starts
hidden (`display:none`) until tapped, since only Overview is active on
load. The Leaflet map inside it (`MapView.tsx` → `DhabaDetailMap`) mounts
via react-leaflet's `MapContainer`, which measures its container at mount
to fit the initial view — mounting inside a 0×0 hidden box produced a map
fitted/tiled against zero size: blank tiles with a stray vector fragment
in the corner, and it never recovered once the panel became visible
because nothing told Leaflet to re-measure.

**Fix:** `FitToBounds` in `MapView.tsx` now watches the container with a
one-shot `ResizeObserver` when it isn't already visible at mount. The
first time the container gets a real size (the tab becoming active), it
calls `map.invalidateSize()` and re-runs the same initial fit, then
disconnects. Scoped so it only fires for maps that mount hidden — the
home page map and the desktop sidebar map (both visible at mount) are
untouched, and it never re-fights a user's manual pan/zoom on later
resizes since it only runs once.

**Verified:** deploy confirmed via the GitHub commit-status API
(`state: success`) — Node still isn't installed locally, so this is
reviewed-then-shipped rather than build-tested first.

---

## 2026-07-12 — Mobile detail-page tabs: real panels instead of scroll anchors

**Commits:** [`88573ad`](https://github.com/ankeetrg/DhabaRoute/commit/88573ad), [`cb1a544`](https://github.com/ankeetrg/DhabaRoute/commit/cb1a544), [`82fdcf1`](https://github.com/ankeetrg/DhabaRoute/commit/82fdcf1)

Two follow-ups to the detail page redesign below, both on mobile:

- The three "Add photo" / "Add menu" / "Add a note" contribute buttons
  were collapsed into a single **"Add Photo / Menu / Note"** button that
  expands the same contribution form in place.
- User feedback: tapping the Amenities/Details tab scrollIntoView'd the
  *whole page* down past Overview, which read as the page jumping around.
  **Overview / Amenities / Menu / Details are now real tab panels**
  (`DetailTabPanels`) — only the active one renders, swapped in place
  directly under the sticky tab bar, so switching tabs never scrolls past
  unrelated content. **Nearby is intentionally not a panel** — it's a
  distinct section further down the page (next-stops cards), so its tab
  keeps the old jump-to-section behavior on purpose. Desktop is
  unaffected — there's no tab bar there; Overview/Amenities/Menu still
  stack as plain content and Details stays hidden in favor of the
  sidebar's own copy.

**Verified:** deploys confirmed via the GitHub commit-status API
(`state: success` on all three commits) — Node still isn't installed
locally, so this is reviewed-then-shipped rather than build-tested first.

---

## 2026-07-12 — Dhaba detail page redesign: built around the driver's decision, not booking/paying

**Commit:** [`1ae25c2`](https://github.com/ankeetrg/DhabaRoute/commit/1ae25c2)

Rebuilt `src/app/dhabas/[slug]/page.tsx` — the single template statically
generated for every slug in `dhabas.json` — around one question: "should I
pull off the highway for this?" Previously validated as an interactive
Claude Artifact mockup against Preet Dhaba's real data before implementation.

**What changed:**
- Photo hero is now a one-photo-at-a-time carousel (`DhabaHeroCarousel`)
  with clickable prev/next arrows and pagination dots; renders a plain
  static photo (no dead controls) when a listing has only one image, and
  activates automatically once a listing's `photos[]` array has more than one.
- New route strip under the title ("I-40 · N stops on this route →") using
  the site's existing green route-badge treatment.
- New action-chip row (`DetailActionChips`) — every chip is functional:
  "What's good here?" scrolls to the dish list, Directions/Call use real
  `mapsUrl`/`tel:` links, Share uses `navigator.share` with a clipboard
  fallback, and a new "Report an update" chip links to `/update-listing`.
- New "Trucker essentials" 2×2 grid (truck parking, showers/24-hr, fuel,
  bathrooms) — green when present, "Not listed" (not a false "No") when the
  CSV has no matching tag.
- New sticky in-page tab bar (`DetailTabs`, mobile only) that scroll-anchors
  to Overview / Amenities / Menu / Details / Nearby — one server-rendered
  page, no client-side view switching.
- Contribution form collapsed into a compact dashed card (`ContributeCard`)
  with three one-tap intents (photo / menu / note) that expand the existing
  Formspree form in place.
- "Similar stops" renamed to "Next stops on {highway}" when the dhaba has a
  parsed route.
- Removed the now-unused `DhabaHeroPhoto` component (superseded by the
  carousel).

**Why:** the reference design (a city dining app) is built around booking
a table and paying a bill; a roadside dhaba page has no such transaction —
its job is to answer a driver's amenity and route questions in a few
seconds. See `dhaba-page-preview.html`-adjacent design rationale in the
Claude Artifact linked from this session.

**New CSV entries get this design automatically:** the page is generated
via `generateStaticParams()` over every slug in `dhabas.json`, which is
rebuilt from `dhabas.csv` by the existing `prebuild`/`predev` hook
(`scripts/build-data.mjs`) — no per-listing work needed.

**Verified:** reviewed line-by-line against existing component signatures
and types (Node is not installed on this dev machine, so this is
untested locally); pushed to `main` and confirmed the Vercel production
build succeeded via the GitHub commit status API
(`GET /repos/ankeetrg/DhabaRoute/commits/1ae25c2/status` → `"state": "success"`).

---

## 2026-07-12 — Fix: List view compact cards blew the page out sideways on mobile

**Commit:** [`af1101e`](https://github.com/ankeetrg/DhabaRoute/commit/af1101e)

After the compact-card release below, the home page overflowed
horizontally on mobile in List view (page ~569px wide at a 375px
viewport, everything cut off at the left edge; user reported with a
screenshot).

**Root cause:** the amenity pill row's `max-content` width propagated
up through the card's flex column into the grid track — the classic
CSS grid `min-width: auto` blow-out. `overflow-x-auto` on the pill row
didn't help because a scroll container only gets an automatic minimum
size of zero when it is itself the flex/grid item; as a plain block
child its intrinsic min-content width still includes the full
un-scrolled pill strip, so the card grew instead of the bar scrolling.

**Fix:** two guards — `min-w-0` on the list's grid `<li>` items, and
`w-0 min-w-full` on the pill row's scroll container (zeroes its
intrinsic width contribution while `min-width:100%` keeps its used
width filling the card).

**Verified:** reproduced and then re-tested in a 375px same-origin
iframe against the static mockup built from real data: page scrollWidth
569 → 375 after the fix, and the pill bars now actually scroll
(6 of 12 sample cards have overflowing pills that scroll in place).

---

## 2026-07-12 — Home page: compact cards in List view

**Commit:** [`362892c`](https://github.com/ankeetrg/DhabaRoute/commit/362892c)

The "All dhabas" cards in List view are now compact horizontal cards
(Zomato/Swiggy list pattern): 104px square photo on the left; name,
"City, ST" (from the listing address — prefixed with distance when
"Near me" is active), saffron highway label, Open/Closed + today's
hours, and a horizontally scrollable amenities bar showing every tag
as a pill on the right. Roughly 3× more stops fit per screen.

Scope: List view only. "List & Map" (split), Map view, routes/states
pages, and the detail page's nearby cards all keep the big vertical
card — the change is an additive `compact` prop on `DhabaCard`, gated
on `viewMode === "list"` in `HomeInteractive`.

The amenity pill bar sits above the card's whole-card overlay link
(`relative z-10`) so swiping it scrolls the pills instead of opening
the detail page.

**Verified:** via a static HTML mockup built from `data/dhabas.json`
(12 real listings, photos, hours, tags) served locally and inspected
in the browser at mobile and desktop widths; layout approved by the
user before push.

---

## 2026-07-07 — Home page: Submit link left-aligned under State chip

**Commit:** [`5332980`](https://github.com/ankeetrg/DhabaRoute/commit/5332980)

The "+ Submit" link below the filter selectors (added in `89fa663`) was
right-aligned under the whole chip+toggle row. Changed to `justify-start`
so it now sits directly under the "State" chip instead.

**Verified:** via the static mockup at a 375px viewport — Submit link and
State chip share the same left edge (x=20/37, both against the container's
left padding).

---

## 2026-07-07 — Home page: map now shows in "List & Map" mode on mobile

**Commit:** [`1f2430a`](https://github.com/ankeetrg/DhabaRoute/commit/1f2430a)

Users reported not seeing a map on mobile at all in the "List & Map" view.

**Root cause:** an earlier mobile-first pass (e166e5d, below) added a CSS
`order` flip so the dhaba list showed before the map on mobile — the
reasoning at the time was that the map is largely inert on touch (drag
disabled, hover-preview needs a mouse). In practice this buried the map
below a list of up to 30 cards, so it never became visible without a lot
of scrolling.

**Fix:** removed the mobile-only reorder in `HomeInteractive.tsx`. Map now
renders before the list at every width, same as desktop.

**Verified:** inspected the live deployed site directly (not a local
mockup) — confirmed Leaflet tiles and all 157 dhaba pins render correctly
(tiles load from `tile.openstreetmap.org`, 314 marker-pane elements
present), so the map itself was never broken, just positioned below the
fold on narrow screens. Could not visually reproduce a true ~375px mobile
viewport against the live site in this environment (browser window is
fixed at 1280px wide here) — the fix was verified by reading the
responsive layout logic directly rather than a pixel-level mobile check.

---

## 2026-07-07 — Home page: tooltips on the view-toggle buttons

**Commit:** [`e07643e`](https://github.com/ankeetrg/DhabaRoute/commit/e07643e)

The list/split/map view-toggle icons had no visible label — only an
`aria-label` for screen readers — so sighted users had to guess what each
icon did.

**Fix:**
- Desktop (fine pointer): hovering a button now shows a small dark tooltip
  bubble with its label, for as long as the pointer stays over it. Reuses
  the file's existing `IS_COARSE_POINTER` check (already used to suppress
  autofocus on the State/Highway dropdown search input) to gate this to
  non-touch input.
- Mobile (coarse pointer): there's no hover state to reveal a label, so
  tapping a button shows its tooltip for 1.5s before auto-hiding — the tap
  still switches the view immediately, same as before.
- Renamed the middle button's label from "Split view" to "List & Map" —
  "split" didn't describe what was actually split (it stacks the list and
  map, it isn't a side-by-side split pane).

**Verified:** via the static HTML mockup — since real hover vs. touch input
can't be toggled through the browser preview tools, simulated both paths
with a small JS harness driven by `preview_eval` (mouseenter/mouseleave for
desktop, click for mobile) and confirmed each shows/hides as expected.

---

## 2026-07-07 — Home page: tap-to-scroll arrow on filter chip ribbon (mobile)

**Commit:** [`5e2ac8c`](https://github.com/ankeetrg/DhabaRoute/commit/5e2ac8c)

The filter chip ribbon (State/Highway/tags/Open Now/All) already faded out
at the right edge when it overflowed, as a "there's more, scroll" hint —
but users weren't reading that as a swipe cue and didn't realize the row
scrolled horizontally at all.

**Fix:** added a small circular arrow button next to the fade, mobile only
(`sm:hidden`). Tapping it calls `scrollBy({ left: 160, behavior: "smooth" })`
on the chip row; it shares the same `atEnd` tracking as the fade, so both
disappear together once the ribbon is fully scrolled.

**Verified:** via a static HTML mockup (still no Node locally) exercised
with `preview_eval` — confirmed the button only renders while there's
unscrolled content, that clicking it moves `scrollLeft`, and that both the
arrow and fade hide once the end is reached. `behavior: "smooth"` didn't
visibly animate under headless Chrome in this harness (a known headless
quirk, not a code issue) — the underlying scroll offset itself moved
correctly, and `smooth` is a standard, well-supported option on real
browsers/devices.

---

## 2026-07-07 — Home page: mobile spacing + Submit relocated out of header

**Commit:** [`89fa663`](https://github.com/ankeetrg/DhabaRoute/commit/89fa663)

**Changes:**
- `HomeInteractive.tsx` — search bar wrapped in `mt-3 sm:mt-0` so it isn't
  crowded against the "Find real dhabas on your route." heading on mobile,
  where the subline (which provided that gap on desktop) is hidden.
- `Header.tsx` — "+ Submit" removed from the top nav entirely (still
  reachable via the Footer's "Explore" column and its CTA button).
- `HomeInteractive.tsx` — "+ Submit" re-added, right-aligned, directly below
  the State/Highway/tag filter chips and the list/split/map view toggle.
- `Header.tsx` — "What is a Dhaba?" link's `hidden sm:inline-flex` removed
  so it now shows on mobile too, taking the header slot Submit vacated. This
  partially reverses the e166e5d fix below (which hid it on mobile to avoid
  nav overflow under ~330px); removing Submit freed up the room. If a
  narrow-phone overflow complaint resurfaces, check here first.

**Verified:** Node still isn't available locally, so this was checked via a
hand-built static HTML mockup served with the `preview_start` static-server
pattern and inspected with `preview_inspect`/`preview_snapshot` (the
screenshot tool timed out, a known issue in this environment) — confirmed
correct heading→search-bar gap and DOM order (chips → toggle → Submit link).

---

## 2026-07-07 — Home page: mobile-first pass + State/Highway filters

**Commit:** [`e166e5d`](https://github.com/ankeetrg/DhabaRoute/commit/e166e5d)

**Mobile fixes** (all scoped with Tailwind `sm:` breakpoints so desktop is unchanged):
- `Header.tsx` — "What is a Dhaba?" nav link was overflowing the viewport
  horizontally on phones under ~330px wide; hidden below `sm:`. Telegram icon
  got a larger invisible tap-padding on mobile.
- `HomeInteractive.tsx` — map now renders *after* the list on mobile (CSS
  `order`, DOM order unchanged) since the map is largely inert on touch
  (drag disabled, hover-preview needs a mouse). Bigger tap targets on filter
  chips, the view-mode toggle, and the search-clear button.
- `Footer.tsx` — the CTA band's outer `px-8` was stacking with the inner
  `.container-page`'s own gutter, double-padding the band on mobile only;
  changed to `px-0 sm:px-8`.

**New: State / Highway filter dropdowns** — ordered State → Highway → Truck
Parking → Open Now → All on the home page filter ribbon.
- `src/lib/regionData.ts` (new) — exhaustive North America state/province
  list (US + DC + Canadian provinces/territories) and primary 1–2 digit US
  Interstate list, independent of what's actually in the current dataset.
- Single-select combobox: unselected shows a "State ▾" chip that opens a
  searchable list; selecting shows a filled pill with an inline × to clear.
- Selecting a state/highway filters both the list and map to matching
  dhabas; picking one with zero current coverage falls through to the
  existing "nearest dhabas" fallback banner rather than showing empty.
- The dropdown panel is portaled to `<body>` with `position: fixed`,
  computed from the trigger's live bounding rect — necessary because the
  chip row is `overflow-x-auto` (for mobile horizontal scrolling), which
  per the CSS overflow spec also clips vertical overflow; an in-flow
  `absolute` panel would have been cut off the instant it opened.
- Panel repositions on scroll/resize, flips above the trigger and
  clamps its height when there isn't enough room below (short/landscape
  viewports), and clamps horizontally so it can't run off a narrow screen.
- Mobile hardening: search-input autofocus suppressed on touch devices
  (`pointer: coarse`) so opening a picker doesn't pop the keyboard over the
  option list; bigger × and option-row tap targets on touch; outside-tap-to-
  close uses `pointerdown` (not `mousedown`, which iOS Safari doesn't
  reliably synthesize on non-interactive elements); focus is restored to
  the trigger after selecting/clearing/Escape (the trigger's DOM node swaps
  between plain button and pill, which would otherwise drop focus).

**Verified:** live on the deployed site at a true 371px viewport (same-origin
iframe technique — no Node available locally to run `next dev`). Confirmed:
no horizontal overflow, ribbon scrolls horizontally, correct chip order,
list-before-map, State/Highway filtering end-to-end (Nevada: 157→3 stops,
I-40: 157→26 stops), × clear resets correctly, panel flips up and clamps
height on a 356px-tall viewport. Not yet confirmed on a real touch device
(the autofocus-suppression and pointerdown paths need an actual phone).

---

## 2026-07-01 — Home page: dhaba-card hover preview auto-closes

**Commit:** [`a8a4963`](https://github.com/ankeetrg/DhabaRoute/commit/a8a4963)

Hovering a dhaba card opened a preview card over the map (`setSelectedId`)
but nothing ever cleared it, so it stayed open until manually dismissed.

**Fix:** `DhabaCard.tsx` gained an `onDeactivate` prop wired to
`onMouseLeave`/`onBlur` (open still triggers on `onMouseEnter`/`onFocus`).
`HomeInteractive.tsx` clears the selection only if the leaving card is still
the selected one — `setSelectedId(prev => prev === d.id ? null : prev)` —
so moving the cursor directly from card A to card B doesn't have A's
mouseleave wipe out B's mouseenter.

**Verified:** live interaction sequence tested via a same-origin iframe
harness (hover A → shows A; move A→B → switches to B; leave B → closes;
hover C → shows C; leave C → closes).

---

## 2026-07-01 — Home page: map no longer overlaps sticky header

**Commit:** [`1b2717e`](https://github.com/ankeetrg/DhabaRoute/commit/1b2717e)

The Leaflet map was rendering *over* the sticky header and search/filter bar
on scroll, while the dhaba list correctly scrolled underneath. Root cause:
Leaflet's own CSS gives its internal panes/controls/popups very high
z-indexes (panes 400, markers 600, popups 700, controls 1000), and
`.leaflet-container` wasn't forming its own stacking context, so those
elements escaped past the header/search bar's `z-30`.

**Fix:** added `position: relative; z-index: 0; isolation: isolate;` to
`.leaflet-container` in `src/app/globals.css`, containing Leaflet's internal
stacking context inside the map box so the sticky header always wins.

**Verified:** live on dhabaroute.com same day. Note: the Vercel/CDN deploy
needed a browser hard refresh to show — a normal reload served stale CSS.

---

<!--
When adding a new entry:
1. Newest entry goes at the top, right after this file's header.
2. Include: date, commit hash (linked), what changed, why (root cause if
   it's a bug fix), and how it was verified.
3. Screenshots: not yet wired into this file (the automation environment
   used to build these fixes can't reliably save browser screenshots to
   disk for committing). If/when that's solved, embed via
   ![alt](docs/screenshots/YYYY-MM-DD-slug.png) and add the file under
   docs/screenshots/.
-->
