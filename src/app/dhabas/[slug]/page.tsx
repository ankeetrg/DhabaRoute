import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getAllSlugs, getDhabaBySlug, getAllDhabas } from "@/lib/dhabas";
import { DEFAULT_DHABA_DESCRIPTION } from "@/lib/types";
import { Tag } from "@/components/Tag";
import { DhabaCard } from "@/components/DhabaCard";
import { DhabaDetailMap } from "@/components/DhabaDetailMap";

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
}: {
  params: RouteParams;
}) {
  const { slug } = await params;
  const dhaba = getDhabaBySlug(slug);
  if (!dhaba) notFound();

  const related = getAllDhabas()
    .filter(
      (d) =>
        d.slug !== dhaba.slug &&
        d.tags.some((t) => dhaba.tags.includes(t)),
    )
    .slice(0, 3);

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

      <header className="mt-5 max-w-3xl">
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
                <Tag label={t} />
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
          <p className="mt-2 text-[15px] text-ink-soft leading-relaxed">
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

          {dhaba.needsReview ? (
            <p className="mt-6 inline-flex items-center gap-1.5 text-[11px] text-ink-muted">
              <span aria-hidden className="w-1 h-1 rounded-full bg-haldi" />
              Community-submitted · pending review
            </p>
          ) : null}
        </div>

        <aside className="rounded-2xl bg-white border border-paper-warm p-6 sm:p-7 flex flex-col shadow-card">
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-muted">
            Get there
          </h2>
          <p className="mt-2 text-[14px] text-ink-soft leading-relaxed">
            One tap for directions, hours, and reviews in Google Maps.
          </p>
          {dhaba.mapsUrl ? (
            <div className="mt-5">
              <a
                href={dhaba.mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={[
                  "inline-flex w-full h-12 items-center justify-center gap-2 rounded-xl",
                  "bg-clay-500 text-white text-[14px] font-semibold tracking-[-0.005em]",
                  "shadow-cta hover:bg-clay-600 active:scale-[0.99] transition",
                ].join(" ")}
              >
                <svg
                  aria-hidden
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="w-4 h-4"
                >
                  <path d="M10 2a6 6 0 00-6 6c0 4.2 5.3 9.4 5.5 9.6a.7.7 0 001 0C10.7 17.4 16 12.2 16 8a6 6 0 00-6-6zm0 8.2a2.2 2.2 0 110-4.4 2.2 2.2 0 010 4.4z" />
                </svg>
                Open in Google Maps
              </a>
            </div>
          ) : (
            <p className="mt-5 text-[13px] text-ink-muted">
              Maps link not available yet.
            </p>
          )}
        </aside>
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
