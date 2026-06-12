"use client";

import { useState } from "react";
import { DhabaPhoto } from "./DhabaPhoto";
import { getOpenStatus } from "@/lib/isOpenNow";

interface DhabaHeroPhotoProps {
  src: string;
  alt: string;
  hours?: string[];
}

export function DhabaHeroPhoto({ src, alt, hours }: DhabaHeroPhotoProps) {
  const [loaded, setLoaded] = useState(false);
  const status = getOpenStatus(hours);

  return (
    <figure className="mt-5 relative">
      <DhabaPhoto
        src={src}
        alt={alt}
        className="w-full h-[280px] rounded-2xl"
        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 80vw, 1024px"
        priority
        onLoadSuccess={() => setLoaded(true)}
        onLoadError={() => setLoaded(false)}
      />
      {status !== "unknown" ? (
        <span
          className="absolute top-3 right-3 text-white text-xs font-semibold px-3 py-1 rounded-full"
          style={{ background: status === "open" ? "#138808" : "#b94040" }}
        >
          {status === "open" ? "Open now" : "Closed"}
        </span>
      ) : null}
      {loaded ? (
        <figcaption
          className="mt-1 font-ui text-right"
          style={{ fontSize: 11, color: "#c4b4a4" }}
        >
          Photo via Google
        </figcaption>
      ) : null}
    </figure>
  );
}
