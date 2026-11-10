export type AddressSuggestion = {
  id: string;
  label: string;
  detail: string;
  lat?: number;
  lng?: number;
};

type PhotonFeature = {
  geometry?: { coordinates?: [number, number] };
  properties?: {
    osm_id?: number;
    osm_type?: string;
    osm_key?: string;
    osm_value?: string;
    name?: string;
    street?: string;
    housenumber?: string;
    district?: string;
    city?: string;
    locality?: string;
    county?: string;
    state?: string;
    postcode?: string;
    country?: string;
    countrycode?: string;
  };
};

type NominatimHit = {
  place_id?: number;
  lat?: string;
  lon?: string;
  display_name?: string;
  address?: {
    house_number?: string;
    road?: string;
    pedestrian?: string;
    neighbourhood?: string;
    suburb?: string;
    village?: string;
    town?: string;
    city?: string;
    municipality?: string;
    county?: string;
    state?: string;
    postcode?: string;
    country?: string;
  };
};

const USER_AGENT = "CoachJDC/1.0 (https://coachjdc.org)";
const cache = new Map<string, { at: number; items: AddressSuggestion[] }>();
const CACHE_MS = 10 * 60 * 1000;
let lastNominatimAt = 0;

function cacheKey(query: string) {
  return query.toLowerCase().replace(/\s+/g, " ").trim();
}

function uniqueParts(parts: Array<string | undefined>) {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const part of parts) {
    const value = part?.replace(/\s+/g, " ").trim();
    if (!value) {
      continue;
    }
    const key = value.toLowerCase();
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    out.push(value);
  }
  return out;
}

function formatPhoton(feature: PhotonFeature): AddressSuggestion | null {
  const props = feature.properties ?? {};
  const streetLine = uniqueParts([props.housenumber, props.street]).join(" ");
  const place = uniqueParts([
    streetLine || props.name,
    streetLine ? props.name : undefined,
    props.district,
    props.locality,
    props.city,
    props.county,
    props.state,
    props.postcode,
    props.country,
  ]);
  if (!place.length) {
    return null;
  }

  const [lng, lat] = feature.geometry?.coordinates ?? [];
  const osm = [props.osm_type, props.osm_id].filter(Boolean).join(":");
  return {
    id: osm || place.join("|"),
    label: place.join(", "),
    detail: uniqueParts([props.city || props.locality || props.district, props.state, props.country]).join(" · "),
    lat: Number.isFinite(lat) ? lat : undefined,
    lng: Number.isFinite(lng) ? lng : undefined,
  };
}

function formatNominatim(hit: NominatimHit): AddressSuggestion | null {
  const address = hit.address ?? {};
  const streetLine = uniqueParts([address.house_number, address.road || address.pedestrian]).join(" ");
  const place = uniqueParts([
    streetLine,
    address.neighbourhood,
    address.suburb,
    address.village || address.town || address.city || address.municipality,
    address.county,
    address.state,
    address.postcode,
    address.country,
  ]);
  const label = place.join(", ") || hit.display_name?.trim();
  if (!label) {
    return null;
  }

  const lat = Number(hit.lat);
  const lng = Number(hit.lon);
  return {
    id: String(hit.place_id ?? label),
    label,
    detail: uniqueParts([
      address.city || address.town || address.village || address.municipality,
      address.state,
      address.country,
    ]).join(" · "),
    lat: Number.isFinite(lat) ? lat : undefined,
    lng: Number.isFinite(lng) ? lng : undefined,
  };
}

function dedupe(items: AddressSuggestion[]) {
  const seen = new Set<string>();
  const out: AddressSuggestion[] = [];
  for (const item of items) {
    const key = item.label.toLowerCase();
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    out.push(item);
  }
  return out;
}

async function fetchJson(url: URL, timeoutMs: number) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      headers: {
        Accept: "application/json",
        "User-Agent": USER_AGENT,
      },
      cache: "no-store",
      signal: controller.signal,
    });
    if (!response.ok) {
      return null;
    }
    return (await response.json()) as unknown;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

async function fromPhoton(query: string, limit: number) {
  const url = new URL("https://photon.komoot.io/api/");
  url.searchParams.set("q", query);
  url.searchParams.set("limit", String(limit));
  url.searchParams.set("lang", "en");
  url.searchParams.set("lat", "14.5995");
  url.searchParams.set("lon", "120.9842");

  const payload = (await fetchJson(url, 4000)) as { features?: PhotonFeature[] } | null;
  return dedupe((payload?.features ?? []).map(formatPhoton).filter((item): item is AddressSuggestion => Boolean(item)));
}

async function fromNominatim(query: string, limit: number) {
  const wait = 1100 - (Date.now() - lastNominatimAt);
  if (wait > 0) {
    await new Promise((resolve) => setTimeout(resolve, wait));
  }
  lastNominatimAt = Date.now();

  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("addressdetails", "1");
  url.searchParams.set("limit", String(limit));
  url.searchParams.set("q", query);

  const payload = (await fetchJson(url, 5000)) as NominatimHit[] | null;
  if (!Array.isArray(payload)) {
    return [];
  }
  return dedupe(payload.map(formatNominatim).filter((item): item is AddressSuggestion => Boolean(item)));
}

export async function suggestAddresses(rawQuery: string, limit = 8): Promise<AddressSuggestion[]> {
  const query = cacheKey(rawQuery);
  if (query.length < 3) {
    return [];
  }

  const cached = cache.get(query);
  if (cached && Date.now() - cached.at < CACHE_MS) {
    return cached.items;
  }

  let items = await fromPhoton(query, limit);
  if (!items.length) {
    items = await fromNominatim(query, limit);
  }

  cache.set(query, { at: Date.now(), items });
  if (cache.size > 400) {
    const oldest = cache.keys().next().value;
    if (oldest) {
      cache.delete(oldest);
    }
  }
  return items;
}
