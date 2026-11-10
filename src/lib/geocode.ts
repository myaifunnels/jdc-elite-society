import { Pool } from "pg";

type Coords = { lat: number; lng: number };

const memoryCache = new Map<string, Coords | null>();
let pool: Pool | null | undefined;
let tableReady = false;

function getPool() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    return null;
  }

  if (pool === undefined) {
    pool = new Pool({
      connectionString,
      ssl: connectionString.includes("localhost") ? undefined : { rejectUnauthorized: false },
    });
  }

  return pool;
}

async function ensureTable(client: Pool) {
  if (tableReady) {
    return;
  }

  await client.query(`
    CREATE TABLE IF NOT EXISTS geocode_cache (
      query TEXT PRIMARY KEY,
      lat DOUBLE PRECISION,
      lng DOUBLE PRECISION,
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);
  tableReady = true;
}

function cacheKey(query: string) {
  return query.toLowerCase().replace(/\s+/g, " ").trim();
}

async function readCache(query: string): Promise<Coords | null | undefined> {
  if (memoryCache.has(query)) {
    return memoryCache.get(query);
  }

  const client = getPool();
  if (!client) {
    return undefined;
  }

  try {
    await ensureTable(client);
    const result = await client.query("SELECT lat, lng FROM geocode_cache WHERE query = $1 LIMIT 1", [query]);
    const row = result.rows[0] as { lat?: number; lng?: number } | undefined;
    if (!row) {
      return undefined;
    }
    if (typeof row.lat !== "number" || typeof row.lng !== "number") {
      memoryCache.set(query, null);
      return null;
    }
    const coords = { lat: row.lat, lng: row.lng };
    memoryCache.set(query, coords);
    return coords;
  } catch (error) {
    console.error("Geocode cache read failed", error);
    return undefined;
  }
}

async function writeCache(query: string, coords: Coords | null) {
  memoryCache.set(query, coords);
  const client = getPool();
  if (!client) {
    return;
  }

  try {
    await ensureTable(client);
    await client.query(
      `
      INSERT INTO geocode_cache (query, lat, lng, updated_at)
      VALUES ($1, $2, $3, NOW())
      ON CONFLICT (query) DO UPDATE SET lat = EXCLUDED.lat, lng = EXCLUDED.lng, updated_at = NOW()
      `,
      [query, coords?.lat ?? null, coords?.lng ?? null],
    );
  } catch (error) {
    console.error("Geocode cache write failed", error);
  }
}

export async function geocodeAddress(address: string): Promise<Coords | null> {
  const query = cacheKey(address);
  if (!query) {
    return null;
  }

  const cached = await readCache(query);
  if (cached !== undefined) {
    return cached;
  }

  const headers = {
    Accept: "application/json",
    "User-Agent": "CoachJDC/1.0 (https://coachjdc.org)",
  };

  try {
    const photonUrl = new URL("https://photon.komoot.io/api/");
    photonUrl.searchParams.set("q", query);
    photonUrl.searchParams.set("limit", "1");
    photonUrl.searchParams.set("lang", "en");
    const photonResponse = await fetch(photonUrl, { headers, cache: "no-store" });
    if (photonResponse.ok) {
      const photon = (await photonResponse.json()) as {
        features?: Array<{ geometry?: { coordinates?: [number, number] } }>;
      };
      const point = photon.features?.[0]?.geometry?.coordinates;
      const lng = point?.[0];
      const lat = point?.[1];
      if (typeof lat === "number" && typeof lng === "number" && Number.isFinite(lat) && Number.isFinite(lng)) {
        const coords = { lat, lng };
        await writeCache(query, coords);
        return coords;
      }
    }

    const url = new URL("https://nominatim.openstreetmap.org/search");
    url.searchParams.set("format", "jsonv2");
    url.searchParams.set("limit", "1");
    url.searchParams.set("q", query);
    const response = await fetch(url, { headers, cache: "no-store" });
    if (!response.ok) {
      await writeCache(query, null);
      return null;
    }

    const payload = (await response.json()) as Array<{ lat?: string; lon?: string }>;
    const first = payload[0];
    const lat = Number(first?.lat);
    const lng = Number(first?.lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      await writeCache(query, null);
      return null;
    }

    const coords = { lat, lng };
    await writeCache(query, coords);
    return coords;
  } catch (error) {
    console.error("Geocode lookup failed", error);
    return null;
  }
}
