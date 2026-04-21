import Link from "next/link";

export default function NotFound() {
  return (
    <div className="container-page py-20 text-center">
      <p className="text-xs font-medium uppercase tracking-wider text-clay-700">
        404
      </p>
      <h1 className="mt-3 font-display text-4xl text-ink">Wrong exit.</h1>
      <p className="mt-3 text-ink-soft">
        We couldn&apos;t find that dhaba. It may have been renamed or moved.
      </p>
      <Link
        href="/"
        className="mt-8 inline-flex h-11 px-5 items-center rounded-full bg-ink text-paper font-medium hover:bg-ink-soft transition"
      >
        Back to all dhabas
      </Link>
    </div>
  );
}
