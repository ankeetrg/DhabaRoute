import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Fragment, type ReactNode } from "react";
import { getAllSlugs, getDhabaBySlug, getAllDhabas } from "@/lib/dhabas";
import { distanceKm } from "@/lib/geo";
import { parseRoute, highwaySlug } from "@/lib/parseRoute";
import { getOpenStatus } from "@/lib/isOpenNow";
import { getDhabaPhotoSrc } from "@/lib/photo-url";
import type { Dhaba, DhabaMenu } from "@/lib/types";
import { DhabaCard } from "@/components/DhabaCard";
import { DhabaDetailMap } from "@/components/DhabaDetailMap";
import { DhabaHeroPhoto } from "@/components/DhabaHeroPhoto";
import { ContributeForm } from "@/components/ContributeForm";
import { TodayStatus } from "@/components/TodayStatus";

// Mobile-first detail page.
//   Single column at every breakpoint — no grid, no cards. Sections separated
//   by thin <hr> dividers; whitespace + typography do the work. CTAs land
//   above the fold immediately under the title.
//   POPULAR_DISHES drives the saffron highlight inside the inline "On the menu"
//   line; the same constant is reused whether dishes come from the structured
//   menu or fall back to keyword extraction from the description.

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
      images: dhaba.imageUrl
        ? [{ url: dhaba.imageUrl, width: 800, height: 600, alt: dhaba.title }]
        : [],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: dhaba.title,
      description:
        dhaba.description?.slice(0, 155) ??
        `A listed dhaba-style stop for your route.`,
      images: dhaba.imageUrl ? [dhaba.imageUrl] : [],
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
  const photoSrc = getDhabaPhotoSrc(dhaba);

  // Menu source: structured menu first, fall back to keyword scan of the
  // description. Empty result → skip the section entirely.
  const menuDishes = collectMenuDishes(dhaba.menu);
  const dishesToShow =
    menuDishes.length > 0
      ? menuDishes
      : extractDishes(dhaba.description).map((d) => d.name);

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

        {/* ── Hero photo — full container width ─────────────────────── */}
        {photoSrc ? (
          <DhabaHeroPhoto src={photoSrc} alt={dhaba.title} hours={dhaba.hours} />
        ) : null}

        {/* ── Two-column grid: content left | sidebar right ─────────── */}
        {/* Mobile: single column. md+: [1fr 296px] with sticky sidebar. */}
        <div className="mt-6 md:grid md:grid-cols-[minmax(0,1fr)_296px] md:gap-12 md:items-start">

          {/* ── LEFT COLUMN ────────────────────────────────────────── */}
          <div className="min-w-0">

            {/* Header: eyebrow + title + city/state */}
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
            </header>

            {/* CTAs — mobile only (desktop gets them in the sidebar) */}
            {dhaba.mapsUrl || phoneHref ? (
              <div className="mt-4 flex flex-col gap-2 md:hidden">
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

            {/* Open status — mobile only */}
            <div className="md:hidden">
              <Divider />
              <TodayStatus hours={dhaba.hours} />
            </div>

            {/* Description */}
            {dhaba.description ? (
              <p className="font-ui text-[14px] leading-[1.7] text-[#3c3128] mt-4">
                {dhaba.description}
              </p>
            ) : null}

            {/* Amenity pills */}
            <AmenityStrip tags={dhaba.tags} hours={dhaba.hours} />

            {/* On the menu */}
            {dishesToShow.length > 0 ? (
              <>
                <Divider />
                <section>
                  <p className="font-ui font-bold uppercase text-[9.5px] tracking-[0.07em] text-[#c4b4a4] mb-2">
                    On the menu
                  </p>
                  <p className="font-ui text-[13.5px] leading-[1.65] text-[#3c3128]">
                    {dishesToShow.map((dish, i) => (
                      <Fragment key={`${dish}-${i}`}>
                        {i > 0 ? ", " : ""}
                        {isPopularDish(dish) ? (
                          <span style={{ color: "#df6028", fontWeight: 600 }}>
                            {dish}
                          </span>
                        ) : (
                          dish
                        )}
                      </Fragment>
                    ))}
                  </p>
                </section>
              </>
            ) : null}

            {/* Facts + route badge + map — mobile only */}
            <div className="md:hidden">
              <Divider />
              <dl>
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
              {routeData ? (
                <Link
                  href={routeData.href}
                  className="mt-2 flex items-center gap-2 rounded-[10px] px-3.5 py-2.5 text-[12px] font-semibold"
                  style={{
                    background: "rgba(26,107,71,0.10)",
                    border: "1px solid rgba(26,107,71,0.30)",
                    color: "#1a6b47",
                  }}
                >
                  {routeData.highway} · {routeData.count} stops on this route →
                </Link>
              ) : null}
              {dhaba.lat != null && dhaba.lng != null ? (
                <section className="mt-6 rounded-2xl overflow-hidden">
                  <DhabaDetailMap dhaba={dhaba} />
                </section>
              ) : null}
            </div>

            {/* Been here? */}
            <section className="mt-10">
              <p
                className="font-ui font-semibold uppercase"
                style={{ fontSize: "10.5px", color: "#c4b4a4", letterSpacing: "0.08em" }}
              >
                Been here?
              </p>
              {contributed === "true" ? (
                <p
                  className="mt-4 rounded-xl px-4 py-3 text-[14px] font-ui"
                  style={{
                    background: "#f0f7f0",
                    color: "#1a6b47",
                    border: "1px solid rgba(26,107,71,0.20)",
                  }}
                >
                  Thanks for contributing — we&rsquo;ll add it to the listing soon.
                </p>
              ) : (
                <>
                  <p
                    className="mt-2 font-ui leading-[1.65]"
                    style={{ fontSize: 14, color: "#3c3128" }}
                  >
                    Share a photo or menu — help other drivers know what to expect.
                  </p>
                  <ContributeForm dhabaTitle={dhaba.title} dhabaSlug={dhaba.slug} />
                </>
              )}
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

            {/* Open status + today's hours */}
            <TodayStatus hours={dhaba.hours} />

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

            {/* Route badge */}
            {routeData ? (
              <Link
                href={routeData.href}
                className="flex items-center gap-2 rounded-[10px] px-3.5 py-2.5 text-[12px] font-semibold"
                style={{
                  background: "rgba(26,107,71,0.10)",
                  border: "1px solid rgba(26,107,71,0.30)",
                  color: "#1a6b47",
                }}
              >
                {routeData.highway} · {routeData.count} stops on this route →
              </Link>
            ) : null}

            {/* Map */}
            {dhaba.lat != null && dhaba.lng != null ? (
              <section className="rounded-2xl overflow-hidden">
                <DhabaDetailMap dhaba={dhaba} height="210px" />
              </section>
            ) : null}

          </aside>{/* end RIGHT SIDEBAR */}

        </div>{/* end grid */}

        {/* ── Similar stops — full width below grid ──────────────────── */}
        {related.length > 0 ? (
          <section className="mt-12">
            <h2
              className="font-ui font-bold"
              style={{ fontSize: 19, color: "#1c1814" }}
            >
              Similar stops
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

function AmenityStrip({
  tags,
  hours,
}: {
  tags: string[];
  hours: string[] | undefined;
}) {
  const tiles: string[] = [];
  if (tags.some((t) => t.includes("Truck"))) tiles.push("Truck parking");
  if (
    getOpenStatus(hours) === "open" &&
    (hours ?? []).some((line) => line.includes("24"))
  ) {
    tiles.push("24 hours");
  }
  if (tags.some((t) => t.includes("Gas"))) tiles.push("Gas");
  if (tags.some((t) => t.includes("Shower"))) tiles.push("Showers");

  if (tiles.length === 0) return null;

  const priority = (label: string) =>
    label === "Truck parking" || label === "24 hours";

  return (
    <ul role="list" className="mt-3 flex flex-wrap gap-1.5">
      {tiles.map((label) => {
        const isPriority = priority(label);
        return (
          <li
            key={label}
            className="inline-flex items-center font-medium"
            style={{
              fontSize: "11.5px",
              borderRadius: 999,
              padding: "3px 10px",
              background: isPriority ? "rgba(19,136,8,0.07)" : "#f3ede2",
              border: isPriority
                ? "1px solid rgba(19,136,8,0.25)"
                : "1px solid #e4d8c6",
              color: isPriority ? "#1a6b47" : "#6a5a4a",
            }}
          >
            {label}
          </li>
        );
      })}
    </ul>
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
