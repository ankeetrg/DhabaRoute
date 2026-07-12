import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { type ReactNode } from "react";
import { getAllSlugs, getDhabaBySlug, getAllDhabas } from "@/lib/dhabas";
import { distanceKm } from "@/lib/geo";
import { parseRoute, highwaySlug } from "@/lib/parseRoute";
import { getDhabaPhotoSrc } from "@/lib/photo-url";
import type { Dhaba, DhabaMenu } from "@/lib/types";
import { DhabaCard } from "@/components/DhabaCard";
import { DhabaDetailMap } from "@/components/DhabaDetailMap";
import { DhabaHeroCarousel, type HeroSlide } from "@/components/DhabaHeroCarousel";
import { DetailTabs, type DetailTab } from "@/components/DetailTabs";
import { DetailActionChips } from "@/components/DetailActionChips";
import { ContributeCard } from "@/components/ContributeCard";
import { TodayStatus } from "@/components/TodayStatus";

// Detail page, 2026-07 redesign ("pull off the highway?" page).
//   Mobile-first single column with a sticky section-tab bar (Overview /
//   Amenities / Menu / Details / Nearby); desktop keeps the two-column
//   grid with the sticky sidebar. The spine of the page is the driver's
//   decision: photo carousel hero → identity + route strip → action chips
//   → trucker essentials → dishes → details → contribute → next stops.
//   Everything renders from fields that already exist in dhabas.json and
//   degrades gracefully when a field is missing — a brand-new CSV row
//   with just a title and address still produces a complete page.

const POPULAR_DISHES = [
  "aloo paratha",
  "paratha",
  "dal makhani",
  "dal",
  "masala chai",
  "chai",
  "biryani",
  "lassi",
  "paneer",
  "naan",
  "chole",
  "tandoori",
];

const DISH_KEYWORDS = [
  "paratha",
  "biryani",
  "dal",
  "chai",
  "roti",
  "naan",
  "curry",
  "tandoori",
  "lassi",
  "dosa",
  "samosa",
  "chaat",
  "thali",
  "paneer",
  "chole",
  "rice",
  "kebab",
] as const;

// Anchored sections sit under two sticky bars (60px header + ~46px tabs).
const SCROLL_MARGIN = 112;

type RouteParams = Promise<{ slug: string }>;

export function generateStaticParams() {
  return getAllSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: RouteParams;
}): Promise<Metadata> {
  const { slug } = await params;
  const dhaba = getDhabaBySlug(slug);
  if (!dhaba) return {};
  return {
    title: dhaba.routeHint
      ? `${dhaba.title} · ${dhaba.routeHint} | DhabaRoute`
      : `${dhaba.title} | DhabaRoute`,
    description:
      dhaba.description?.slice(0, 155) ??
      `Find ${dhaba.title} on DhabaRoute — a listed dhaba-style stop for your route.`,
    openGraph: {
      title: dhaba.title,
      description:
        dhaba.description?.slice(0, 155) ??
        `A listed dhaba-style stop for your route.`,
      url: `https://dhabaroute.com/dhabas/${dhaba.slug}`,
      siteName: "DhabaRoute",
      images: (dhaba.storedImageUrl ?? dhaba.imageUrl)
        ? [{ url: (dhaba.storedImageUrl ?? dhaba.imageUrl) as string, width: 800, height: 600, alt: dhaba.title }]
        : [],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: dhaba.title,
      description:
        dhaba.description?.slice(0, 155) ??
        `A listed dhaba-style stop for your route.`,
      images: (dhaba.storedImageUrl ?? dhaba.imageUrl)
        ? [(dhaba.storedImageUrl ?? dhaba.imageUrl) as string]
        : [],
    },
  };
}

export default async function DhabaDetailPage({
  params,
  searchParams,
}: {
  params: RouteParams;
  searchParams: Promise<{ contributed?: string }>;
}) {
  const { slug } = await params;
  const { contributed } = await searchParams;
  const dhaba = getDhabaBySlug(slug);
  if (!dhaba) notFound();

  const allDhabas = getAllDhabas();
  const others = allDhabas.filter((d) => d.slug !== dhaba.slug);
  const related = getRelatedDhabas(dhaba, others);
  const routeData = getRouteBadgeData(dhaba, allDhabas);

  const formattedAddress = dhaba.address?.replace(/,\s*USA$/, "");
  const cityState = cityStateFromAddress(dhaba.address);
  const phoneHref = dhaba.phone ? `tel:${dhaba.phone.replace(/\D/g, "")}` : null;
  const pageUrl = `https://dhabaroute.com/dhabas/${dhaba.slug}`;

  // Hero slides: the curated photos[] array when a listing has one,
  // otherwise the single stored/proxied photo. The carousel's arrows and
  // dots only appear once there is more than one slide.
  const slides: HeroSlide[] = (dhaba.photos ?? []).map((p) => ({
    src: p.url,
    alt: p.alt ?? dhaba.title,
    attribution: p.attribution,
  }));
  if (slides.length === 0) {
    const single = getDhabaPhotoSrc(dhaba);
    if (single) slides.push({ src: single, alt: dhaba.title });
  }

  // Menu source: structured menu first, fall back to keyword scan only when
  // the description is long enough (>60 chars) and mentions ≥2 dish keywords —
  // prevents low-signal menu sections for generic descriptions.
  const menuDishes = collectMenuDishes(dhaba.menu);
  const extractedDishes = extractDishes(dhaba.description);
  const dishesToShow =
    menuDishes.length > 0
      ? menuDishes
      : (dhaba.description ?? "").length > 60 && extractedDishes.length >= 2
        ? extractedDishes.map((d) => d.name)
        : [];

  const essentials = getEssentials(dhaba.tags, dhaba.hours);

  const tabs: DetailTab[] = [
    { id: "overview", label: "Overview" },
    { id: "essentials", label: "Amenities" },
    ...(dishesToShow.length > 0 ? [{ id: "menu", label: "Menu" }] : []),
    { id: "details", label: "Details" },
    ...(related.length > 0 ? [{ id: "nearby", label: "Nearby" }] : []),
  ];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FoodEstablishment",
    name: dhaba.title,
    description: dhaba.description ?? undefined,
    address: {
      "@type": "PostalAddress",
      streetAddress: dhaba.address ?? undefined,
      addressCountry: "US",
    },
    telephone: dhaba.phone ?? undefined,
    openingHours: dhaba.hours ?? undefined,
    servesCuisine: "Indian",
  };

  return (
    <>
      <article className="container-page pt-6 pb-[72px]">

        {/* ── Breadcrumb ─────────────────────────────────────────────── */}
        <nav
          aria-label="Breadcrumb"
          className="flex min-w-0 items-center font-ui"
          style={{ fontSize: 13, color: "#8a7a6a" }}
        >
          <Link
            href="/"
            className="transition-colors duration-150 hover:text-ink"
          >
            All dhabas
          </Link>
          <span aria-hidden className="mx-2" style={{ color: "#e4d8c6" }}>
            ·
          </span>
          <span style={{ color: "#1c1814" }} className="min-w-0 truncate">
            {dhaba.title}
          </span>
        </nav>

        {/* ── Hero photo carousel ────────────────────────────────────── */}
        <DhabaHeroCarousel slides={slides} hours={dhaba.hours} />

        {/* ── Two-column grid: content left | sidebar right ─────────── */}
        {/* Mobile: single column. md+: [1fr 296px] with sticky sidebar. */}
        <div className="mt-6 md:grid md:grid-cols-[minmax(0,1fr)_296px] md:gap-12 md:items-start">

          {/* ── LEFT COLUMN ────────────────────────────────────────── */}
          <div className="min-w-0">

            {/* Identity: eyebrow + title + city/state + open status */}
            <header>
              <RouteEyebrow routeHint={dhaba.routeHint} />
              <h1
                className="font-display font-extrabold leading-[1.08] break-words"
                style={{
                  fontSize: "clamp(26px, 5vw, 34px)",
                  color: "#1c1814",
                  letterSpacing: "-0.01em",
                  marginTop: dhaba.routeHint ? 8 : 0,
                  overflowWrap: "anywhere",
                }}
              >
                {dhaba.title}
              </h1>
              {cityState || dhaba.routeHint ? (
                <p
                  className="mt-2 font-ui leading-snug"
                  style={{ fontSize: 14, color: "var(--ink-muted)" }}
                >
                  {[cityState, dhaba.routeHint].filter(Boolean).join(" · ")}
                </p>
              ) : null}
              <TodayStatus hours={dhaba.hours} />
            </header>

            {/* Route strip — the line no city dining app can offer. */}
            {routeData ? (
              <Link
                href={routeData.href}
                className="mt-3 flex items-center gap-2 rounded-[10px] px-3.5 py-2.5 text-[12px] font-semibold"
                style={{
                  background: "rgba(26,107,71,0.10)",
                  border: "1px solid rgba(26,107,71,0.30)",
                  color: "#1a6b47",
                }}
              >
                <span
                  className="rounded-[6px] px-1.5 py-0.5 text-[11px] font-extrabold text-white"
                  style={{ background: "#1a6b47", letterSpacing: "0.03em" }}
                >
                  {routeData.highway}
                </span>
                {routeData.count} stops on this route →
              </Link>
            ) : null}

            {/* Action chips — every chip works today. */}
            <DetailActionChips
              mapsUrl={dhaba.mapsUrl}
              phone={dhaba.phone}
              phoneHref={phoneHref}
              hasMenuSection={dishesToShow.length > 0}
              shareTitle={dhaba.title}
              shareUrl={pageUrl}
            />

            {/* Sticky section tabs — mobile only; desktop has the sidebar. */}
            <div className="md:hidden">
              <DetailTabs tabs={tabs} />
            </div>

            {/* Overview: description */}
            <section id="overview" style={{ scrollMarginTop: SCROLL_MARGIN }}>
              {dhaba.description ? (
                <p className="font-ui text-[14px] leading-[1.7] text-[#3c3128] mt-5">
                  {dhaba.description}
                </p>
              ) : null}
            </section>

            {/* Trucker essentials — scannable in under a second. */}
            <section
              id="essentials"
              className="mt-6"
              style={{ scrollMarginTop: SCROLL_MARGIN }}
            >
              <SectionTitle>Trucker essentials</SectionTitle>
              <ul role="list" className="mt-3 grid grid-cols-2 gap-2">
                {essentials.map((tile) => (
                  <EssentialTile key={tile.label} {...tile} />
                ))}
              </ul>
            </section>

            {/* What's good here */}
            {dishesToShow.length > 0 ? (
              <section
                id="menu"
                className="mt-6"
                style={{ scrollMarginTop: SCROLL_MARGIN }}
              >
                <SectionTitle>What&rsquo;s good here</SectionTitle>
                <ul role="list" className="mt-3 flex flex-wrap gap-1.5">
                  {dishesToShow.map((dish, i) => {
                    const popular = isPopularDish(dish);
                    return (
                      <li
                        key={`${dish}-${i}`}
                        className="inline-flex items-center font-ui font-semibold"
                        style={{
                          fontSize: 12.5,
                          borderRadius: 999,
                          padding: "5px 12px",
                          background: popular
                            ? "rgba(223,96,40,0.10)"
                            : "#f3ede2",
                          border: popular
                            ? "1px solid rgba(223,96,40,0.30)"
                            : "1px solid #e4d8c6",
                          color: popular ? "var(--accent)" : "#6a5a4a",
                        }}
                      >
                        {dish}
                      </li>
                    );
                  })}
                </ul>
              </section>
            ) : null}

            {/* Details: facts + map — mobile only (desktop sidebar has them) */}
            <section
              id="details"
              className="mt-6 md:hidden"
              style={{ scrollMarginTop: SCROLL_MARGIN }}
            >
              <SectionTitle>Details</SectionTitle>
              <dl className="mt-3">
                {formattedAddress ? (
                  <Fact label="Address" value={formattedAddress} />
                ) : null}
                {dhaba.phone && phoneHref ? (
                  <Fact label="Phone" value={dhaba.phone} href={phoneHref} />
                ) : null}
                {dhaba.routeHint ? (
                  <Fact label="Route" value={dhaba.routeHint} />
                ) : null}
              </dl>
              {dhaba.lat != null && dhaba.lng != null ? (
                <div className="mt-4 rounded-2xl overflow-hidden">
                  <DhabaDetailMap dhaba={dhaba} />
                </div>
              ) : null}
            </section>

            {/* Been here? — compact card, expands to the full form. */}
            <section className="mt-8">
              <ContributeCard
                dhabaTitle={dhaba.title}
                dhabaSlug={dhaba.slug}
                contributed={contributed === "true"}
              />
            </section>

            {/* Owner: claim listing */}
            <div className="mt-8">
              <p className="text-[11px] uppercase tracking-widest text-[var(--ink-muted)] mb-3">
                Is this your dhaba?
              </p>
              <Link
                href={`/claim?dhaba=${dhaba.slug}`}
                className="block w-full text-center py-3 rounded-xl border border-[var(--paper-warm)] text-[var(--ink-soft)] text-sm font-medium hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors duration-150"
              >
                Claim this listing →
              </Link>
              <p className="text-[12px] text-[var(--ink-muted)] text-center mt-2">
                Verified listings rank above unclaimed stops on route pages.
              </p>
            </div>

          </div>{/* end LEFT COLUMN */}

          {/* ── RIGHT SIDEBAR — desktop only ───────────────────────── */}
          <aside className="hidden md:flex md:flex-col md:gap-3 md:sticky md:top-24">

            {/* CTAs */}
            {dhaba.mapsUrl || phoneHref ? (
              <div className="flex flex-col gap-2">
                {dhaba.mapsUrl ? (
                  <PrimaryAction href={dhaba.mapsUrl}>Get directions</PrimaryAction>
                ) : null}
                {phoneHref ? (
                  <SecondaryAction href={phoneHref}>
                    Call · {dhaba.phone}
                  </SecondaryAction>
                ) : null}
              </div>
            ) : null}

            <Divider />

            {/* Fact rows */}
            <dl className="mt-0">
              {formattedAddress ? (
                <Fact label="Address" value={formattedAddress} />
              ) : null}
              {dhaba.phone && phoneHref ? (
                <Fact label="Phone" value={dhaba.phone} href={phoneHref} />
              ) : null}
              {dhaba.routeHint ? (
                <Fact label="Route" value={dhaba.routeHint} />
              ) : null}
            </dl>

            {/* Map */}
            {dhaba.lat != null && dhaba.lng != null ? (
              <section className="rounded-2xl overflow-hidden">
                <DhabaDetailMap dhaba={dhaba} height="210px" />
              </section>
            ) : null}

          </aside>{/* end RIGHT SIDEBAR */}

        </div>{/* end grid */}

        {/* ── Next stops — full width below grid ─────────────────────── */}
        {related.length > 0 ? (
          <section
            id="nearby"
            className="mt-12"
            style={{ scrollMarginTop: SCROLL_MARGIN }}
          >
            <h2
              className="font-ui font-bold"
              style={{ fontSize: 19, color: "#1c1814" }}
            >
              {routeData ? `Next stops on ${routeData.highway}` : "Similar stops"}
            </h2>
            <ul
              role="list"
              className="mt-5"
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(272px, 1fr))",
                gap: 16,
              }}
            >
              {related.map((r) => (
                <li key={r.dhaba.id}>
                  <DhabaCard
                    dhaba={r.dhaba}
                    distanceLabel={
                      r.distanceMi != null ? `${r.distanceMi} mi` : undefined
                    }
                  />
                </li>
              ))}
            </ul>
          </section>
        ) : null}

      </article>
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </>
  );
}

// ── Layout primitives ─────────────────────────────────────────────────────

function Divider() {
  return (
    <hr
      style={{
        border: "none",
        borderTop: "1px solid #ede5da",
        margin: "18px 0",
      }}
    />
  );
}

function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <h2
      className="font-ui font-bold"
      style={{ fontSize: 16.5, color: "#1c1814" }}
    >
      {children}
    </h2>
  );
}

function RouteEyebrow({ routeHint }: { routeHint?: string }) {
  if (!routeHint) return null;
  return (
    <p
      className="inline-flex items-center gap-1.5 font-ui font-bold uppercase"
      style={{
        fontSize: 11,
        letterSpacing: "0.08em",
        color: "var(--accent)",
        flexWrap: "wrap",
      }}
    >
      <span
        aria-hidden
        style={{
          display: "inline-block",
          width: 5,
          height: 5,
          borderRadius: "50%",
          background: "var(--accent)",
          flexShrink: 0,
        }}
      />
      On Route · {routeHint}
    </p>
  );
}

function PrimaryAction({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="w-full inline-flex h-11 items-center justify-center rounded-xl px-5 text-center font-ui font-semibold text-white transition-opacity duration-150 hover:opacity-[0.86]"
      style={{ background: "var(--accent)", fontSize: 14 }}
    >
      {children}
    </a>
  );
}

function SecondaryAction({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  return (
    <a
      href={href}
      className="w-full inline-flex h-11 items-center justify-center rounded-xl border border-paper-warm bg-white px-5 text-center font-ui font-semibold transition-colors duration-150 hover:border-clay-300 hover:text-accent"
      style={{ fontSize: 14, color: "var(--ink-soft)" }}
    >
      {children}
    </a>
  );
}

function Fact({
  label,
  value,
  href,
}: {
  label: string;
  value: string;
  href?: string | null;
}) {
  return (
    <div className="flex gap-3 mb-3">
      <dt className="font-ui font-bold uppercase text-[10px] tracking-[0.06em] text-[#c4b4a4] w-14 flex-none pt-px">
        {label}
      </dt>
      <dd className="font-ui text-[13px] text-[#3c3128] min-w-0 break-words">
        {href ? (
          <a
            href={href}
            className="font-semibold transition-opacity duration-150 hover:opacity-80"
            style={{ color: "#df6028" }}
          >
            {value}
          </a>
        ) : (
          value
        )}
      </dd>
    </div>
  );
}

// ── Trucker essentials ─────────────────────────────────────────────────────
// The four things a driver filters by, answerable in under a second.
// A missing tag renders as "Not listed" — data absence is unknown, not "no",
// and honest gaps build more trust than hidden ones.

interface EssentialTileData {
  label: string;
  icon: "truck" | "shower" | "fuel" | "wc" | "clock";
  status: string;
  yes: boolean;
}

function getEssentials(
  tags: string[],
  hours: string[] | undefined,
): EssentialTileData[] {
  const has = (...keywords: string[]) =>
    tags.some((t) => keywords.some((k) => t.toLowerCase().includes(k)));
  const open24 = (hours ?? []).some((line) => line.includes("24"));

  return [
    {
      label: "Truck parking",
      icon: "truck",
      yes: has("truck"),
      status: has("truck") ? "Yes" : "Not listed",
    },
    {
      label: open24 ? "Open 24 hours" : "Showers",
      icon: open24 ? "clock" : "shower",
      yes: open24 || has("shower"),
      status: open24 ? "Yes" : has("shower") ? "Yes" : "Not listed",
    },
    {
      label: "Gas / fuel",
      icon: "fuel",
      yes: has("gas", "fuel"),
      status: has("gas", "fuel") ? "Yes" : "Not listed",
    },
    {
      label: "Bathrooms",
      icon: "wc",
      yes: has("bathroom", "restroom"),
      status: has("bathroom", "restroom") ? "Yes" : "Not listed",
    },
  ];
}

function EssentialTile({ label, icon, status, yes }: EssentialTileData) {
  return (
    <li
      className="flex items-center gap-2.5 rounded-xl font-ui font-semibold"
      style={{
        fontSize: 12.5,
        padding: "11px 12px",
        background: yes ? "rgba(19,136,8,0.07)" : "#ffffff",
        border: yes
          ? "1px solid rgba(19,136,8,0.25)"
          : "1px solid #e4d8c6",
        color: yes ? "#1a6b47" : "#8a7a6a",
      }}
    >
      <EssentialIcon icon={icon} yes={yes} />
      <span className="min-w-0 truncate">{label}</span>
      <span
        className="ml-auto flex-none font-bold uppercase"
        style={{ fontSize: 10.5, color: yes ? "#138808" : "#c4b4a4" }}
      >
        {status}
      </span>
    </li>
  );
}

function EssentialIcon({
  icon,
  yes,
}: {
  icon: EssentialTileData["icon"];
  yes: boolean;
}) {
  const paths: Record<EssentialTileData["icon"], ReactNode> = {
    truck: (
      <>
        <path d="M1 8h13v8H1zM14 11h4l3 3v2h-7z" />
        <circle cx="6" cy="18" r="1.8" />
        <circle cx="17.5" cy="18" r="1.8" />
      </>
    ),
    shower: (
      <>
        <path d="M4 21V6a3 3 0 0 1 6 0v1" />
        <path d="M7 7h6" />
        <path d="M10 11v.01M13 11v.01M16 11v.01M10 15v.01M13 15v.01M16 15v.01M13 19v.01" />
      </>
    ),
    fuel: (
      <>
        <path d="M4 21V5a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v16M14 8h3a2 2 0 0 1 2 2v7a1.5 1.5 0 0 0 3 0V9l-3-3" />
        <path d="M3 21h12" />
      </>
    ),
    wc: (
      <>
        <circle cx="12" cy="5" r="2" />
        <path d="M9 22v-6H7l2.5-7h5L17 16h-2v6" />
      </>
    ),
    clock: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </>
    ),
  };
  return (
    <svg
      viewBox="0 0 24 24"
      className="w-[18px] h-[18px] flex-none"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ color: yes ? "#138808" : "#c4b4a4" }}
      aria-hidden
    >
      {paths[icon]}
    </svg>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────

function collectMenuDishes(menu: DhabaMenu | undefined): string[] {
  if (!menu?.categories?.length) return [];
  const names: string[] = [];
  for (const cat of menu.categories) {
    if (!cat.items) continue;
    for (const item of cat.items) {
      if (item.name) names.push(item.name);
    }
  }
  return names;
}

function isPopularDish(dish: string): boolean {
  const lower = dish.toLowerCase();
  return POPULAR_DISHES.some((p) => lower.includes(p));
}

function extractDishes(
  description: string | undefined,
): Array<{ name: string; note: string }> {
  if (!description) return [];
  const segments = description
    .split(/[.,]/)
    .map((s) => s.trim())
    .filter(Boolean);
  const found: Array<{ name: string; note: string }> = [];
  const seen = new Set<string>();
  for (const keyword of DISH_KEYWORDS) {
    if (found.length >= 3) break;
    if (seen.has(keyword)) continue;
    const segment = segments.find((s) => s.toLowerCase().includes(keyword));
    if (!segment) continue;
    seen.add(keyword);
    const name = keyword.charAt(0).toUpperCase() + keyword.slice(1);
    const note = segment.length > 60 ? segment.slice(0, 60).trim() + "…" : segment;
    found.push({ name, note });
  }
  return found;
}

function getRelatedDhabas(
  dhaba: Dhaba,
  others: Dhaba[],
): Array<{ dhaba: Dhaba; distanceMi: number | null }> {
  const here =
    typeof dhaba.lat === "number" && typeof dhaba.lng === "number"
      ? { lat: dhaba.lat, lng: dhaba.lng }
      : null;
  const currentRoute = parseRoute(dhaba.routeHint);
  const currentState = currentRoute.state ?? stateCodeFromAddress(dhaba.address);

  return others
    .map((candidate, index) => {
      const candidateRoute = parseRoute(candidate.routeHint);
      const candidateState =
        candidateRoute.state ?? stateCodeFromAddress(candidate.address);
      const sharedTags = candidate.tags.filter((tag) =>
        dhaba.tags.includes(tag),
      ).length;
      const km =
        here &&
        typeof candidate.lat === "number" &&
        typeof candidate.lng === "number"
          ? distanceKm(here, { lat: candidate.lat, lng: candidate.lng })
          : Number.POSITIVE_INFINITY;

      let score = sharedTags * 6;
      if (
        currentRoute.highway &&
        candidateRoute.highway === currentRoute.highway
      ) {
        score += 14;
      }
      if (currentState && candidateState === currentState) {
        score += 10;
      }
      if (Number.isFinite(km)) {
        if (km <= 100) score += 20;
        else if (km <= 250) score += 14;
        else if (km <= 800) score += 6;
      }

      return { candidate, index, km, score };
    })
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      if (a.km !== b.km) return a.km - b.km;
      return a.index - b.index;
    })
    .slice(0, 3)
    .map(({ candidate, km }) => ({
      dhaba: candidate,
      distanceMi: Number.isFinite(km) ? Math.round(km * 0.621) : null,
    }));
}

function getRouteBadgeData(
  dhaba: Dhaba,
  all: Dhaba[],
): { highway: string; count: number; href: string } | null {
  const highway = parseRoute(dhaba.routeHint).highway;
  if (!highway) return null;
  const count = all.filter(
    (d) => d.slug !== dhaba.slug && parseRoute(d.routeHint).highway === highway,
  ).length;
  return { highway, count, href: `/routes/${highwaySlug(highway)}` };
}

function cityStateFromAddress(address: string | undefined): string | null {
  if (!address) return null;
  const parts = address
    .replace(/,\s*(USA|Canada)$/i, "")
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
  if (parts.length < 2) return null;
  const statePart = parts[parts.length - 1]
    .replace(/\s+\d{5}(-\d{4})?$/, "")
    .replace(/\s+[A-Z]\d[A-Z]\s*\d[A-Z]\d$/i, "")
    .trim();
  const cityPart = parts[parts.length - 2];
  if (!cityPart || !statePart) return null;
  return `${cityPart}, ${statePart}`;
}

function stateCodeFromAddress(address: string | undefined): string | null {
  const cityState = cityStateFromAddress(address);
  return cityState?.match(/\b[A-Z]{2}\b/)?.[0] ?? null;
}
