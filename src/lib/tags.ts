export type TagGroupId = "audience" | "program" | "stage" | "membership" | "ghl" | "custom";

export type TagGroup = {
  id: TagGroupId;
  label: string;
  tags: string[];
};

export const TAG_GROUPS: TagGroup[] = [
  {
    id: "audience",
    label: "Audience",
    tags: ["OFW", "Employee", "First-time entrepreneur", "Partner"],
  },
  {
    id: "program",
    label: "Program",
    tags: [
      "Mindset Reset",
      "Business Kickstart",
      "Life & Leadership Mentoring",
      "OFW Retirement Blueprint",
      "JDC Mastermind",
    ],
  },
  {
    id: "stage",
    label: "Stage",
    tags: ["New", "Qualified", "Follow-up", "Won", "Active", "Ramping"],
  },
  {
    id: "membership",
    label: "Membership",
    tags: ["JDC Elite Society", "University", "Website", "Inquiry", "Registration", "pioneer", "jdc-partner"],
  },
];

export function normalizeTag(value: string) {
  return value.replace(/\s+/g, " ").trim().slice(0, 48);
}

export function uniqueTags(tags: Array<string | undefined | null>) {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const tag of tags) {
    const next = normalizeTag(String(tag ?? ""));
    const key = next.toLowerCase();
    if (!next || seen.has(key)) {
      continue;
    }
    seen.add(key);
    result.push(next);
  }

  return result;
}

export function tagGroupFor(tag: string): TagGroupId {
  const key = normalizeTag(tag).toLowerCase();
  for (const group of TAG_GROUPS) {
    if (group.tags.some((item) => item.toLowerCase() === key)) {
      return group.id;
    }
  }
  return "custom";
}
