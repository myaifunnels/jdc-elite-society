import type { Map as LeafletMap } from "leaflet";

export const MAP_PIN_SIZE = 36;

export const PHILIPPINES_BOUNDS: [[number, number], [number, number]] = [
  [4.6, 116.2],
  [21.5, 127.0],
];

export function escapeMapHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export function mapPinInitials(name: string) {
  const letters = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
  return letters || "•";
}

export function mapPinHtml(input: { name: string; photoUrl?: string; accent?: string }) {
  const size = MAP_PIN_SIZE;
  if (input.photoUrl) {
    return `<span class="partner-map-pin has-photo"><img src="${escapeMapHtml(input.photoUrl)}" alt="" width="${size}" height="${size}" /></span>`;
  }

  const accent = input.accent || "#007aff";
  return `<span class="partner-map-pin is-default" style="background:${accent}"><span>${escapeMapHtml(mapPinInitials(input.name))}</span></span>`;
}

export function mapPinIconOptions() {
  return {
    className: "partner-map-marker",
    iconSize: [MAP_PIN_SIZE, MAP_PIN_SIZE] as [number, number],
    iconAnchor: [MAP_PIN_SIZE / 2, MAP_PIN_SIZE] as [number, number],
    popupAnchor: [0, -(MAP_PIN_SIZE - 4)] as [number, number],
  };
}

export function fitMapToPhilippines(
  map: LeafletMap,
  L: typeof import("leaflet"),
  pins: Array<{ lat: number; lng: number }>,
) {
  const bounds = L.latLngBounds(PHILIPPINES_BOUNDS);
  for (const pin of pins) {
    bounds.extend([pin.lat, pin.lng]);
  }
  map.fitBounds(bounds, {
    animate: false,
    maxZoom: 6,
    padding: [28, 28],
  });
}
