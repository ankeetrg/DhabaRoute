"use client";

import { getOpenStatus } from "@/lib/isOpenNow";

const DAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

interface TodayStatusProps {
  hours: string[] | undefined;
}

// One-line open/closed status with today's hours (or tomorrow's opening time
// when closed). Client component because the status depends on the viewer's
// current local time — server-rendered output would freeze at build time.
// suppressHydrationWarning on the root <p> because SSR will render the
// build-time status, which legitimately differs from the user's now.
export function TodayStatus({ hours }: TodayStatusProps) {
  const status = getOpenStatus(hours);
  if (status === "unknown") return null;

  const todayIdx = new Date().getDay();
  const todayLine = hours?.find((h) => h.startsWith(DAYS[todayIdx]));
  const todayHours = todayLine
    ? todayLine.split(": ").slice(1).join(": ").trim()
    : "";

  if (status === "open") {
    return (
      <p
        suppressHydrationWarning
        className="font-ui text-[13px] mt-1"
        style={{ color: "#138808" }}
      >
        <span
          aria-hidden
          style={{
            display: "inline-block",
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: "#138808",
            marginRight: 6,
            verticalAlign: "middle",
          }}
        />
        <span style={{ fontWeight: 600 }}>Open</span>
        {todayHours ? (
          <span style={{ color: "#3c3128", fontWeight: 400 }}>
            {" · "}
            {todayHours}
          </span>
        ) : null}
      </p>
    );
  }

  // Closed — try to surface the next opening time. Walk forward up to 7 days
  // in case multiple consecutive days are closed.
  let opensCopy: string | null = null;
  for (let offset = 1; offset <= 7; offset++) {
    const dayName = DAYS[(todayIdx + offset) % 7];
    const line = hours?.find((h) => h.startsWith(dayName));
    if (!line) continue;
    const value = line.split(": ").slice(1).join(": ").trim();
    if (!value || /closed/i.test(value)) continue;
    const openTime = value.split(/[–-]/)[0].trim();
    if (!openTime) continue;
    const dayLabel = offset === 1 ? "tomorrow" : dayName;
    opensCopy = `Opens ${dayLabel} ${openTime}`;
    break;
  }

  return (
    <p
      suppressHydrationWarning
      className="font-ui text-[13px] mt-1"
      style={{ color: "#8a7a6a" }}
    >
      <span
        aria-hidden
        style={{
          display: "inline-block",
          width: 6,
          height: 6,
          borderRadius: "50%",
          background: "#8a7a6a",
          marginRight: 6,
          verticalAlign: "middle",
        }}
      />
      <span style={{ fontWeight: 600 }}>Closed</span>
      {opensCopy ? <span>{" · "}{opensCopy}</span> : null}
    </p>
  );
}
