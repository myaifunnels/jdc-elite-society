import { cache } from "react";

import { universityCourses, normalizeCourseTitle, type UniversityCourse, type UniversityLesson } from "@/data/university";
import { getResolvedIntegrationSettings } from "@/lib/integrations-store";
import { extractUrlsFromText, isDirectVideoUrl, isHttpUrl, pickLessonMedia } from "@/lib/lesson-media";

type Json = Record<string, unknown>;

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

    return (await response.json()) as unknown;
  } catch (error) {
    console.error("GHL course lookup failed", url, error);
    return null;
  }
}

function asRecord(value: unknown): Json | null {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Json) : null;
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function collectNamedArrays(payload: unknown, keys: string[]) {
  const record = asRecord(payload);
  if (!record) {
    if (Array.isArray(payload)) {
      return payload;
    }
    return [];
  }

  for (const key of keys) {
    if (Array.isArray(record[key])) {
      return record[key] as unknown[];
    }
  }

  if (Array.isArray(record.data)) {
    return record.data;
  }

  return [];
}

function text(value: unknown) {
  return String(value ?? "").trim();
}

function walk(value: unknown, visit: (node: Json) => void, seen = new Set<unknown>()) {
  if (!value || typeof value !== "object" || seen.has(value)) {
    return;
  }

  seen.add(value);

  if (Array.isArray(value)) {
    for (const item of value) {
      walk(item, visit, seen);
    }
    return;
  }

  visit(value as Json);
  for (const child of Object.values(value)) {
    walk(child, visit, seen);
  }
}

function looksLikePost(node: Json) {
  return Boolean(
    node.bucketVideoUrl ||
      node.contentType === "video" ||
      (Array.isArray(node.postMaterials) && node.postMaterials.length) ||
      ((node.videoUrl || node.embedUrl) && node.title && (node.contentType || node.description)),
  );
}

function looksLikeProduct(node: Json) {
  const name = text(node.title || node.name);
  return Boolean(name && (Array.isArray(node.categories) || node.productType || node._id || node.id));
}

function materialsFrom(value: unknown): NonNullable<UniversityLesson["materials"]> {
  return asArray(value)
    .map((item) => {
      const record = asRecord(item);
      if (!record) {
        return null;
      }

      const url = text(record.url || record.link || record.href);
      if (!isHttpUrl(url)) {
        return null;
      }

      return {
        title: text(record.title || record.name || record.type) || "Lesson file",
        url,
        type: text(record.type) || undefined,
      };
    })
    .filter((item): item is NonNullable<typeof item> => Boolean(item));
}

function lessonFromPost(node: Json, moduleTitle?: string): UniversityLesson {
  const materials = materialsFrom(node.postMaterials || node.materials || node.files) ?? [];
  const htmlUrls = extractUrlsFromText(text(node.description || node.content || node.html));
  const media = pickLessonMedia([
    text(node.bucketVideoUrl),
    text(node.videoUrl),
    text(node.embedUrl),
    text(node.url),
    ...materials.map((item) => item.url),
    ...htmlUrls,
  ]);

  return {
    title: text(node.title || node.name) || "Lesson",
    summary: text(node.description).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim() || "Membership lesson from GHL.",
    moduleTitle,
    thumbnailUrl: text(node.thumbnailUrl || node.image || node.poster) || undefined,
    materials,
    ...media,
  };
}

function lessonsFromCategories(categories: unknown[], parentTitle?: string): UniversityLesson[] {
  const lessons: UniversityLesson[] = [];

  for (const category of categories) {
    const record = asRecord(category);
    if (!record) {
      continue;
    }

    const moduleTitle = text(record.title || record.name) || parentTitle;
    const posts = collectNamedArrays(record, ["posts", "lessons", "items"]);
    for (const post of posts) {
      const node = asRecord(post);
      if (node) {
        lessons.push(lessonFromPost(node, moduleTitle));
      }
    }

    lessons.push(
      ...lessonsFromCategories(collectNamedArrays(record, ["subCategories", "categories", "modules"]), moduleTitle),
    );
  }

  return lessons;
}

function lessonsFromProduct(product: Json) {
  const fromCategories = lessonsFromCategories(collectNamedArrays(product, ["categories", "modules", "sections"]));
  if (fromCategories.length) {
    return fromCategories;
  }

  const posts: UniversityLesson[] = [];
  walk(product, (node) => {
    if (looksLikePost(node) && text(node.title || node.name)) {
      posts.push(lessonFromPost(node));
    }
  });
  return posts;
}

function productName(product: Json) {
  return text(product.title || product.name);
}

function productId(product: Json) {
  return text(product._id || product.id || product.productId);
}

function matchCourse(name: string, course: UniversityCourse) {
  const normalized = normalizeCourseTitle(name);
  if (!normalized) {
    return false;
  }

  return (
    normalized === normalizeCourseTitle(course.ghlName) ||
    normalized === normalizeCourseTitle(course.title) ||
    normalized.includes(normalizeCourseTitle(course.ghlName)) ||
    normalizeCourseTitle(course.ghlName).includes(normalized)
  );
}

function mediaFileUrl(file: Json) {
  return text(file.url || file.path || file.src || file.fileUrl);
}

function isVideoFile(file: Json) {
  const url = mediaFileUrl(file);
  const type = text(file.type || file.contentType || file.mimeType).toLowerCase();
  const name = text(file.name || file.filename || file.title).toLowerCase();
  return (
    type.includes("video") ||
    isDirectVideoUrl(url) ||
    /\.(mp4|m4v|mov|webm)$/i.test(name)
  );
}

function attachMediaToLessons(course: UniversityCourse, files: Json[]): UniversityLesson[] {
  const matched = files.filter((file) => {
    const haystack = `${text(file.name)} ${text(file.filename)} ${text(file.path)} ${mediaFileUrl(file)}`.toLowerCase();
    const needles = [course.ghlName, course.title, course.slug.replace(/-/g, " ")];
    return needles.some((needle) => haystack.includes(needle.toLowerCase()));
  });

  if (!matched.length) {
    return course.lessons;
  }

  if (matched.length >= course.lessons.length) {
    return matched.map((file, index) => {
      const url = mediaFileUrl(file);
      const existing = course.lessons[index];
      return {
        title: text(file.name || file.filename) || existing?.title || `Lesson ${index + 1}`,
        summary: existing?.summary || "Video from the JDC Elite Society GHL media library.",
        thumbnailUrl: text(file.thumbnailUrl || file.preview) || undefined,
        videoUrl: isDirectVideoUrl(url) ? url : undefined,
        embedUrl: isDirectVideoUrl(url) ? undefined : url,
      };
    });
  }

  return course.lessons.map((lesson, index) => {
    const file = matched[index];
    if (!file) {
      return lesson;
    }

    const url = mediaFileUrl(file);
    const media = pickLessonMedia([url]);
    return {
      ...lesson,
      thumbnailUrl: lesson.thumbnailUrl || text(file.thumbnailUrl || file.preview) || undefined,
      ...media,
    };
  });
}

async function listMediaPage(token: string, locationId: string, extra: Record<string, string> = {}) {
  const query = new URLSearchParams({
    altType: "location",
    altId: locationId,
    sortBy: "createdAt",
    sortOrder: "asc",
    limit: "100",
    ...extra,
  });
  const payload = await fetchJson(
    `https://services.leadconnectorhq.com/medias/files?${query.toString()}`,
    token,
  );
  return collectNamedArrays(payload, ["files", "medias", "items"]).map(asRecord).filter(Boolean) as Json[];
}

async function listMediaVideos(token: string, locationId: string) {
  const files: Json[] = [];
  const seen = new Set<string>();

  const addFiles = (page: Json[]) => {
    for (const file of page.filter(isVideoFile)) {
      const key = mediaFileUrl(file) || text(file.id || file._id || file.name);
      if (!key || seen.has(key)) {
        continue;
      }
      seen.add(key);
      files.push(file);
    }
  };

  for (let offset = 0; offset < 500; offset += 100) {
    const page = await listMediaPage(token, locationId, { offset: String(offset) });
    if (!page.length) {
      break;
    }
    addFiles(page);
    if (page.length < 100) {
      break;
    }
  }

  const courseQueries = universityCourses.map((course) => course.ghlName);
  const searched = await Promise.all(
    courseQueries.map((query) => listMediaPage(token, locationId, { query, offset: "0" })),
  );
  for (const page of searched) {
    addFiles(page);
  }

  return files;
}

async function loadGhlCoursePayloads(token: string, locationId: string) {
  const query = new URLSearchParams({ locationId, limit: "100" });
  const roots = await Promise.all([
    fetchJson(`https://services.leadconnectorhq.com/products/?${query.toString()}`, token),
    fetchJson(`https://services.leadconnectorhq.com/courses/?${query.toString()}`, token),
    fetchJson(`https://services.leadconnectorhq.com/courses/courses-exporter?${query.toString()}`, token),
    fetchJson(`https://services.leadconnectorhq.com/courses/courses-exporter/public/export?${query.toString()}`, token),
    fetchJson(`https://services.leadconnectorhq.com/memberships/?${query.toString()}`, token),
    fetchJson(`https://services.leadconnectorhq.com/memberships/courses?${query.toString()}`, token),
  ]);

  const products = new Map<string, Json>();

  const addProduct = (node: Json) => {
    const id = productId(node);
    const name = productName(node);
    const key = id || name;
    if (!key) {
      return;
    }
    products.set(key, { ...(products.get(key) ?? {}), ...node });
  };

  for (const payload of roots) {
    walk(payload, (node) => {
      if (looksLikeProduct(node) && productName(node)) {
        addProduct(node);
      }
    });
  }

  const listed = [...products.values()];
  const details = await Promise.all(
    listed.slice(0, 40).map(async (product) => {
      const id = productId(product);
      if (!id) {
        return product;
      }

      const detailQuery = new URLSearchParams({ locationId });
      const [byProduct, byCourse] = await Promise.all([
        fetchJson(`https://services.leadconnectorhq.com/products/${id}?${detailQuery.toString()}`, token),
        fetchJson(`https://services.leadconnectorhq.com/courses/${id}?${detailQuery.toString()}`, token),
      ]);

      return {
        ...product,
        ...(asRecord(byProduct) ?? {}),
        ...(asRecord(asRecord(byProduct)?.product) ?? {}),
        ...(asRecord(byCourse) ?? {}),
        ...(asRecord(asRecord(byCourse)?.course) ?? {}),
      };
    }),
  );

  for (const product of details) {
    addProduct(product);
  }

  return { products: [...products.values()], roots };
}

export const listUniversityCourses = cache(async function listUniversityCourses(): Promise<UniversityCourse[]> {
  const settings = await getResolvedIntegrationSettings();
  const token = settings.ghlApiKey;
  const locationId = settings.ghlLocationId;

  if (!token || !locationId) {
    return universityCourses;
  }

  const [{ products, roots }, mediaFiles] = await Promise.all([
    loadGhlCoursePayloads(token, locationId),
    listMediaVideos(token, locationId),
  ]);

  const remotePosts: UniversityLesson[] = [];
  for (const payload of roots) {
    walk(payload, (node) => {
      if (looksLikePost(node) && text(node.title || node.name)) {
        remotePosts.push(lessonFromPost(node));
      }
    });
  }

  if (products.length === 0 && mediaFiles.length === 0 && remotePosts.length === 0) {
    return universityCourses;
  }

  return universityCourses.map((course) => {
    const match = products.find((item) => matchCourse(productName(item), course));
    const fromProduct = match ? lessonsFromProduct(match) : [];
    const fromLoosePosts = remotePosts.filter((lesson) => matchCourse(lesson.title, course) || matchCourse(lesson.moduleTitle ?? "", course));
    const ghlLessons = (fromProduct.length ? fromProduct : fromLoosePosts).filter(
      (lesson, index, list) => list.findIndex((item) => item.title === lesson.title && item.videoUrl === lesson.videoUrl) === index,
    );

    const withMedia = attachMediaToLessons(
      {
        ...course,
        lessons: ghlLessons.length ? ghlLessons : course.lessons,
        summary: text(match?.description) || course.summary,
        imageUrl: text(match?.image || match?.imageUrl) || course.imageUrl,
      },
      mediaFiles,
    );

    return {
      ...course,
      summary: text(match?.description) || course.summary,
      imageUrl: text(match?.image || match?.imageUrl) || course.imageUrl,
      lessons: withMedia.length ? withMedia : course.lessons,
    };
  });
});
