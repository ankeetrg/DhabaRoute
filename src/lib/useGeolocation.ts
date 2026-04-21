"use client";

import { useCallback, useEffect, useState } from "react";
import type { Coords } from "./types";

export type GeoStatus =
  | "idle"
  | "prompting"
  | "locating"
  | "granted"
  | "denied"
  | "unsupported"
  | "error";

export interface GeolocationState {
  status: GeoStatus;
  coords: Coords | null;
  error?: string;
  request: () => void;
}

// Lightweight geolocation hook.
// - Never asks automatically; exposes `request()` so the UI can prompt
//   from a clearly-labeled button (better trust, fewer denials).
// - Persists the user's choice in sessionStorage so the prompt doesn't
//   flicker on every route change within a session.
export function useGeolocation(): GeolocationState {
  const [status, setStatus] = useState<GeoStatus>("idle");
  const [coords, setCoords] = useState<Coords | null>(null);
  const [error, setError] = useState<string | undefined>(undefined);

  // Restore last known location within the session so map doesn't jump
  // back to the default center on every nav.
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const cached = sessionStorage.getItem("dr:coords");
      if (cached) {
        const parsed = JSON.parse(cached) as Coords;
        if (
          typeof parsed?.lat === "number" &&
          typeof parsed?.lng === "number"
        ) {
          setCoords(parsed);
          setStatus("granted");
        }
      }
    } catch {
      // ignore malformed cache
    }
  }, []);

  const request = useCallback(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setStatus("unsupported");
      return;
    }
    setStatus("locating");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const next: Coords = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        };
        setCoords(next);
        setStatus("granted");
        try {
          sessionStorage.setItem("dr:coords", JSON.stringify(next));
        } catch {
          // ignore storage failures
        }
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          setStatus("denied");
        } else {
          setStatus("error");
          setError(err.message);
        }
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 60_000 },
    );
  }, []);

  return { status, coords, error, request };
}
