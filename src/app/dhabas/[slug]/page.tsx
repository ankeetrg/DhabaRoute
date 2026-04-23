import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getAllSlugs, getDhabaBySlug, getAllDhabas } from "@/lib/dhabas";
import { DEFAULT_DHABA_DESCRIPTION } from "@/lib/types";
import { distanceKm } from "@/lib/geo";
import { Tag } from "@/components/Tag";
import { DhabaCard } from "@/components/DhabaCard";
import { DhabaDetailMap } from "@/components/DhabaDetailMap";
import { ContributeForm } from "@/components/ContributeForm";

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
  const d = getDhabaBySlug(slug);
  if (!d) return { title: "Dhaba not found" };
  return {
    title: d.title,
    description:
      d.description ??
      `${d.title} — authentic dhaba${d.routeHint ? ` on ${d.routeHint}` : ""}.`,
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

  // Similar stops: first try tag-based matches. If the current dhaba has no
  // tags — or no other dhaba shares any tag — we'd otherwise hide the
  // section entirely. Fall back to proximity (if coords are known) or just
  // array order so the section always gives the driver somewhere else to go.
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

  // Only render the "Get there" section if we have at least one signal —
  // otherwise we were showing an empty header with no content underneath.
  const hasGetThere = Boolean(dhaba.address || dhaba.routeHint);

  return (
    <article className="container-page pt-5 sm:pt-8 pb-14">
      <nav aria-label="Breadcrumb" className="text-[13px] text-ink-muted">
        <Link
          href="/"
          className="hover:text-ink underline-offset-4 hover:underline"
        >
          All dhabas
        </Link>
        <span aria-hidden className="mx-2 text-paper-warm">·</span>
        <span className="text-ink-soft truncate">{dhaba.title}</span>
      </nav>

      {/* ── Hero photo (magazine-style) ──
          Only rendered when we actually have a photo. Without one the page
          is already grounded by the breadcrumb → title → map flow, so we
          don't insert a placeholder here (a large placeholder on a detail
          page reads as "this page has no content", which is worse than
          just starting with the title). On mobile we go full-bleed and
          slightly shorter (h-44) so the first fold reaches the title. */}
      {dhaba.imageUrl ? (
        <figure className="mt-5">
          <div className="relative w-full h-44 sm:h-64 md:h-80 overflow-hidden rounded-2xl bg-paper-soft">
            <Image
              src={dhaba.imageUrl}
              alt={dhaba.title}
              fill
              priority
              unoptimized
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 80vw, 1024px"
              className="object-cover"
            />
          </div>
          <figcaption className="mt-1 text-right text-[11px] text-ink-muted">
            Photo via Google
          </figcaption>
        </figure>
      ) : null}

      <header className={dhaba.imageUrl ? "mt-6 max-w-3xl" : "mt-5 max-w-3xl"}>
        {dhaba.routeHint ? (
          <p className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-clay-600">
            <span aria-hidden className="w-1 h-1 rounded-full bg-clay-500" />
            On route · {dhaba.routeHint}
          </p>
        ) : null}
        <h1 className="mt-2 text-[28px] sm:text-4xl md:text-[44px] leading-[1.08] tracking-tight font-semibold text-ink">
          {dhaba.title}
        </h1>

        {dhaba.tags.length > 0 ? (
          <ul className="mt-4 flex flex-wrap gap-1.5" role="list">
            {dhaba.tags.map((t) => (
              <li key={t}>
                <Link
                  href={`/?tag=${encodeURIComponent(t)}`}
                  className="hover:opacity-80 transition"
                >
                  <Tag label={t} />
                </Link>
              </li>
            ))}
          </ul>
        ) : null}
      </header>

      {/* Full map with a single pre-selected pin — anchors the page with a
          concrete location before the reader drops into the About block. */}
      {dhaba.lat != null && dhaba.lng != null ? (
        <section className="mt-7">
          <DhabaDetailMap dhaba={dhaba} />
        </section>
      ) : null}

      <section className="mt-8 grid gap-5 lg:grid-cols-[1.6fr_1fr]">
        <div className="rounded-2xl bg-white border border-paper-warm p-6 sm:p-7 shadow-card">
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-muted">
            About
          </h2>
          <p className="mt-3 text-[17px] sm:text-[18px] text-ink-soft leading-[1.75]">
            {dhaba.description ?? DEFAULT_DHABA_DESCRIPTION}
          </p>

          <dl className="mt-6 grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-5 text-[14px]">
            {dhaba.routeHint ? (
              <div>
                <dt className="text-ink-muted text-[11px] uppercase tracking-[0.06em]">
                  Route
                </dt>
                <dd className="mt-1 font-medium text-ink">
                  {dhaba.routeHint}
                </dd>
              </div>
            ) : null}
            {dhaba.source ? (
              <div>
                <dt className="text-ink-muted text-[11px] uppercase tracking-[0.06em]">
                  Source
                </dt>
                <dd className="mt-1 font-medium text-ink">{dhaba.source}</dd>
              </div>
            ) : null}
          </dl>

          {dhaba.needsReview && !dhaba.featured ? (
            <p className="mt-6 inline-flex items-center gap-1.5 text-[11px] text-ink-muted">
              <span aria-hidden className="w-1 h-1 rounded-full bg-haldi" />
              Community-submitted · pending review
            </p>
          ) : null}
        </div>

        <aside className="rounded-2xl bg-white border border-paper-warm p-6 sm:p-7 flex flex-col gap-5 shadow-card">

          {/* ── Get there ── (hidden entirely when we have no address and
              no route hint — an empty header is worse than nothing) */}
          {hasGetThere ? (
            <div>
              <h2 className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-muted">
                Get there
              </h2>
              {dhaba.address ? (
                <p className="mt-2 text-[14px] text-ink leading-snug">{dhaba.address.replace(/,\s*USA$/, "")}</p>
              ) : dhaba.routeHint ? (
                <p className="mt-2 text-[14px] text-ink leading-snug">{dhaba.routeHint}</p>
              ) : null}
              {dhaba.mapsUrl ? (
                <a
                  href={dhaba.mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-flex items-center gap-1.5 text-[13px] text-ink-muted hover:text-clay-600 transition underline-offset-4 hover:underline"
                >
                  <svg aria-hidden viewBox="0 0 16 16" fill="currentColor" className="w-3 h-3 flex-none">
                    <path d="M8 1a5 5 0 00-5 5c0 3.5 4.4 7.8 4.6 8a.6.6 0 00.8 0C8.6 13.8 13 9.5 13 6a5 5 0 00-5-5zm0 6.8A1.8 1.8 0 1110 6a1.8 1.8 0 01-2 1.8z" />
                  </svg>
                  Open in Google Maps ↗
                </a>
              ) : null}
            </div>
          ) : null}

          {/* ── Phone ── */}
          {dhaba.phone ? (
            <div>
              <h2 className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-muted">
                Phone
              </h2>
              <a
                href={`tel:${dhaba.phone.replace(/\D/g, "")}`}
                className="mt-2 inline-flex items-center gap-1.5 text-[16px] font-medium text-ink hover:text-clay-600 transition"
              >
                <svg aria-hidden viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5 flex-none text-clay-500">
                  <path d="M3.6 1C2.7 1 2 1.7 2 2.6v.9c0 5.8 4.7 10.5 10.5 10.5h.9c.9 0 1.6-.7 1.6-1.6v-1.9a.5.5 0 00-.3-.5l-2.5-1a.5.5 0 00-.6.2l-.8 1.2a8.5 8.5 0 01-4.2-4.2l1.2-.8a.5.5 0 00.2-.6l-1-2.5A.5.5 0 005.5 1H3.6z"/>
                </svg>
                {dhaba.phone}
              </a>
            </div>
          ) : null}

          {/* ── Hours ── */}
          {dhaba.hours && dhaba.hours.length > 0 ? (
            <div>
              <h2 className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-muted">
                Hours
              </h2>
              <ul className="mt-2 space-y-1">
                {dhaba.hours.map((line, idx) => {
                  // Split on the FIRST colon only — the time half often
                  // contains a colon too ("Monday: 8:00 AM – 5:00 PM").
                  // If the raw string has no colon at all (unexpected
                  // format like "Monday 8am–5pm"), render it verbatim
                  // so the user sees real data instead of a broken split.
                  const colonAt = line.indexOf(":");
                  if (colonAt === -1) {
                    return (
                      <li key={`${line}-${idx}`} className="text-[13px] text-ink">
                        {line}
                      </li>
                    );
                  }
                  const day = line.slice(0, colonAt);
                  const time = line.slice(colonAt + 1).trim();
                  return (
                    <li key={`${day}-${idx}`} className="flex justify-between gap-3 text-[13px]">
                      <span className="text-ink-muted w-28 flex-none">{day}</span>
                      <span className="text-ink text-right">{time || "Closed"}</span>
                    </li>
                  );
                })}
              </ul>
            </div>
          ) : null}

        </aside>
      </section>

      {/* ── Community contributions ─────────────────────────────────── */}
      <section className="mt-10">
        <div className="max-w-2xl rounded-2xl bg-white border border-paper-warm p-6 sm:p-7 shadow-card">
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-muted">
            Been here?
          </h2>
          {contributed === "true" ? (
            <p className="mt-4 rounded-xl bg-leaf-soft border border-leaf-line text-leaf px-4 py-3 text-[14px]">
              Thanks for contributing — we&rsquo;ll add it to the listing soon.
            </p>
          ) : (
            <>
              <p className="mt-2 text-[15px] text-ink-soft leading-relaxed">
                Share a photo or menu — help other drivers know what to expect.
              </p>
              <ContributeForm dhabaTitle={dhaba.title} dhabaSlug={dhaba.slug} />
            </>
          )}
        </div>
      </section>

      {related.length > 0 ? (
        <section className="mt-12">
          <h2 className="text-[17px] sm:text-lg font-semibold tracking-tight text-ink">Similar stops</h2>
          <ul
            role="list"
            className="mt-4 grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
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
  );
}
