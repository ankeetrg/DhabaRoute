import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getAllSlugs, getDhabaBySlug, getAllDhabas } from "@/lib/dhabas";
import { distanceKm } from "@/lib/geo";
import { DhabaCard } from "@/components/DhabaCard";
import { DhabaDetailMap } from "@/components/DhabaDetailMap";
import { DhabaPhoto } from "@/components/DhabaPhoto";
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
    title: `${dhaba.title} · ${dhaba.routeHint ?? "US Truck Route"} | DhabaRoute`,
    description:
      dhaba.description?.slice(0, 155) ??
      `Find ${dhaba.title} on DhabaRoute — verified dhaba with real food on your route.`,
    openGraph: {
      title: dhaba.title,
      description:
        dhaba.description?.slice(0, 155) ??
        `Verified dhaba on your route.`,
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
        `Verified dhaba on your route.`,
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

  // Similar stops: first try tag-based matches. Fall back to proximity
  // or array order so the section always gives the driver somewhere else to go.
  const others = getAllDhabas().filter((d) => d.slug !== dhaba.slug);
  const tagRelated = others.filter((d) =>
    d.tags.some((t) => dhaba.tags.includes(t)),
  );

  let related = tagRelated.slice(0, 3);
  if (related.length === 0) {
    if (dhaba.lat != null && dhaba.lng != null) {
      const here = { lat: dhaba.lat, lng: dhaba.lng };
      related = [...others]
        .map((d) => {
          if (typeof d.lat !== "number" || typeof d.lng !== "number") {
            return { d, km: Number.POSITIVE_INFINITY };
          }
          return { d, km: distanceKm(here, { lat: d.lat, lng: d.lng }) };
        })
        .sort((a, b) => a.km - b.km)
        .slice(0, 3)
        .map((x) => x.d);
    } else {
      related = others.slice(0, 3);
    }
  }

  const hasGetThere = Boolean(dhaba.address || dhaba.routeHint);

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
        className="font-ui"
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
        <span style={{ color: "#1c1814" }} className="truncate">
          {dhaba.title}
        </span>
      </nav>

      {/* ── Hero photo ─────────────────────────────────────────────── */}
      {dhaba.imageUrl ? (
        <figure className="mt-5">
          <DhabaPhoto
            src={dhaba.imageUrl}
            alt={dhaba.title}
            className="w-full h-[280px] rounded-2xl"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 80vw, 1024px"
            priority
          />
          <figcaption
            className="mt-1 font-ui text-right"
            style={{ fontSize: 11, color: "#c4b4a4" }}
          >
            Photo via Google
          </figcaption>
        </figure>
      ) : null}

      {/* ── Header block ───────────────────────────────────────────── */}
      <header
        className={dhaba.imageUrl ? "mt-6" : "mt-5"}
        style={{ maxWidth: 680 }}
      >
        {/* Route eyebrow */}
        {dhaba.routeHint ? (
          <p
            className="inline-flex items-center gap-1.5 font-ui font-bold uppercase"
            style={{
              fontSize: 11,
              letterSpacing: "0.08em",
              color: "var(--accent)",
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
            On Route · {dhaba.routeHint}
          </p>
        ) : null}

        {/* H1 */}
        <h1
          className="font-display font-extrabold leading-[1.08]"
          style={{
            fontSize: "clamp(28px, 4vw, 44px)",
            color: "#1c1814",
            letterSpacing: "-0.01em",
            marginTop: dhaba.routeHint ? 8 : 0,
          }}
        >
          {dhaba.title}
        </h1>

        {/* Tag pills */}
        {dhaba.tags.length > 0 ? (
          <ul className="mt-4 flex flex-wrap gap-1.5" role="list">
            {dhaba.tags.map((t) => {
              const isVeg = t === "Vegetarian";
              return (
                <li key={t}>
                  <Link
                    href={`/?tag=${encodeURIComponent(t)}`}
                    className="hover:opacity-80 transition inline-flex items-center gap-1 font-ui font-medium"
                    style={{
                      fontSize: "11.5px",
                      borderRadius: 999,
                      padding: "3px 10px",
                      background: isVeg
                        ? "rgba(107,142,95,0.10)"
                        : "#f3ede2",
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
                    {t}
                  </Link>
                </li>
              );
            })}
          </ul>
        ) : null}
      </header>

      {/* ── Map ────────────────────────────────────────────────────── */}
      {dhaba.lat != null && dhaba.lng != null ? (
        <section className="mt-7 rounded-2xl overflow-hidden">
          <DhabaDetailMap dhaba={dhaba} />
        </section>
      ) : null}

      {/* ── Info grid ─────────────────────────────────────────────── */}
      <section
        className="mt-6 grid grid-cols-1 lg:grid-cols-[1.6fr_1fr]"
        style={{ gap: 16 }}
      >
        {/* Left panel — About */}
        <div
          className="rounded-2xl"
          style={{
            background: "#fff",
            border: "1.5px solid #e8dfd4",
            padding: "24px 26px",
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
            About
          </p>
          {dhaba.description ? (
            <p
              className="mt-3 font-ui leading-[1.78]"
              style={{ fontSize: "16.5px", color: "#3c3128" }}
            >
              {dhaba.description}
            </p>
          ) : (
            // No hand-written description — point users to the source of truth.
            <p
              className="mt-3 font-ui leading-[1.78]"
              style={{ fontSize: "15.5px", color: "var(--ink-muted)" }}
            >
              {dhaba.mapsUrl ? (
                <>
                  More info on{" "}
                  <a
                    href={dhaba.mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline decoration-paper-warm underline-offset-2 hover:decoration-accent"
                    style={{ color: "var(--accent)" }}
                  >
                    Google Maps
                  </a>
                  {" "}— hours, photos, and reviews.
                </>
              ) : (
                "No description yet."
              )}
            </p>
          )}

          {/* Route sub-section */}
          {dhaba.routeHint ? (
            <>
              <div
                aria-hidden
                style={{
                  height: 1,
                  background: "#f3ede2",
                  margin: "16px 0",
                }}
              />
              <p
                className="font-ui font-semibold uppercase"
                style={{
                  fontSize: 11,
                  color: "#c4b4a4",
                  letterSpacing: "0.06em",
                }}
              >
                Route
              </p>
              <p
                className="mt-1 font-ui font-medium"
                style={{ fontSize: 14, color: "#1c1814" }}
              >
                {dhaba.routeHint}
              </p>
            </>
          ) : null}

          {dhaba.needsReview && !dhaba.featured ? (
            <p className="mt-6 inline-flex items-center gap-1.5 font-ui text-[11px] text-ink-muted">
              <span aria-hidden className="w-1 h-1 rounded-full bg-haldi" />
              Community-submitted · pending review
            </p>
          ) : null}
        </div>

        {/* Right panel — Sidebar */}
        <aside
          className="rounded-2xl flex flex-col"
          style={{
            background: "#fff",
            border: "1.5px solid #e8dfd4",
            padding: "24px 26px",
            boxShadow: "0 1px 4px rgba(28,24,20,0.05)",
            gap: 20,
          }}
        >
          {/* Get there */}
          {hasGetThere ? (
            <div>
              <p
                className="font-ui font-semibold uppercase"
                style={{
                  fontSize: "10.5px",
                  color: "#c4b4a4",
                  letterSpacing: "0.08em",
                }}
              >
                Get there
              </p>
              {dhaba.address ? (
                <p
                  className="mt-2 font-ui leading-snug"
                  style={{ fontSize: "13.5px", color: "#3c3128" }}
                >
                  {dhaba.address.replace(/,\s*USA$/, "")}
                </p>
              ) : dhaba.routeHint ? (
                <p
                  className="mt-2 font-ui"
                  style={{ fontSize: "13.5px", color: "#3c3128" }}
                >
                  {dhaba.routeHint}
                </p>
              ) : null}
              {dhaba.mapsUrl ? (
                <a
                  href={dhaba.mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-flex items-center gap-1.5 font-ui transition-colors duration-150 hover:text-accent"
                  style={{ fontSize: "12.5px", color: "#9a8a7a" }}
                >
                  <svg
                    aria-hidden
                    viewBox="0 0 14 14"
                    width="12"
                    height="12"
                    fill="currentColor"
                    className="flex-none"
                  >
                    <path d="M7 1a4.5 4.5 0 00-4.5 4.5c0 3.15 3.96 7.02 4.14 7.2a.54.54 0 00.72 0C7.54 12.52 11.5 8.65 11.5 5.5A4.5 4.5 0 007 1zm0 6a1.5 1.5 0 110-3 1.5 1.5 0 010 3z" />
                  </svg>
                  Open in Google Maps ↗
                </a>
              ) : null}
            </div>
          ) : null}

          {/* Phone */}
          {dhaba.phone ? (
            <div>
              <p
                className="font-ui font-semibold uppercase"
                style={{
                  fontSize: "10.5px",
                  color: "#c4b4a4",
                  letterSpacing: "0.08em",
                }}
              >
                Phone
              </p>
              <a
                href={`tel:${dhaba.phone.replace(/\D/g, "")}`}
                className="mt-2 font-ui font-semibold block transition-colors duration-150 hover:text-accent"
                style={{ fontSize: 16, color: "#1c1814" }}
              >
                {dhaba.phone}
              </a>
            </div>
          ) : null}

          {/* Hours */}
          {dhaba.hours && dhaba.hours.length > 0 ? (
            <div>
              <p
                className="font-ui font-semibold uppercase"
                style={{
                  fontSize: "10.5px",
                  color: "#c4b4a4",
                  letterSpacing: "0.08em",
                }}
              >
                Hours
              </p>
              <ul className="mt-2 space-y-1.5">
                {dhaba.hours.map((line, idx) => {
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
                    <li
                      key={`${day}-${idx}`}
                      className="flex justify-between gap-3"
                    >
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
            </div>
          ) : null}

          {/* Primary CTA — View on Google Maps */}
          {dhaba.mapsUrl ? (
            <a
              href={dhaba.mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-auto flex items-center justify-center font-ui font-semibold text-white transition-opacity duration-150 hover:opacity-[0.82]"
              style={{
                height: 44,
                borderRadius: 12,
                background: "var(--accent)",
                fontSize: 14,
              }}
            >
              View on Google Maps →
            </a>
          ) : null}
        </aside>
      </section>

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
