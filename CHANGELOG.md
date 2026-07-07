# Changelog

A log of user-facing fixes and features pushed to `main`, kept alongside the
code so the history survives outside chat history. Newest entries first.

Each entry: date, commit hash, what changed, why, and how it was verified.

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
