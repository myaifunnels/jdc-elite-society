type AddressMapProps = {
  address: string;
};

export function AddressMap({ address }: AddressMapProps) {
  const trimmed = address.trim();

  if (!trimmed) {
    return (
      <div className="card-surface rounded-3xl p-6 text-sm text-[var(--muted)]">
        Add an address to preview the Google Maps lookup link for this lead or inquiry.
      </div>
    );
  }

  const query = encodeURIComponent(trimmed);
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${query}`;
  const embedKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY;
  const embedUrl = embedKey
    ? `https://www.google.com/maps/embed/v1/place?key=${embedKey}&q=${query}`
    : null;

  return (
    <div className="overflow-hidden rounded-3xl border border-black/10 bg-white">
      {embedUrl ? (
        <iframe
          title="Lead address map"
          src={embedUrl}
          className="h-64 w-full border-0"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
      ) : (
        <div className="flex h-64 items-center justify-center bg-[linear-gradient(135deg,#f4e8d6,#fffdf8)] p-6 text-center text-sm text-[var(--muted)]">
          Set `NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY` to show an embedded map preview.
        </div>
      )}

      <div className="flex items-center justify-between gap-4 p-4 text-sm">
        <div>
          <p className="font-semibold">Google Maps integration</p>
          <p className="text-[var(--muted)]">{trimmed}</p>
        </div>

        <a
          href={mapsUrl}
          target="_blank"
          rel="noreferrer"
          className="rounded-full border border-black/10 px-4 py-2 font-medium transition hover:border-black/30"
        >
          Open Maps
        </a>
      </div>
    </div>
  );
}
