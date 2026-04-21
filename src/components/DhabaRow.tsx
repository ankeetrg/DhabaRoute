import type { Dhaba } from "@/lib/types";
import { DhabaCard } from "./DhabaCard";

export function DhabaRow({
  title,
  subtitle,
  dhabas,
  emphasis = false,
}: {
  title: string;
  subtitle?: string;
  dhabas: Dhaba[];
  emphasis?: boolean;
}) {
  if (dhabas.length === 0) return null;
  return (
    <section className="container-page mt-10 sm:mt-14">
      <div className="mb-4">
        <h2 className="text-[17px] sm:text-lg font-semibold tracking-tight text-ink">{title}</h2>
        {subtitle ? (
          <p className="mt-1 text-[13px] text-ink-muted">{subtitle}</p>
        ) : null}
      </div>
      <ul role="list" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {dhabas.map((d) => (
          <li key={d.id}>
            <DhabaCard dhaba={d} emphasis={emphasis} />
          </li>
        ))}
      </ul>
    </section>
  );
}
