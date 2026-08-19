const VIDEO_FILE = /\.(mp4|m4v|mov|webm|ogg)(?:$|\?)/i;

export type LessonMaterial = {
  title: string;
  url: string;
  type?: string;
};

export function isHttpUrl(value: string) {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

export function isDirectVideoUrl(url: string) {
  if (!isHttpUrl(url)) {
    return false;
  }

  const parsed = new URL(url);
  return VIDEO_FILE.test(parsed.pathname) || VIDEO_FILE.test(parsed.search) || VIDEO_FILE.test(url);
}

export function toEmbedUrl(url: string) {
  if (!isHttpUrl(url)) {
    return "";
  }

  const parsed = new URL(url);
  const host = parsed.hostname.replace(/^www\./, "");

  if (host === "youtu.be") {
    const id = parsed.pathname.replace("/", "");
    return id ? `https://www.youtube.com/embed/${id}` : "";
  }

  if (host === "youtube.com" || host === "m.youtube.com" || host === "youtube-nocookie.com") {
    const id = parsed.searchParams.get("v");
    if (id) {
      return `https://www.youtube.com/embed/${id}`;
    }
    const embed = parsed.pathname.match(/\/embed\/([^/]+)/);
    if (embed?.[1]) {
      return `https://www.youtube.com/embed/${embed[1]}`;
    }
  }

  if (host === "vimeo.com" || host === "player.vimeo.com") {
    const id = parsed.pathname.split("/").filter(Boolean).pop();
    return id ? `https://player.vimeo.com/video/${id}` : "";
  }

  if (host === "loom.com" || host === "www.loom.com") {
    const share = parsed.pathname.match(/\/share\/([^/]+)/);
    const embed = parsed.pathname.match(/\/embed\/([^/]+)/);
    const id = share?.[1] || embed?.[1];
    return id ? `https://www.loom.com/embed/${id}` : "";
  }

  if (parsed.pathname.includes("/embed/") || parsed.searchParams.has("embedded")) {
    return url;
  }

  return "";
}

export function extractUrlsFromText(value: string) {
  return Array.from(value.matchAll(/https?:\/\/[^\s"'<>]+/g), (match) => match[0].replace(/[),.;]+$/, ""));
}

export function pickLessonMedia(candidates: Array<string | undefined | null>) {
  const urls = candidates.map((item) => String(item ?? "").trim()).filter(isHttpUrl);
  const file = urls.find(isDirectVideoUrl) ?? "";
  const embed = urls.map(toEmbedUrl).find(Boolean) ?? "";

  return {
    videoUrl: file,
    embedUrl: file ? "" : embed,
  };
}
