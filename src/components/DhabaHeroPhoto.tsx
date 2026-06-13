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
  const status = getOpenStatus(hours);

  return (
    <figure className="mt-4 relative">
      <DhabaPhoto
        src={src}
        alt={alt}
        className="w-full h-[260px] md:h-[400px] rounded-2xl object-cover"
        sizes="(max-width: 640px) 100vw, (max-width: 1200px) calc(100vw - 64px), 1136px"
        priority
      />
      {status !== "unknown" ? (
        <span
          className="absolute top-3 right-3 text-white text-xs font-semibold px-3 py-1 rounded-full"
          style={{ background: status === "open" ? "#138808" : "#b94040" }}
        >
          {status === "open" ? "Open now" : "Closed"}
        </span>
      ) : null}
    </figure>
  );
}
