/**
 * Dates come from GHL Affiliate Manager: each direct is the "Created At" of the builder's lead/customer
 * in the JDC ELITE SOCIETY PROMOTION (Customers tab). November posters count November leads only.
 *
 * Elite Builders roster. One star = 1 direct (a partner they referred into JDC Elite Society).
 *
 * Each "direct" entry is the day a builder got a direct. A builder's star count on a poster is the
 * number of their directs dated on or before that poster's day, so stars always show everything
 * they have so far.
 *
 * `photo` is a background-removed cutout in public/builders/ (make it with python rembg).
 * `face` marks where the face is in the cutout so every line-up tile shows the same head-and-shoulders
 * scale and height: cx = face centre x, eye = eye line y, chin = chin y — all as fractions of the cutout's WIDTH.
 * Measure them on the cutout (eye-to-chin is the scale, so all heads come out the same size).
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
  face?: { cx: number; eye: number; chin: number };
  /** Framing for the big builder-of-the-day cutout: scale of poster column height, x/y nudge. */
  hero?: { height: number; x: number; y: number };
};

export const ROSTER: Builder[] = [
  { id: "mark", first: "Mark", last: "Pigar", directs: ["2026-11-07"], photo: "builders/mark.png", face: { cx: 0.41, eye: 0.225, chin: 0.375 } },
  { id: "lucky", first: "Lucky", last: "Caigoy", directs: ["2026-11-09"], photo: "builders/lucky.png", face: { cx: 0.49, eye: 0.15, chin: 0.275 } },
  { id: "roy", first: "Roy", last: "Remulta", directs: ["2026-11-09", "2026-11-13", "2026-11-14"], photo: "builders/roy.png", face: { cx: 0.425, eye: 0.25, chin: 0.46 } },
  {
    id: "amira",
    first: "Amira",
    last: "Estayani",
    directs: ["2026-11-10", "2026-11-14", "2026-11-17"],
    photo: "builders/amira.png",
    face: { cx: 0.5, eye: 0.32, chin: 0.425 },
    hero: { height: 1, x: 0, y: 0 },
  },
  { id: "rad", first: "Rad", last: "Reyes", directs: ["2026-11-10", "2026-11-10", "2026-11-20"], photo: "builders/rad.png", face: { cx: 0.51, eye: 0.325, chin: 0.532 } },
  { id: "lenie", first: "Lenie", last: "Del Rosario", directs: ["2026-11-11"], photo: "builders/lenie.png", face: { cx: 0.49, eye: 0.56, chin: 0.836 } },
  { id: "thoby", first: "Thoby", last: "Magtibay", directs: ["2026-11-13"], photo: "builders/thoby.png", face: { cx: 0.55, eye: 0.2, chin: 0.353 } },
  { id: "bernadette", first: "Bernadette", last: "Haguring", directs: ["2026-11-16"], photo: "builders/bernadette.png", face: { cx: 0.45, eye: 0.19, chin: 0.325 } },
  // No JDC Elite Society direct in GHL as of Nov 23 (he is Mark's direct), so he is left out of the line-up until one is recorded.
  { id: "malvin", first: "Malvin", last: "Pontecilla", directs: [], photo: "builders/malvin.png", face: { cx: 0.44, eye: 0.225, chin: 0.357 } },
  // No photo yet: shows initials in the line-up; no solo card until her picture arrives.
  { id: "eva", first: "Eva", last: "Prieto", directs: ["2026-11-21"] },
];

export const starsOn = (b: Builder, date: string) => b.directs.filter((d) => d <= date).length;
export const joinedBy = (b: Builder, date: string) => b.directs.length > 0 && b.directs[0] <= date;

const MONTHS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
const MONTHS_LONG = ["JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE", "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER"];
export const shortDate = (iso: string) => `${MONTHS[Number(iso.slice(5, 7)) - 1]} ${Number(iso.slice(8, 10))}`;
export const monthName = (iso: string) => MONTHS_LONG[Number(iso.slice(5, 7)) - 1];

/** One poster per builder-of-the-day. Add a line here, then `npm run render`. */
/** `chip` replaces the default "TODAY · NOV xx" label above the name (e.g. for a builder with no new direct that day). */
export type PosterSpec = { id: string; date: string; builder: string; chip?: string };

const since = (id: string, date: string) => {
  const b = ROSTER.find((x) => x.id === id)!;
  return { id: `${date}-${id}`, date, builder: id, chip: `ELITE SINCE · ${shortDate(b.since ?? b.directs[0])}` };
};

export const POSTERS: PosterSpec[] = [
  { id: "2026-11-17-amira", date: "2026-11-17", builder: "amira" },
  // Nov 23 set: one card per builder with a photo, all showing today's line-up and stars.
  ...["amira", "rad", "mark", "lucky", "roy", "lenie", "thoby", "bernadette"].map((id) => since(id, "2026-11-23")),
];
