/**
 * Elite Builders roster. One star = 1 direct (a partner they referred into JDC Elite Society).
 *
 * Each "direct" entry is the day a builder got a direct. A builder's star count on a poster is the
 * number of their directs dated on or before that poster's day, so stars always show everything
 * they have so far.
 *
 * `photo` is a background-removed cutout in public/builders/ (make it with python rembg).
 * `face` corrects framing so every line-up face shows at the same head-and-shoulders scale:
 *   zoom = how much wider than the tile the cutout is drawn, y = shift up (px at tile scale).
 * Leave `photo` out and the tile shows the builder's initials until a photo is added.
 */
export type Builder = {
  id: string;
  first: string;
  last: string;
  /** ISO dates (2026-11-07) of each direct, oldest first. The first one is the day they joined. */
  directs: string[];
  /** Date shown on their line-up tile, when it differs from their first direct. */
  since?: string;
  photo?: string;
  face?: { zoom: number; y: number };
  /** Framing for the big builder-of-the-day cutout: scale of poster column height, x/y nudge. */
  hero?: { height: number; x: number; y: number };
};

export const ROSTER: Builder[] = [
  { id: "mark", first: "Mark", last: "Pigar", directs: ["2026-11-07"], photo: "builders/mark.png", face: { zoom: 1.35, y: 6 } },
  { id: "lucky", first: "Lucky", last: "Caigoy", directs: ["2026-11-09", "2026-11-09"], photo: "builders/lucky.png", face: { zoom: 1.3, y: 0 } },
  { id: "roy", first: "Roy", last: "Remulta", directs: ["2026-11-09"], photo: "builders/roy.png", face: { zoom: 1.25, y: 0 } },
  {
    id: "amira",
    first: "Amira",
    last: "Estayani",
    directs: ["2026-11-10", "2026-11-17"],
    photo: "builders/amira.png",
    face: { zoom: 1.45, y: 0 },
    hero: { height: 1, x: 0, y: 0 },
  },
  { id: "rad", first: "Rad", last: "Reyes", directs: ["2026-11-11", "2026-11-11", "2026-11-11"], photo: "builders/rad.png", face: { zoom: 1.3, y: 0 } },
  { id: "lenie", first: "Lenie", last: "Del Rosario", directs: ["2026-11-11"], photo: "builders/lenie.png", face: { zoom: 1.25, y: 42 } },
  { id: "thoby", first: "Thoby", last: "Magtibay", directs: ["2026-11-13"] },
  { id: "bernadette", first: "Bernadette", last: "Haguring", directs: ["2026-11-14"] },
  { id: "malvin", first: "Malvin", last: "Pontecilla", directs: ["2026-11-14"] },
];

/** One poster per builder-of-the-day. Add a line here, then `npm run render`. */
export type PosterSpec = { id: string; date: string; builder: string };

export const POSTERS: PosterSpec[] = [{ id: "2026-11-17-amira", date: "2026-11-17", builder: "amira" }];

export const starsOn = (b: Builder, date: string) => b.directs.filter((d) => d <= date).length;
export const joinedBy = (b: Builder, date: string) => b.directs[0] <= date;

const MONTHS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
const MONTHS_LONG = ["JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE", "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER"];
export const shortDate = (iso: string) => `${MONTHS[Number(iso.slice(5, 7)) - 1]} ${Number(iso.slice(8, 10))}`;
export const monthName = (iso: string) => MONTHS_LONG[Number(iso.slice(5, 7)) - 1];
