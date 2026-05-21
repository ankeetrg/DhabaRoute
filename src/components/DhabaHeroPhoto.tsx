"use client";

import { useState } from "react";
import { DhabaPhoto } from "./DhabaPhoto";

interface DhabaHeroPhotoProps {
  src: string;
  alt: string;
}

export function DhabaHeroPhoto({ src, alt }: DhabaHeroPhotoProps) {
  const [loaded, setLoaded] = useState(false);

  return (
    <figure className="mt-5">
      <DhabaPhoto
        src={src}
        alt={alt}
        className="w-full h-[280px] rounded-2xl"
        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 80vw, 1024px"
        priority
        onLoadSuccess={() => setLoaded(true)}
        onLoadError={() => setLoaded(false)}
      />
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
