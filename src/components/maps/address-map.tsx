type AddressMapProps = {
  address: string;
  lat?: number;
  lng?: number;
  embedKey?: string;
};

function osmEmbedUrl(lat: number, lng: number) {
  const pad = 0.06;
  const bbox = `${lng - pad},${lat - pad},${lng + pad},${lat + pad}`;
  return `https://www.openstreetmap.org/export/embed.html?bbox=${encodeURIComponent(bbox)}&layer=mapnik&marker=${encodeURIComponent(`${lat},${lng}`)}`;
}

export function AddressMap({ address, lat, lng, embedKey }: AddressMapProps) {
  const trimmed = address.trim();
  const resolvedKey = embedKey || process.env.NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY || "";
  const hasCoords = typeof lat === "number" && typeof lng === "number";

  if (!trimmed && !hasCoords) {
    return (
      <div className="card-surface rounded-3xl p-6 text-sm text-[var(--muted)]">
        Add an address to preview this contact on the map.
      </div>
    );
  }

  const query = trimmed ? encodeURIComponent(trimmed) : `${lat},${lng}`;
  const googleMapsUrl = trimmed
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(trimmed)}`
    : `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
  const osmMapsUrl = hasCoords
    ? `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=13/${lat}/${lng}`
    : `https://www.openstreetmap.org/search?query=${query}`;
  const googleEmbedUrl = resolvedKey ? `https://www.google.com/maps/embed/v1/place?key=${resolvedKey}&q=${query}` : null;
  const osmEmbed = hasCoords ? osmEmbedUrl(lat, lng) : null;
  const embedUrl = googleEmbedUrl || osmEmbed;
  const mapsUrl = resolvedKey ? googleMapsUrl : osmMapsUrl;

  return (
    <div className="contact-location-map">
      {embedUrl ? (
        <iframe title="Contact address map" src={embedUrl} className="contact-location-map-frame" loading="lazy" />
      ) : (
        <div className="contact-location-map-empty">Map preview needs a saved address or coordinates.</div>
      )}

      <div className="contact-location-map-meta">
        <div className="min-w-0">
          <p className="font-semibold">Location</p>
          <p className="truncate text-[var(--muted)]">{trimmed || `${lat}, ${lng}`}</p>
        </div>
        <a href={mapsUrl} target="_blank" rel="noreferrer" className="macos-btn macos-btn-secondary">
          Map
        </a>
      </div>
    </div>
  );
}
