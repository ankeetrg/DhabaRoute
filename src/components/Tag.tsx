import type { Tag as TagType } from "@/lib/types";

// Subtle semantic coding: Vegetarian gets muted green (safe/healthy signal);
// everything else stays neutral warm. No decorative emoji — drivers are
// scanning at a glance, icons would add noise.
export function Tag({ label }: { label: TagType }) {
  const tone = TONES[label] ?? TONES.default;
  return (
    <span
      className={[
        "inline-flex items-center rounded-full border px-2 py-[2.5px]",
        "text-[10.5px] font-medium leading-none",
        tone,
      ].join(" ")}
    >
      {label}
    </span>
  );
}

// Single source of truth for tag tones. Kept flat and quiet — tags are
// supporting metadata, not competing accents.
const TONES: Record<string, string> = {
  Vegetarian: "bg-leaf-soft border-leaf-line text-leaf",
  default:    "bg-paper-soft border-paper-warm text-ink-soft",
};
