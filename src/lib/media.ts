const R2_KEY_PREFIX = /^(receipts|profiles|contacts)\//;

function pathWithoutBucket(hostname: string, path: string) {
  if (hostname.endsWith(".r2.cloudflarestorage.com")) {
    return path.split("/").slice(1).join("/");
  }
  return path;
}

export function extractR2ObjectKey(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed || trimmed.includes("..")) {
    return null;
  }
  if (trimmed.startsWith("/api/media")) {
    try {
      const url = new URL(trimmed, "https://coachjdc.org");
      return extractR2ObjectKey(url.searchParams.get("key") ?? "");
    } catch {
      return null;
    }
  }
  if (R2_KEY_PREFIX.test(trimmed)) {
    return trimmed.replace(/^\/+/, "");
  }
  try {
    const url = new URL(trimmed);
    const path = pathWithoutBucket(url.hostname, decodeURIComponent(url.pathname.replace(/^\/+/, "")));
    if (R2_KEY_PREFIX.test(path) && !path.includes("..")) {
      return path;
    }
  } catch {
    return null;
  }
  return null;
}

export function mediaSrc(value?: string | null) {
  const trimmed = String(value ?? "").trim();
  if (!trimmed) {
    return undefined;
  }
  if (trimmed.startsWith("data:") || trimmed.startsWith("blob:") || trimmed.startsWith("/api/media")) {
    return trimmed;
  }
  const key = extractR2ObjectKey(trimmed);
  if (key) {
    const params = new URLSearchParams({ key });
    // If the original value was itself a fetchable URL (e.g. a receipt uploaded to a
    // different R2 account than the one configured in Integrations), keep it as a
    // fallback so the proxy can redirect there instead of dead-ending on a 404.
    if (/^https?:\/\//i.test(trimmed)) {
      params.set("fallback", trimmed);
    }
    return `/api/media?${params.toString()}`;
  }
  return trimmed;
}

export function isDisplayableImageSrc(value?: string | null) {
  const trimmed = String(value ?? "").trim();
  if (!trimmed) {
    return false;
  }
  const src = mediaSrc(trimmed);
  if (!src) {
    return false;
  }
  if (src.startsWith("data:application/pdf")) {
    return false;
  }
  if (src.startsWith("data:image") || src.startsWith("blob:")) {
    return true;
  }
  // Receipts and other uploads can be PDFs; everything else we store is an image.
  return !/\.pdf(?:$|\?|%3F)/i.test(trimmed);
}
