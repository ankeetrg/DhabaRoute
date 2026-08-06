"use client";

// /claim-listing — browse-to-claim directory. Lists every dhaba so an owner
// can find theirs and click through to the existing pre-filled /claim?dhaba=
// flow (src/app/claim/page.tsx already supports that query param via
// getDhabaBySlug). A name filter is a small addition beyond the literal
// spec ("display a list... user will click on any dhaba") — 157 unfiltered
// rows is a lot to scroll on a phone, so it's included for usability.

import Link from "next/link";
import { useMemo, useState } from "react";
import type { Dhaba } from "@/lib/types";
import { DhabaPhoto } from "./DhabaPhoto";
import { getDhabaPhotoSrc } from "@/lib/photo-url";

export function ClaimListingDirectory({ dhabas }: { dhabas: Dhaba[] }) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return dhabas;
    return dhabas.filter((d) =>
      [d.title, d.address].filter(Boolean).join(" ").toLowerCase().includes(q),
    );
  }, [dhabas, query]);

  return (
    <div className="container-page max-w-2xl pt-8 pb-20">
      <nav aria-label="Breadcrumb" className="text-[13px] text-ink-muted">
        <Link href="/" className="underline-offset-4 hover:text-ink hover:underline">
          All dhabas
        </Link>
        <span aria-hidden className="mx-2 text-paper-warm">·</span>
        <span className="text-ink-soft">Claim a listing</span>
      </nav>

      <header className="mt-6">
        <p className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-clay-600">
          <span aria-hidden className="h-1 w-1 rounded-full bg-clay-500" />
          For owners
        </p>
        <h1 className="mt-2 font-display text-[28px] font-extrabold leading-tight tracking-tight text-ink sm:text-4xl">
          Find your dhaba to claim it
        </h1>
        <p className="mt-3 text-[15px] leading-relaxed text-ink-soft">
          Pick your listing below to start the claim flow — hours, menu, and
          photos, kept accurate by you.
        </p>
      </header>

      <div className="relative mt-5">
        <svg
          aria-hidden
          viewBox="0 0 20 20"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-muted pointer-events-none"
        >
          <circle cx="9" cy="9" r="5.5" />
          <path d="m13 13 3.5 3.5" strokeLinecap="round" />
        </svg>
        <input
          type="search"
          inputMode="search"
          autoComplete="off"
          placeholder="Search by name or address"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{ border: "1.5px solid #e4d8c6" }}
          className="w-full h-12 pl-10 pr-4 rounded-full bg-white text-[15px] text-ink placeholder:text-ink-muted/75 focus:outline-none"
        />
      </div>

      <p className="mt-3 text-[12.5px] text-ink-muted tabular-nums">
        {filtered.length} {filtered.length === 1 ? "listing" : "listings"}
      </p>

      <ul role="list" className="mt-2 flex flex-col divide-y divide-paper-warm">
        {filtered.length === 0 ? (
          <li className="py-6 text-center text-[13.5px] text-ink-muted">
            No listings match &ldquo;{query}&rdquo;.
          </li>
        ) : (
          filtered.map((d) => (
            <li key={d.id}>
              <Link
                href={`/claim?dhaba=${encodeURIComponent(d.slug)}`}
                className="flex items-center gap-3 py-3 hover:bg-paper-soft rounded-lg transition -mx-2 px-2"
              >
                <DhabaPhoto
                  src={getDhabaPhotoSrc(d)}
                  alt=""
                  className="w-12 h-12 rounded-lg flex-none"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-[14.5px] font-semibold text-ink truncate">{d.title}</p>
                  {d.address ? (
                    <p className="text-[12.5px] text-ink-muted truncate">{d.address}</p>
                  ) : null}
                </div>
                <svg aria-hidden viewBox="0 0 8 14" className="w-2 h-3.5 flex-none text-ink-muted" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M1 1l6 6-6 6" />
                </svg>
              </Link>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
