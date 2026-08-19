import { universityCourses, normalizeCourseTitle, type UniversityCourse } from "@/data/university";
import { getResolvedIntegrationSettings } from "@/lib/integrations-store";

type GhlProduct = {
  _id?: string;
  id?: string;
  name?: string;
  description?: string;
  image?: string;
  productType?: string;
};

function ghlHeaders(token: string) {
  return {
    Authorization: `Bearer ${token}`,
    Version: "2021-07-28",
    Accept: "application/json",
  };
}

async function fetchJson(url: string, token: string) {
  try {
    const response = await fetch(url, { headers: ghlHeaders(token), cache: "no-store" });
    if (!response.ok) {
      return null;
    }

    return (await response.json()) as Record<string, unknown>;
  } catch (error) {
    console.error("GHL course lookup failed", url, error);
    return null;
  }
}

function collectProducts(payload: Record<string, unknown> | null): GhlProduct[] {
  if (!payload) {
    return [];
  }

  const bags = [payload.products, payload.courses, payload.items, payload.data];
  const list = bags.find((item) => Array.isArray(item));
  return Array.isArray(list) ? (list as GhlProduct[]) : [];
}

export async function listUniversityCourses(): Promise<UniversityCourse[]> {
  const settings = await getResolvedIntegrationSettings();
  const token = settings.ghlApiKey;
  const locationId = settings.ghlLocationId;

  if (!token || !locationId) {
    return universityCourses;
  }

  const query = new URLSearchParams({ locationId, limit: "100" });
  const [productsPayload, coursesPayload] = await Promise.all([
    fetchJson(`https://services.leadconnectorhq.com/products/?${query.toString()}`, token),
    fetchJson(`https://services.leadconnectorhq.com/courses/?${query.toString()}`, token),
  ]);

  const remote = [...collectProducts(productsPayload), ...collectProducts(coursesPayload)];
  if (remote.length === 0) {
    return universityCourses;
  }

  return universityCourses.map((course) => {
    const match = remote.find((item) => {
      const name = String(item.name ?? "");
      return name && normalizeCourseTitle(name) === normalizeCourseTitle(course.ghlName);
    });

    if (!match) {
      return course;
    }

    return {
      ...course,
      summary: String(match.description ?? "").trim() || course.summary,
      imageUrl: String(match.image ?? "").trim() || course.imageUrl,
    };
  });
}
