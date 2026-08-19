"use client";

import "leaflet/dist/leaflet.css";
import Link from "next/link";
import { useEffect, useRef } from "react";

import { ContactMapPin } from "@/lib/types";

const defaultPinSvg = (color: string) => `<svg viewBox="0 0 32 42" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <path d="M16 1.5c7.2 0 13 5.8 13 13 0 9.7-13 25.5-13 25.5S3 24.2 3 14.5C3 7.3 8.8 1.5 16 1.5z" fill="${color}"/>
  <circle cx="16" cy="14.5" r="5.2" fill="white"/>
</svg>`;

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function pinHtml(pin: ContactMapPin) {
  if (pin.photoUrl) {
    return `<span class="partner-map-pin has-photo"><img src="${escapeHtml(pin.photoUrl)}" alt="" /></span>`;
  }

  return `<span class="partner-map-pin is-default">${defaultPinSvg(pin.kind === "partner" ? "#007aff" : "#34c759")}</span>`;
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
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap",
      }).addTo(map);

      const bounds = L.latLngBounds([]);

      pins.forEach((pin) => {
        const marker = L.marker([pin.lat, pin.lng], {
          icon: L.divIcon({
            className: "partner-map-marker",
            html: pinHtml(pin),
            iconSize: [40, 48],
            iconAnchor: [20, 46],
            popupAnchor: [0, -40],
          }),
          title: pin.name,
        }).addTo(map!);

        marker.bindPopup(
          `<div class="partner-map-popup">
            <strong>${escapeHtml(pin.name)}</strong>
            <p>${escapeHtml(pin.region || pin.address || pin.kind)}</p>
            <p>${escapeHtml(pin.tags.slice(0, 6).join(" · "))}</p>
            <a href="/dashboard/contacts/${encodeURIComponent(pin.id)}">Open dashboard</a>
          </div>`,
        );
        bounds.extend([pin.lat, pin.lng]);
      });

      if (bounds.isValid()) {
        map.fitBounds(bounds.pad(0.28), { maxZoom: 7, animate: false });
      } else {
        map.setView([14.6, 121], 4);
      }

      requestAnimationFrame(() => map?.invalidateSize());
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
        {pins.slice(0, 24).map((pin) => (
          <li key={pin.id}>
            <Link href={`/dashboard/contacts/${pin.id}`}>{pin.name}</Link>
            <span>{pin.region || pin.kind}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
