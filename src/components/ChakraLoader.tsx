interface ChakraLoaderProps {
  label?: string;
  className?: string;
}

const CHAKRA_NAVY = "#1f3f72";

export function ChakraLoader({
  label = "Finding dhaba stops…",
  className = "",
}: ChakraLoaderProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={label}
      className={[
        "inline-flex flex-col items-center justify-center rounded-2xl border border-paper-warm bg-paper/90 px-6 py-5 shadow-card",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 48 48"
        className="h-12 w-12 animate-spin motion-reduce:animate-none"
        style={{
          color: CHAKRA_NAVY,
          animationDuration: "2.4s",
        }}
      >
        <circle
          cx="24"
          cy="24"
          r="19"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
        />
        <circle
          cx="24"
          cy="24"
          r="4"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
        />
        {Array.from({ length: 24 }, (_, index) => (
          <line
            key={index}
            x1="24"
            y1="9"
            x2="24"
            y2="19"
            stroke="currentColor"
            strokeWidth="1"
            strokeLinecap="round"
            opacity={index % 2 === 0 ? 0.82 : 0.58}
            transform={`rotate(${index * 15} 24 24)`}
          />
        ))}
      </svg>
      <p className="mt-3 font-ui text-[13px] font-medium text-ink-muted">
        {label}
      </p>
    </div>
  );
}
