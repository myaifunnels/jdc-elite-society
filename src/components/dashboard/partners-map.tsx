"use client";

import "leaflet/dist/leaflet.css";
import Link from "next/link";
import { useEffect, useRef } from "react";

import { PartnerMapPin } from "@/lib/types";

const defaultPinSvg = `<svg viewBox="0 0 32 42" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <path d="M16 1.5c7.2 0 13 5.8 13 13 0 9.7-13 25.5-13 25.5S3 24.2 3 14.5C3 7.3 8.8 1.5 16 1.5z" fill="#007aff"/>
  <circle cx="16" cy="14.5" r="5.2" fill="white"/>
</svg>`;

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function pinHtml(partner: PartnerMapPin) {
  if (partner.photoUrl) {
    return `<span class="partner-map-pin has-photo"><img src="${escapeHtml(partner.photoUrl)}" alt="" /></span>`;
  }

  return `<span class="partner-map-pin is-default">${defaultPinSvg}</span>`;
}

export function PartnersMap({ partners }: { partners: PartnerMapPin[] }) {
  const mapNode = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = mapNode.current;
    if (!container || partners.length === 0) {
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
        scrollWheelZoom: false,
        attributionControl: true,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap",
      }).addTo(map);

      const bounds = L.latLngBounds([]);

      partners.forEach((partner) => {
        const marker = L.marker([partner.lat, partner.lng], {
          icon: L.divIcon({
            className: "partner-map-marker",
            html: pinHtml(partner),
            iconSize: [40, 48],
            iconAnchor: [20, 46],
            popupAnchor: [0, -40],
          }),
          title: partner.name,
        }).addTo(map!);

        marker.bindPopup(
          `<div class="partner-map-popup">
            <strong>${escapeHtml(partner.name)}</strong>
            <p>${escapeHtml(partner.region)}</p>
            <a href="/dashboard/contacts/${encodeURIComponent(partner.id)}">Open dashboard</a>
          </div>`,
        );
        bounds.extend([partner.lat, partner.lng]);
      });

      if (bounds.isValid()) {
        map.fitBounds(bounds.pad(0.35), { maxZoom: 6, animate: false });
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
  }, [partners]);

  if (partners.length === 0) {
    return (
      <div className="partners-map-empty">
        <p>No partner locations to pin yet.</p>
      </div>
    );
  }

  return (
    <div className="partners-map-widget">
      <div ref={mapNode} className="partners-map-canvas" />
      <ul className="partners-map-legend">
        {partners.map((partner) => (
          <li key={partner.id}>
            <Link href={`/dashboard/contacts/${partner.id}`}>{partner.name}</Link>
            <span>{partner.region}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
