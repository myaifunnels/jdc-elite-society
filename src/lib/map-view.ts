import type { Map as LeafletMap } from "leaflet";

import { isDisplayableImageSrc, mediaSrc } from "@/lib/media";

export const MAP_PHOTO_PIN_SIZE = 22;
export const MAP_MARKER_WIDTH = 18;
export const MAP_MARKER_HEIGHT = 26;
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

export function mapPinHasPhoto(photoUrl?: string) {
  return isDisplayableImageSrc(photoUrl);
}

export function mapPinHtml(input: { name: string; photoUrl?: string; accent?: string }) {
  const photo = isDisplayableImageSrc(input.photoUrl) ? mediaSrc(input.photoUrl) : undefined;
  const size = MAP_PHOTO_PIN_SIZE;
  if (photo) {
    return `<span class="partner-map-pin has-photo"><img src="${escapeMapHtml(photo)}" alt="" width="${size}" height="${size}" /></span>`;
  }

  return `<span class="partner-map-pin is-marker" title="${escapeMapHtml(input.name)}"><img src="/media/map-pin.svg" alt="" width="${MAP_MARKER_WIDTH}" height="${MAP_MARKER_HEIGHT}" /></span>`;
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
