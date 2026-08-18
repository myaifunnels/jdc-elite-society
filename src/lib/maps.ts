export function isGoogleMapsConfigured() {
  return Boolean(process.env.NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY);
}

export function getGoogleMapsConfig() {
  return {
    embedKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY ?? "",
  };
}
