import type { Map as LeafletMap } from "leaflet";

export const MAP_PHOTO_PIN_SIZE = 22;
export const MAP_MARKER_WIDTH = 16;
export const MAP_MARKER_HEIGHT = 24;
export const MAP_PIN_SIZE = MAP_PHOTO_PIN_SIZE;

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

export function mapPinHtml(input: { name: string; photoUrl?: string; accent?: string }) {
  const photo = input.photoUrl?.trim();
  const size = MAP_PHOTO_PIN_SIZE;
  if (photo) {
    return `<span class="partner-map-pin has-photo"><img src="${escapeMapHtml(photo)}" alt="" width="${size}" height="${size}" /></span>`;
  }

  const accent = input.accent || "#007aff";
  return `<span class="partner-map-pin is-marker" title="${escapeMapHtml(input.name)}"><svg viewBox="0 0 24 36" width="${MAP_MARKER_WIDTH}" height="${MAP_MARKER_HEIGHT}" aria-hidden="true"><path fill="${escapeMapHtml(accent)}" stroke="#fff" stroke-width="1.5" d="M12 1.4C6.3 1.4 1.7 6 1.7 11.7 1.7 20.8 12 34.6 12 34.6S22.3 20.8 22.3 11.7C22.3 6 17.7 1.4 12 1.4z"/><circle cx="12" cy="11.7" r="4.1" fill="#fff"/></svg></span>`;
}

export function mapPinIconOptions(hasPhoto = false) {
  if (hasPhoto) {
    return {
      className: "partner-map-marker",
      iconSize: [MAP_PHOTO_PIN_SIZE, MAP_PHOTO_PIN_SIZE] as [number, number],
      iconAnchor: [MAP_PHOTO_PIN_SIZE / 2, MAP_PHOTO_PIN_SIZE] as [number, number],
      popupAnchor: [0, -(MAP_PHOTO_PIN_SIZE - 2)] as [number, number],
    };
  }

  return {
    className: "partner-map-marker",
    iconSize: [MAP_MARKER_WIDTH, MAP_MARKER_HEIGHT] as [number, number],
    iconAnchor: [MAP_MARKER_WIDTH / 2, MAP_MARKER_HEIGHT] as [number, number],
    popupAnchor: [0, -(MAP_MARKER_HEIGHT - 2)] as [number, number],
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
