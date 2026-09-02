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
    return `/api/media?key=${encodeURIComponent(key)}`;
  }
  return trimmed;
}

export function isDisplayableImageSrc(value?: string | null) {
  const trimmed = String(value ?? "").trim();
  if (!trimmed) {
    return false;
  }
  const key = extractR2ObjectKey(trimmed);
  if (key?.startsWith("receipts/")) {
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
  return !/\.pdf(?:$|\?|%3F)/i.test(src);
}
