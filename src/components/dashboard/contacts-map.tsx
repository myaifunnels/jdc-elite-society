"use client";

import "leaflet/dist/leaflet.css";
import Link from "next/link";
import { useEffect, useRef } from "react";

import { fitMapToPhilippines, mapPinHasPhoto, mapPinHtml, mapPinIconOptions } from "@/lib/map-view";
import { ContactMapPin } from "@/lib/types";

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export function ContactsMap({
  pins,
  tall = false,
}: {
  pins: ContactMapPin[];
  tall?: boolean;
}) {
  const mapNode = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = mapNode.current;
    if (!container || pins.length === 0) {
      return;
    }

    let map: import("leaflet").Map | undefined;
    let cancelled = false;

    async function mountMap() {
      const L = await import("leaflet");
      if (cancelled || !container) {
        return;
      }

      map = L.map(container, {
        scrollWheelZoom: true,
        attributionControl: true,
        minZoom: 4,
        maxZoom: 18,
        worldCopyJump: true,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap",
      }).addTo(map);

      pins.forEach((pin) => {
        const hasPhoto = mapPinHasPhoto(pin.photoUrl);
        const marker = L.marker([pin.lat, pin.lng], {
          icon: L.divIcon({
            ...mapPinIconOptions(hasPhoto),
            html: mapPinHtml({
              name: pin.name,
              photoUrl: pin.photoUrl,
              accent: pin.kind === "partner" ? "#007aff" : "#34c759",
            }),
          }),
          title: pin.name,
        }).addTo(map!);

        marker.bindPopup(
          `<div class="partner-map-popup">
            <strong>${escapeHtml(pin.name)}</strong>
            <p>${escapeHtml(pin.address || [pin.region, pin.kind].filter(Boolean).join(" · "))}</p>
            <p>${escapeHtml([pin.region, pin.kind === "partner" ? "Partner" : "Contact"].filter(Boolean).join(" · "))}</p>
            <a href="/dashboard/contacts/${encodeURIComponent(pin.id)}">Open contact</a>
          </div>`,
        );
      });

      fitMapToPhilippines(map, L, pins);
      requestAnimationFrame(() => {
        map?.invalidateSize();
        if (map) {
          fitMapToPhilippines(map, L, pins);
        }
      });
    }

    void mountMap();

    return () => {
      cancelled = true;
      map?.remove();
    };
  }, [pins]);

  if (pins.length === 0) {
    return (
      <div className="partners-map-empty">
        <p>No mapped contacts yet. Add a city or address, then tags will still sync from GHL.</p>
      </div>
    );
  }

  return (
    <div className="partners-map-widget">
      <div ref={mapNode} className={tall ? "partners-map-canvas is-tall" : "partners-map-canvas"} />
      <ul className="partners-map-legend">
        {pins.map((pin) => (
          <li key={pin.id}>
            <Link href={`/dashboard/contacts/${pin.id}`}>{pin.name}</Link>
            <span>{pin.address || pin.region || pin.kind}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
