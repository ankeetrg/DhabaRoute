import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { getAllSlugs, getDhabaBySlug, getAllDhabas } from "@/lib/dhabas";
import { distanceKm } from "@/lib/geo";
import { parseRoute } from "@/lib/parseRoute";
import { getDhabaPhotoSrc } from "@/lib/photo-url";
import type { Dhaba } from "@/lib/types";
import { DhabaCard } from "@/components/DhabaCard";
import { DhabaDetailMap } from "@/components/DhabaDetailMap";
import { DhabaHeroPhoto } from "@/components/DhabaHeroPhoto";
import { ContributeForm } from "@/components/ContributeForm";

// ── Detail page — design spec (Step 11) ───────────────────────────────────
//   Max-width 1056px, padding 24px top / 72px bottom
//   Breadcrumb: 13px, #8a7a6a → #1c1814 on hover, separator #e4d8c6
//   Hero: 280px, rounded-2xl
//   Route eyebrow: 11px, 700, uppercase, 0.08em, var(--accent), dot prefix
//   H1: clamp(28px,4vw,44px), Bricolage Grotesque 800, -0.01em
//   Tags: 999px radius, 11.5px; Vegetarian → sage tint
//   Info grid: 1.6fr/1fr, gap 16px; 1.5px #e8dfd4 border
//   Community card: max-width 580px, ghost button
//   Similar stops: auto-fill minmax(272px,1fr), gap 16px

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

  const others = getAllDhabas().filter((d) => d.slug !== dhaba.slug);
  const related = getRelatedDhabas(dhaba, others);

  const formattedAddress = dhaba.address?.replace(/,\s*USA$/, "");
  const cityState = cityStateFromAddress(dhaba.address);
  const phoneHref = dhaba.phone ? `tel:${dhaba.phone.replace(/\D/g, "")}` : null;
  const photoSrc = getDhabaPhotoSrc(dhaba);
  const aboutText =
    dhaba.description?.trim() ||
    "A listed dhaba-style stop on DhabaRoute. Details are being verified.";

  // Owner update form — Airtable with Dhaba Name + Slug pre-filled.
  // Submissions are reviewed and applied within 48h (per the helper text).
  const formUrl = `https://airtable.com/appsoULcfjfSmuKqL/shrt7RJTHxvGwFU01?prefill_Dhaba+Name=${encodeURIComponent(dhaba.title)}&prefill_Dhaba+Slug=${encodeURIComponent(dhaba.slug)}`;

  // Schema.org FoodEstablishment payload — only fields already on the
  // Dhaba type (no schema additions). Undefined values are stripped by
  // JSON.stringify so we don't emit empty keys.
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
      <article
        className="mx-auto w-full px-5 sm:px-8 pt-6 pb-[72px]"
        style={{ maxWidth: 1056 }}
      >
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
          <span
            aria-hidden
            className="mx-2"
            style={{ color: "#e4d8c6" }}
          >
            ·
          </span>
          <span style={{ color: "#1c1814" }} className="min-w-0 truncate">
            {dhaba.title}
          </span>
        </nav>

        {/* ── Hero photo ─────────────────────────────────────────────── */}
        {photoSrc ? (
          <DhabaHeroPhoto src={photoSrc} alt={dhaba.title} />
        ) : null}

        {/* ── Header block ───────────────────────────────────────────── */}
        <header
          className={photoSrc ? "mt-6" : "mt-5"}
          style={{ maxWidth: 760 }}
        >
          <RouteEyebrow routeHint={dhaba.routeHint} />

          <h1
            className="font-display font-extrabold leading-[1.08] break-words"
            style={{
              fontSize: "clamp(30px, 4.4vw, 48px)",
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
              style={{ fontSize: 15, color: "var(--ink-muted)" }}
            >
              {[cityState, dhaba.routeHint].filter(Boolean).join(" · ")}
            </p>
          ) : null}

          <TagList tags={dhaba.tags} />

          {dhaba.mapsUrl || phoneHref ? (
            <div className="mt-5 flex flex-col gap-2.5 sm:flex-row">
              {dhaba.mapsUrl ? (
                <PrimaryAction href={dhaba.mapsUrl}>Get directions</PrimaryAction>
              ) : null}
              {phoneHref ? (
                <SecondaryAction href={phoneHref}>Call {dhaba.phone}</SecondaryAction>
              ) : null}
            </div>
          ) : null}
        </header>

        {/* ── Decision support ──────────────────────────────────────── */}
        <section
          className="mt-7 grid grid-cols-1 lg:grid-cols-[1.45fr_1fr]"
          style={{ gap: 16 }}
        >
          <div className="space-y-4">
            <SectionCard title="Why stop here?">
              <p
                className="font-ui leading-[1.72]"
                style={{ fontSize: "16px", color: "#3c3128" }}
              >
                {aboutText}
              </p>
              {dhaba.needsReview && !dhaba.featured ? (
                <p className="mt-4 inline-flex items-center gap-1.5 font-ui text-[11px] text-ink-muted">
                  <span aria-hidden className="w-1 h-1 rounded-full bg-haldi" />
                  Community-submitted · pending review
                </p>
              ) : null}
            </SectionCard>

            <SectionCard title="Food and menu">
              <p
                className="font-ui leading-[1.65]"
                style={{ fontSize: 14, color: "var(--ink-soft)" }}
              >
                Menu details are being verified. Check with the restaurant before visiting.
              </p>
              {dhaba.tags.length > 0 ? (
                <p
                  className="mt-3 font-ui"
                  style={{ fontSize: "13px", color: "var(--ink-muted)" }}
                >
                  Listed cues: {dhaba.tags.join(", ")}
                </p>
              ) : null}
            </SectionCard>
          </div>

          <aside className="space-y-4">
            <SectionCard title="Quick facts">
              <FactList>
                <FactRow label="Address" value={formattedAddress ?? "Address being verified"} />
                <FactRow label="Route" value={dhaba.routeHint ?? "Route details being verified"} />
                <FactRow label="Area" value={cityState ?? "Location details being verified"} />
                <FactRow label="Phone" value={dhaba.phone ?? "Phone being verified"} href={phoneHref} />
                <FactRow
                  label="Useful for"
                  value={dhaba.tags.length > 0 ? dhaba.tags.join(", ") : "Traveler details being verified"}
                />
              </FactList>
            </SectionCard>

            <SectionCard title="Visit details">
              {dhaba.hours && dhaba.hours.length > 0 ? (
                <HoursList hours={dhaba.hours} />
              ) : (
                <p className="font-ui text-[13px] text-ink-muted">
                  Hours are being verified. Call before making a detour.
                </p>
              )}
              {dhaba.mapsUrl || phoneHref ? (
                <div className="mt-5 flex flex-col gap-2">
                  {dhaba.mapsUrl ? (
                    <PrimaryAction href={dhaba.mapsUrl}>Open in Google Maps</PrimaryAction>
                  ) : null}
                  {phoneHref ? (
                    <SecondaryAction href={phoneHref}>Call ahead</SecondaryAction>
                  ) : null}
                </div>
              ) : null}
            </SectionCard>
          </aside>
        </section>

        {/* ── Map ────────────────────────────────────────────────────── */}
        {dhaba.lat != null && dhaba.lng != null ? (
          <section className="mt-7 rounded-2xl overflow-hidden">
            <DhabaDetailMap dhaba={dhaba} />
          </section>
        ) : null}

        {/* ── Community card ─────────────────────────────────────────── */}
        <section className="mt-10">
          <div
            className="rounded-2xl"
            style={{
              maxWidth: 580,
              background: "#fff",
              border: "1.5px solid #e8dfd4",
              padding: "24px 28px",
              boxShadow: "0 1px 4px rgba(28,24,20,0.05)",
            }}
          >
            <p
              className="font-ui font-semibold uppercase"
              style={{
                fontSize: "10.5px",
                color: "#c4b4a4",
                letterSpacing: "0.08em",
              }}
            >
              Been here?
            </p>
            {contributed === "true" ? (
              <p className="mt-4 rounded-xl bg-leaf-soft border border-leaf-line text-leaf px-4 py-3 text-[14px] font-ui">
                Thanks for contributing — we&rsquo;ll add it to the listing soon.
              </p>
            ) : (
              <>
                <p
                  className="mt-2 font-ui leading-[1.65]"
                  style={{ fontSize: 15, color: "#3c3128" }}
                >
                  Share a photo or menu — help other drivers know what to expect.
                </p>
                <ContributeForm
                  dhabaTitle={dhaba.title}
                  dhabaSlug={dhaba.slug}
                />
              </>
            )}
          </div>
        </section>

        {/* ── Owner: update your listing ─────────────────────────────── */}
        <div className="max-w-[580px] mt-6">
          <p className="text-[11px] uppercase tracking-widest text-[var(--ink-muted)] mb-3">
            Is this your dhaba?
          </p>
          <a
            href={formUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full text-center py-3 rounded-xl border border-[var(--paper-warm)] text-[var(--ink-soft)] text-sm font-medium hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors duration-150"
          >
            Update your listing →
          </a>
          <p className="text-[12px] text-[var(--ink-muted)] text-center mt-2">
            Hours, photos, specials — we review and apply updates within 48 hours.
          </p>
        </div>

        {/* ── Similar stops ──────────────────────────────────────────── */}
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
              {related.map((d) => (
                <li key={d.id}>
                  <DhabaCard dhaba={d} />
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

function TagList({ tags }: { tags: string[] }) {
  if (tags.length === 0) return null;
  return (
    <ul className="mt-4 flex flex-wrap gap-1.5" role="list">
      {tags.map((tag) => {
        const isVeg = tag === "Vegetarian";
        return (
          <li key={tag}>
            <Link
              href={`/?tag=${encodeURIComponent(tag)}`}
              className="hover:opacity-80 transition inline-flex items-center gap-1 font-ui font-medium"
              style={{
                fontSize: "11.5px",
                borderRadius: 999,
                padding: "3px 10px",
                background: isVeg ? "rgba(107,142,95,0.10)" : "#f3ede2",
                border: isVeg
                  ? "1px solid rgba(107,142,95,0.30)"
                  : "1px solid #e4d8c6",
                color: isVeg ? "#3a7c52" : "#6a5a4a",
              }}
            >
              {isVeg ? (
                <span
                  aria-hidden
                  style={{
                    display: "inline-block",
                    width: 5,
                    height: 5,
                    borderRadius: "50%",
                    background: "#3a7c52",
                    flexShrink: 0,
                  }}
                />
              ) : null}
              {tag}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

function SectionCard({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section
      className="rounded-2xl"
      style={{
        background: "#fff",
        border: "1.5px solid #e8dfd4",
        padding: "22px 24px",
        boxShadow: "0 1px 4px rgba(28,24,20,0.05)",
      }}
    >
      <p
        className="font-ui font-semibold uppercase"
        style={{
          fontSize: "10.5px",
          color: "#c4b4a4",
          letterSpacing: "0.08em",
        }}
      >
        {title}
      </p>
      <div className="mt-3">{children}</div>
    </section>
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
      className="inline-flex h-11 items-center justify-center rounded-xl px-5 text-center font-ui font-semibold text-white transition-opacity duration-150 hover:opacity-[0.86]"
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
      className="inline-flex h-11 items-center justify-center rounded-xl border border-paper-warm bg-white px-5 text-center font-ui font-semibold transition-colors duration-150 hover:border-clay-300 hover:text-accent"
      style={{ fontSize: 14, color: "var(--ink-soft)" }}
    >
      {children}
    </a>
  );
}

function FactList({ children }: { children: ReactNode }) {
  return <dl className="space-y-3">{children}</dl>;
}

function FactRow({
  label,
  value,
  href,
}: {
  label: string;
  value: string;
  href?: string | null;
}) {
  return (
    <div>
      <dt
        className="font-ui font-semibold uppercase"
        style={{ fontSize: 10, color: "#c4b4a4", letterSpacing: "0.06em" }}
      >
        {label}
      </dt>
      <dd
        className="mt-1 font-ui leading-snug break-words"
        style={{ fontSize: 13.5 }}
      >
        {href ? (
          <a
            href={href}
            className="font-semibold transition-colors duration-150 hover:text-accent"
            style={{ color: "#1c1814" }}
          >
            {value}
          </a>
        ) : (
          <span style={{ color: "#3c3128" }}>{value}</span>
        )}
      </dd>
    </div>
  );
}

function HoursList({ hours }: { hours: string[] }) {
  return (
    <ul className="space-y-1.5">
      {hours.map((line, idx) => {
        const colonAt = line.indexOf(":");
        if (colonAt === -1) {
          return (
            <li
              key={`${line}-${idx}`}
              className="font-ui"
              style={{ fontSize: "12.5px", color: "#1c1814" }}
            >
              {line}
            </li>
          );
        }
        const day = line.slice(0, colonAt);
        const time = line.slice(colonAt + 1).trim();
        return (
          <li key={`${day}-${idx}`} className="flex justify-between gap-3">
            <span
              className="font-ui flex-none"
              style={{ fontSize: 10, color: "#9a8a7a" }}
            >
              {day}
            </span>
            <span
              className="font-ui text-right"
              style={{ fontSize: "12.5px", color: "#1c1814" }}
            >
              {time || "Closed"}
            </span>
          </li>
        );
      })}
    </ul>
  );
}

function getRelatedDhabas(dhaba: Dhaba, others: Dhaba[]): Dhaba[] {
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
    .map(({ candidate }) => candidate);
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
