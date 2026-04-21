import { getDataMeta } from "@/lib/dhabas";

export function Footer() {
  const { count, generatedAt } = getDataMeta();
  // Deterministic (no locale dependency) so SSR and client agree.
  const updated = new Date(generatedAt).toISOString().slice(0, 10);
  return (
    <footer className="mt-16 border-t border-paper-warm">
      <div className="container-page py-7 flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between text-[13px] text-ink-muted">
        <p>
          <span className="font-semibold text-ink">DhabaRoute</span> · Built for the road.
        </p>
        <p className="tabular-nums">
          {count} dhabas · Last updated {updated}
        </p>
      </div>
    </footer>
  );
}
