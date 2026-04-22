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

// ── ContributeForm ────────────────────────────────────────────────────────────
// Posted to the same Formspree endpoint as /submit so all community
// contributions land in one inbox. Hidden fields carry the dhaba context
// so Samson knows which listing to update when he reviews the email.
//
// File inputs: Formspree supports file attachments up to 10 MB per file.
// Users can attach multiple photos at once; menu is a separate upload slot
// so Samson can distinguish them in the email.

function ContributeForm({
  dhabaTitle,
  dhabaSlug,
}: {
  dhabaTitle: string;
  dhabaSlug: string;
}) {
  return (
    <form
      action="https://formspree.io/f/mgornaje"
      method="POST"
      encType="multipart/form-data"
      className="mt-5 space-y-4"
    >
      {/* Formspree routing */}
      <input type="hidden" name="_replyto" value="dhabaroute@gmail.com" />
      <input
        type="hidden"
        name="_subject"
        value={`Community contribution — ${dhabaTitle}`}
      />
      <input
        type="hidden"
        name="_next"
        value={`https://dhabaroute.com/dhabas/${dhabaSlug}?contributed=true`}
      />
      {/* Dhaba context so Samson knows which listing to update */}
      <input type="hidden" name="dhaba_title" value={dhabaTitle} />
      <input type="hidden" name="dhaba_slug" value={dhabaSlug} />

      {/* Photos */}
      <div>
        <label
          htmlFor={`photos-${dhabaSlug}`}
          className="block text-[12px] font-semibold uppercase tracking-[0.07em] text-ink-muted mb-1.5"
        >
          Photos <span className="normal-case font-normal">(optional)</span>
        </label>
        <p className="text-[12px] text-ink-muted mb-1.5">
          Food, signage, parking lot — anything helpful. Up to 10 MB per file.
        </p>
        <input
          id={`photos-${dhabaSlug}`}
          name="photos"
          type="file"
          accept="image/*"
          multiple
          className="block w-full text-[13px] text-ink-soft file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-[12px] file:font-semibold file:bg-paper-soft file:text-ink-soft hover:file:bg-paper-warm cursor-pointer"
        />
      </div>

      {/* Menu */}
      <div>
        <label
          htmlFor={`menu-${dhabaSlug}`}
          className="block text-[12px] font-semibold uppercase tracking-[0.07em] text-ink-muted mb-1.5"
        >
          Menu <span className="normal-case font-normal">(optional)</span>
        </label>
        <p className="text-[12px] text-ink-muted mb-1.5">
          Photo of the menu board or a PDF. We&rsquo;ll add it to the listing.
        </p>
        <input
          id={`menu-${dhabaSlug}`}
          name="menu"
          type="file"
          accept="image/*,.pdf"
          className="block w-full text-[13px] text-ink-soft file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-[12px] file:font-semibold file:bg-paper-soft file:text-ink-soft hover:file:bg-paper-warm cursor-pointer"
        />
      </div>

      {/* Notes */}
      <div>
        <label
          htmlFor={`notes-${dhabaSlug}`}
          className="block text-[12px] font-semibold uppercase tracking-[0.07em] text-ink-muted mb-1.5"
        >
          Notes <span className="normal-case font-normal">(optional)</span>
        </label>
        <textarea
          id={`notes-${dhabaSlug}`}
          name="notes"
          rows={2}
          placeholder="Hours, best dish, truck parking, anything useful…"
          className="w-full rounded-xl border border-paper-warm bg-paper px-4 py-3 text-[14px] text-ink placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-clay-400 resize-none"
        />
      </div>

      <button
        type="submit"
        className={[
          "inline-flex h-10 items-center justify-center px-5 rounded-xl",
          "bg-clay-500 text-white text-[13px] font-semibold tracking-[-0.005em]",
          "shadow-cta hover:bg-clay-600 active:scale-[0.99] transition",
        ].join(" ")}
      >
        Send contribution
      </button>
    </form>
  );
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

          {/* ── Get there ── */}
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
                {dhaba.hours.map((line) => {
                  const [day, ...rest] = line.split(":");
                  const time = rest.join(":").trim();
                  return (
                    <li key={day} className="flex justify-between gap-3 text-[13px]">
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
