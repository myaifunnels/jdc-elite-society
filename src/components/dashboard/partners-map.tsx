"use client";

import "leaflet/dist/leaflet.css";
import Link from "next/link";
import { useEffect, useRef } from "react";

import { fitMapToPhilippines, mapPinHtml, mapPinIconOptions } from "@/lib/map-view";
import { PartnerMapPin } from "@/lib/types";

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
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
        minZoom: 4,
        maxZoom: 18,
        worldCopyJump: true,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap",
      }).addTo(map);

      const icon = mapPinIconOptions();
      partners.forEach((partner) => {
        const marker = L.marker([partner.lat, partner.lng], {
          icon: L.divIcon({
            ...icon,
            html: mapPinHtml({
              name: partner.name,
              photoUrl: partner.photoUrl,
              accent: "#007aff",
            }),
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
      });

      fitMapToPhilippines(map, L, partners);
      requestAnimationFrame(() => {
        map?.invalidateSize();
        if (map) {
          fitMapToPhilippines(map, L, partners);
        }
      });
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
