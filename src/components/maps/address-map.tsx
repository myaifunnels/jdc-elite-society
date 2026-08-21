type AddressMapProps = {
  address: string;
  lat?: number;
  lng?: number;
  embedKey?: string;
};

export function AddressMap({ address, lat, lng, embedKey }: AddressMapProps) {
  const trimmed = address.trim();
  const resolvedKey = embedKey || process.env.NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY || "";
  const hasCoords = typeof lat === "number" && typeof lng === "number";

  if (!trimmed && !hasCoords) {
    return (
      <div className="card-surface rounded-3xl p-6 text-sm text-[var(--muted)]">
        Add an address to preview the Google Maps lookup link for this contact or inquiry.
      </div>
    );
  }

  const query = hasCoords ? `${lat},${lng}` : encodeURIComponent(trimmed);
  const mapsUrl = hasCoords
    ? `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(trimmed)}`;
  const embedUrl = resolvedKey
    ? `https://www.google.com/maps/embed/v1/place?key=${resolvedKey}&q=${query}`
    : null;

  return (
    <div className="overflow-hidden rounded-3xl border border-[var(--line)] bg-[color:var(--surface-elevated)]">
      {embedUrl ? (
        <iframe
          title="Contact address map"
          src={embedUrl}
          className="h-64 w-full border-0"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
      ) : (
        <div className="flex h-64 items-center justify-center bg-[linear-gradient(135deg,rgba(41,98,255,0.16),rgba(15,23,48,0.72))] p-6 text-center text-sm text-[var(--muted)]">
          Save a Google Maps Embed API key in Admin Integrations to show the live map preview.
        </div>
      )}

      <div className="flex items-center justify-between gap-4 p-4 text-sm">
        <div>
          <p className="font-semibold">Google Maps integration</p>
          <p className="text-[var(--muted)]">{trimmed || `${lat}, ${lng}`}</p>
        </div>

        <a
          href={mapsUrl}
          target="_blank"
          rel="noreferrer"
          className="button-secondary pressable rounded-full px-4 py-2 font-medium"
        >
          Open Maps
        </a>
      </div>
    </div>
  );
}
