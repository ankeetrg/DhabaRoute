"use client";

import { useEffect, useMemo, useRef } from "react";
import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";
import L from "leaflet";
import type { Coords, Dhaba } from "@/lib/types";
import { DEFAULT_MAP_CENTER, DEFAULT_MAP_ZOOM } from "@/lib/map-config";

// Disable touch-drag on pointer-coarse (touch) devices so users can scroll
// the page by swiping through the map area. Zoom buttons (+/−) and pin
// clicks still work. Evaluated once on module load (client-only file).
const DISABLE_DRAG = typeof window !== "undefined" &&
  window.matchMedia("(pointer: coarse)").matches;

// We use react-leaflet on top of Leaflet. The entire file is client-only —
// HomeInteractive imports this via next/dynamic with ssr:false so nothing
// Leaflet-related ever runs on the server.

// Custom divIcons for dhaba pins and the user dot. Instances are stable so
// react-leaflet doesn't re-create markers on every render.
const DHABA_ICON_DEFAULT = L.divIcon({
  className: "",
  iconSize: [28, 28],
  iconAnchor: [14, 28],
  html: '<span class="dr-pin" aria-hidden="true"></span>',
});
const DHABA_ICON_ACTIVE = L.divIcon({
  className: "",
  iconSize: [28, 28],
  iconAnchor: [14, 28],
  html: '<span class="dr-pin dr-pin--active" aria-hidden="true"></span>',
});
const USER_ICON = L.divIcon({
  className: "",
  iconSize: [22, 22],
  iconAnchor: [11, 11],
  html: '<span class="dr-user" aria-hidden="true"></span>',
});

interface MapViewProps {
  dhabas: Dhaba[];
  userLocation: Coords | null;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
}

export function MapView({
  dhabas,
  userLocation,
  selectedId,
  onSelect,
}: MapViewProps) {
  // Guard: only dhabas with numeric lat/lng become markers. Everything else
  // is safely ignored so missing coords never crash the map.
  const mappable = useMemo(
    () =>
      dhabas.filter(
        (d) => typeof d.lat === "number" && typeof d.lng === "number",
      ),
    [dhabas],
  );

  const points: [number, number][] = useMemo(() => {
    const p: [number, number][] = mappable.map((d) => [d.lat!, d.lng!]);
    if (userLocation) p.push([userLocation.lat, userLocation.lng]);
    return p;
  }, [mappable, userLocation]);

  return (
    <MapContainer
      center={[DEFAULT_MAP_CENTER.lat, DEFAULT_MAP_CENTER.lng]}
      zoom={DEFAULT_MAP_ZOOM}
      scrollWheelZoom={false}
      // Disable touch-drag on mobile so a swipe through the map scrolls the
      // page instead of panning the map. Pin clicks + zoom buttons still work.
      dragging={!DISABLE_DRAG}
      // Height is driven by --map-h in globals.css so all references stay in sync.
      className="w-full rounded-2xl overflow-hidden border border-paper-warm shadow-card"
      aria-label="Map of dhabas near you"
    >
      <TileLayer
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        maxZoom={19}
      />

      {mappable.map((d) => (
        <Marker
          key={d.id}
          position={[d.lat!, d.lng!]}
          icon={d.id === selectedId ? DHABA_ICON_ACTIVE : DHABA_ICON_DEFAULT}
          title={d.title}
          eventHandlers={{
            click: () => onSelect(d.id),
          }}
          riseOnHover
        />
      ))}

      {userLocation ? (
        <Marker
          position={[userLocation.lat, userLocation.lng]}
          icon={USER_ICON}
          interactive={false}
          keyboard={false}
        />
      ) : null}

      <FitToBounds points={points} userLocation={userLocation} />
      <PanToSelected selectedId={selectedId} dhabas={mappable} />
      <ClearOnMapClick onSelect={onSelect} />
    </MapContainer>
  );
}

// Fit the map to the current pins + user dot.
// Only fires on:
//   • initial mount (so the first view frames all pins correctly)
//   • when user location first becomes available (geo just granted)
// NOT on search/filter changes — those would make the map jump on every
// keystroke, which is disorienting. Users can zoom manually after filtering.
function FitToBounds({
  points,
  userLocation,
}: {
  points: [number, number][];
  userLocation: Coords | null;
}) {
  const map = useMap();
  // Ref holds the points array at the time we want to fit, so the fit
  // always uses the current set even though effects are batched.
  const pointsRef = useRef(points);
  pointsRef.current = points;

  function doFit(pts: [number, number][]) {
    if (pts.length === 0) {
      map.setView([DEFAULT_MAP_CENTER.lat, DEFAULT_MAP_CENTER.lng], DEFAULT_MAP_ZOOM);
      return;
    }
    if (pts.length === 1) {
      map.setView(pts[0], 10);
      return;
    }
    map.fitBounds(L.latLngBounds(pts), { padding: [40, 40], maxZoom: 11, animate: false });
  }

  // Fit once on mount.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { doFit(pointsRef.current); }, []);

  // Re-fit when user location first appears (geo just granted).
  const hadUserRef = useRef(false);
  useEffect(() => {
    if (!userLocation) return;       // still no location
    if (hadUserRef.current) return;  // already fitted for this user location
    hadUserRef.current = true;
    doFit(pointsRef.current);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userLocation]);

  return null;
}

// Smoothly pan the map to a selected dhaba (from list hover or pin click).
// We pan the pin up from centre so it never sits under the preview card,
// which is anchored to the bottom of the map container.
const PREVIEW_OFFSET_PX = 110;

function PanToSelected({
  selectedId,
  dhabas,
}: {
  selectedId: string | null;
  dhabas: Dhaba[];
}) {
  const map = useMap();
  useEffect(() => {
    if (!selectedId) return;
    const d = dhabas.find((x) => x.id === selectedId);
    if (!d || d.lat == null || d.lng == null) return;

    // Compute a new viewport centre that sits BELOW the pin (in world
    // pixels) by half the preview height — so the pin lands in the upper
    // portion of the map, above the preview card.
    const zoom = map.getZoom();
    const pinPx = map.project([d.lat, d.lng], zoom);
    const centrePx = pinPx.add([0, PREVIEW_OFFSET_PX / 2]);
    const target = map.unproject(centrePx, zoom);
    map.panTo(target, { animate: true, duration: 0.35 });
  }, [selectedId, dhabas, map]);
  return null;
}

// Clear selection when the user clicks empty map space.
function ClearOnMapClick({
  onSelect,
}: {
  onSelect: (id: string | null) => void;
}) {
  const map = useMap();
  useEffect(() => {
    const handler = () => onSelect(null);
    map.on("click", handler);
    return () => {
      map.off("click", handler);
    };
  }, [map, onSelect]);
  return null;
}
