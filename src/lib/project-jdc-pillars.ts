// The five areas of life every Project JDC task belongs to. Safe to import on server and client.

export const PILLARS = ["physical", "emotional", "financial", "mental", "spiritual"] as const;
export type Pillar = (typeof PILLARS)[number];

export const PILLAR_LABELS: Record<Pillar, string> = {
  physical: "Physical",
  emotional: "Emotional",
  financial: "Financial",
  mental: "Mental",
  spiritual: "Spiritual",
};

export const PILLAR_HINTS: Record<Pillar, string> = {
  physical: "Body, health and energy",
  emotional: "Feelings and relationships",
  financial: "Money, business and income",
  mental: "Learning, mindset and focus",
  spiritual: "Faith, purpose and gratitude",
};

/** Categories used before the five areas existed. */
const LEGACY: Record<string, Pillar> = {
  fitness: "physical",
  meditation: "spiritual",
  learning: "mental",
  planning: "mental",
  content: "financial",
};

export function isPillar(value: string): value is Pillar {
  return (PILLARS as readonly string[]).includes(value);
}

/** The area a task counts toward, or null for old tasks that never had one. */
export function pillarOf(category: string): Pillar | null {
  if (isPillar(category)) return category;
  return LEGACY[category] ?? null;
}

export const TASK_IDEAS: Record<Pillar, string[]> = {
  physical: ["Walk 10,000 steps", "Drink 8 glasses of water", "Do a 20-minute workout", "Sleep by 10 PM"],
  emotional: ["Call or message someone you love", "Write how you feel today", "Say thank you to someone", "Spend 30 minutes with family"],
  financial: ["Post today's content on Facebook", "Invite 1 person to the webinar", "Write down today's expenses", "Save ₱100 today"],
  mental: ["Watch today's training", "Read 10 pages of a book", "Plan tomorrow", "Learn one new skill for 20 minutes"],
  spiritual: ["Pray or meditate for 10 minutes", "Write 3 things you're grateful for", "Read an inspiring passage", "Do one kind act for a stranger"],
};

export type PillarCount = { given: number; done: number; checked: number };
export type PillarStats = Record<Pillar, PillarCount>;

export function emptyPillarStats(): PillarStats {
  return Object.fromEntries(PILLARS.map((pillar) => [pillar, { given: 0, done: 0, checked: 0 }])) as PillarStats;
}

/** Tasks given, done and checked per area. Old tasks without an area are left out. */
export function countByPillar(
  items: Array<{ category: string; studentDone: boolean; facilitatorApproved: boolean }>,
): PillarStats {
  const stats = emptyPillarStats();
  for (const item of items) {
    const pillar = pillarOf(item.category);
    if (!pillar) continue;
    stats[pillar].given += 1;
    if (item.studentDone) stats[pillar].done += 1;
    if (item.facilitatorApproved) stats[pillar].checked += 1;
  }
  return stats;
}

export function addPillarStats(target: PillarStats, source: PillarStats) {
  for (const pillar of PILLARS) {
    target[pillar].given += source[pillar].given;
    target[pillar].done += source[pillar].done;
    target[pillar].checked += source[pillar].checked;
  }
  return target;
}
