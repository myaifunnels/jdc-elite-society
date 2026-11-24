/**
 * Dates come from GHL Affiliate Manager: each direct is the "Created At" of the builder's lead/customer
 * in the JDC ELITE SOCIETY PROMOTION (Customers tab). Stars = all their leads so far.
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
  { id: "mark", first: "Mark", last: "Pigar", directs: ["2026-11-07"], photo: "builders/mark.png", face: { cx: 0.536, eye: 0.221, chin: 0.384 } },
  { id: "lucky", first: "Lucky", last: "Caigoy", directs: ["2026-10-30", "2026-11-09"], photo: "builders/lucky.png", face: { cx: 0.494, eye: 0.150, chin: 0.262 } },
  { id: "roy", first: "Roy", last: "Remulta", directs: ["2026-11-09", "2026-11-13", "2026-11-14"], photo: "builders/roy.png", face: { cx: 0.438, eye: 0.245, chin: 0.433 } },
  {
    id: "amira",
    first: "Amira",
    last: "Estayani",
    directs: ["2026-11-10", "2026-11-14", "2026-11-17"],
    photo: "builders/amira.png",
    face: { cx: 0.527, eye: 0.311, chin: 0.457 },
    hero: { height: 1, x: 0, y: 0 },
  },
  { id: "rad", first: "Rad", last: "Reyes", directs: ["2026-11-10", "2026-11-10", "2026-11-20"], photo: "builders/rad.png", face: { cx: 0.51, eye: 0.325, chin: 0.58 } },
  { id: "lenie", first: "Lenie", last: "Del Rosario", directs: ["2026-11-11"], photo: "builders/lenie.png", face: { cx: 0.476, eye: 0.545, chin: 0.821 } },
  { id: "thoby", first: "Thoby", last: "Magtibay", directs: ["2026-11-13"], photo: "builders/thoby.png", face: { cx: 0.548, eye: 0.192, chin: 0.340 } },
  { id: "bernadette", first: "Bernadette", last: "Haguring", directs: ["2026-11-16"], photo: "builders/bernadette.png", face: { cx: 0.473, eye: 0.222, chin: 0.374 } },
  // No JDC Elite Society direct in GHL as of Nov 23 (he is Mark's direct), so he is left out of the line-up until one is recorded.
  { id: "malvin", first: "Malvin", last: "Pontecilla", directs: ["2026-11-14"], photo: "builders/malvin.png", face: { cx: 0.423, eye: 0.226, chin: 0.372 } },
  // No photo yet: shows initials in the line-up; no solo card until her picture arrives.
  { id: "eva", first: "Eva", last: "Prieto", directs: ["2026-11-21"] },
  // First direct Gorgonio Reambillo Jr. (payment recorded Nov 23).
  { id: "grace", first: "Grace", last: "Guatlo", directs: ["2026-11-22"], photo: "builders/grace.png", face: { cx: 0.517, eye: 0.274, chin: 0.422 } },
  // First direct Rodulfo Escobido (Nov 23; owner said to treat it as approved).
  // October-only builders (order dates; payments were logged Nov 3). Photos from the owner, Nov 23.
  // Rodel Almeda (Oct 16) left off at the owner's request (Nov 23).
  { id: "jedh", first: "Jedh", last: "Marcus Mamangon", directs: ["2026-10-10"], photo: "builders/jedh.png", face: { cx: 0.55, eye: 0.12, chin: 0.27 } },
  { id: "francis", first: "Francis", last: "Joel Ishikawa Agor", directs: ["2026-10-16"], photo: "builders/francis.png", face: { cx: 0.415, eye: 0.279, chin: 0.471 } },
  { id: "daniel", first: "Daniel", last: "Malicdem", directs: ["2026-10-19"], photo: "builders/daniel.png", face: { cx: 0.481, eye: 0.237, chin: 0.448 } },
  { id: "michelle", first: "Michelle", last: "Escobido", directs: ["2026-11-23"], photo: "builders/michelle.png", face: { cx: 0.518, eye: 0.163, chin: 0.270 } },
  // First direct Alfred Capuyan (Nov 24). Payment still in verification; owner said to treat it as approved for the card (Nov 24).
  { id: "randy", first: "Randy", last: "Dolorito", directs: ["2026-11-24"], photo: "builders/randy.png", face: { cx: 0.36, eye: 0.261, chin: 0.489 } },
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
  // New builders, Nov 23: Michelle's first direct is today; Grace's was Nov 22.
  { id: "2026-11-23-michelle", date: "2026-11-23", builder: "michelle" },
  since("grace", "2026-11-23"),
  since("randy", "2026-11-24"),
];

/**
 * Builders with a direct in any of `months` ("2026-11"), counting only those months' directs.
 * Most directs first; ties go to whoever reached that count first (earliest date of their last direct),
 * then to the earlier first direct. `exclude` drops builder ids.
 */
export const rankingFor = (months: string[], exclude: string[] = []) =>
  ROSTER.filter((b) => !exclude.includes(b.id))
    .map((b) => {
      const d = b.directs.filter((x) => months.some((m) => x.startsWith(m)));
      return { b, n: d.length, first: d[0], reached: d[d.length - 1] };
    })
    .filter((x) => x.n > 0)
    .sort((x, y) => y.n - x.n || x.reached.localeCompare(y.reached) || x.first.localeCompare(y.first));
export const monthRanking = (month: string) => rankingFor([month]);

/**
 * Recap posters: every builder with a direct in `months`; stars = those months' directs.
 * `title`/`tag`/`range` override the header ("NOVEMBER" / "OF THE MONTH" / "2026").
 */
export type RecapSpec = { id: string; months: string[]; exclude?: string[]; title?: string; tag?: string; range?: string };
export const MONTH_POSTERS: RecapSpec[] = [
  { id: "2026-11-month", months: ["2026-11"] },
  // All time = since the ₱2,000 Elite launch in October (owner, Nov 23). Includes the October builders (owner, Nov 23).
  { id: "all-time", months: ["2026-10", "2026-11"], title: "ALL TIME", tag: "SINCE OCTOBER", range: "2026" },
];
/** Top-5-of-the-month posters (same ranking, first five). */
export const TOP_POSTERS = [{ id: "2026-11-top5", month: "2026-11" }];

/**
 * Panel posters (owner's "October Leaderboard" layout): one tall photo panel per builder, name plate below.
 * `photo` is a full photo in public/ (background kept); `fx`/`fy` = the face point as fractions of the photo,
 * `ar` = photo width/height, `fy`/`fc` = eye line and chin as fractions of the photo height.
 * Every photo is scaled so eye-to-chin is the same size, so all heads match. A transparent cutout gets the blue backdrop.
 */
export type PanelBuilder = { first: string; last: string; photo: string; ar: number; fx: number; fy: number; fc: number };
export type PanelSpec = { id: string; title: string; tag: string; year: string; builders: PanelBuilder[] };
export const PANEL_POSTERS: PanelSpec[] = [
  {
    id: "2026-10-month",
    title: "OCTOBER",
    tag: "ELITES OF THE MONTH",
    year: "2026",
    builders: [
      { first: "Daniel", last: "Malicdem", photo: "builders/photos/daniel.jpg", ar: 1, fx: 0.476, fy: 0.336, fc: 0.411 },
      { first: "Francis", last: "Agor", photo: "builders/photos/francis.jpg", ar: 1, fx: 0.483, fy: 0.255, fc: 0.416 },
      { first: "Jedh", last: "Mamangon", photo: "builders/photos/jedh.jpg", ar: 1, fx: 0.445, fy: 0.256, fc: 0.298 },
      { first: "Lucky", last: "Caigoy", photo: "builders/lucky.png", ar: 0.9175, fx: 0.496, fy: 0.138, fc: 0.238 },
    ],
  },
];
