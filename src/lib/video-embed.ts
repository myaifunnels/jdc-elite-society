export type EmbeddableVideo = { type: "iframe" | "video" | "link"; src: string };

const YOUTUBE_RE = /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/;
const VIMEO_RE = /vimeo\.com\/(?:video\/)?(\d+)/;
const DRIVE_RE = /drive\.google\.com\/file\/d\/([\w-]+)/;

/** Turns an admin-pasted replay link (YouTube, Vimeo, Google Drive, or a direct video file) into
 * something the replay page can actually play inline, falling back to a plain "open in a new
 * tab" link for anything else (e.g. a Facebook video URL, which needs its own SDK to embed). */
export function getEmbeddableVideo(url: string): EmbeddableVideo {
  const trimmed = url.trim();

  const youtube = YOUTUBE_RE.exec(trimmed);
  if (youtube) {
    return { type: "iframe", src: `https://www.youtube.com/embed/${youtube[1]}` };
  }

  const vimeo = VIMEO_RE.exec(trimmed);
  if (vimeo) {
    return { type: "iframe", src: `https://player.vimeo.com/video/${vimeo[1]}` };
  }

  const drive = DRIVE_RE.exec(trimmed);
  if (drive) {
    return { type: "iframe", src: `https://drive.google.com/file/d/${drive[1]}/preview` };
  }

  if (/\.(mp4|webm|ogg|mov)(\?|$)/i.test(trimmed)) {
    return { type: "video", src: trimmed };
  }

  return { type: "link", src: trimmed };
}
