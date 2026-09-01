export type TagGroupId = "audience" | "program" | "stage" | "membership" | "offer" | "access" | "ghl" | "custom";

/**
 * Applying these tags is what actually unlocks the buyer's GHL Membership
 * courses and JDC Elite Society community group — GHL workflows on the
 * JDC Elite Society subaccount are configured to grant/revoke portal access
 * when a contact gains/loses these tags. Keep names in sync with GHL.
 */
export const COURSE_ACCESS_TAGS = [
  "JDC Mastermind Session 1",
  "JDC Mastermind Session 2",
  "JDC Elite Society Group",
] as const;

export const PAYMENT_REJECTED_TAG = "Payment Rejected";

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
    tags: ["New", "Qualified", "Follow-up", "Won", "Active", "Ramping", "Payment pending", "Payment verified"],
  },
  {
    id: "membership",
    label: "Membership",
    tags: ["JDC Elite Society", "University", "Website", "Inquiry", "Registration", "pioneer", "jdc-partner"],
  },
  {
    id: "offer",
    label: "Offer",
    tags: [
      "jdc-mastermind",
      "jdc-mastermind-buyer",
      "jdc-mastermind-second-batch",
      "mastermind",
      "pipeline-leads",
      "webinar-paid",
      "Elite offer",
      "Mastermind checkout",
      "1-on-1 Coaching",
      "Online Coaching",
      "In-person Coaching",
      "spartans-coupon",
      "BPI Bank",
      "GCash",
    ],
  },
  {
    id: "access",
    label: "Course & group access",
    tags: [...COURSE_ACCESS_TAGS, PAYMENT_REJECTED_TAG],
  },
];

export function mastermindCheckoutTags(input: {
  paymentMethod: string;
  priceLabel: string;
  couponApplied: boolean;
  extra?: string[];
}) {
  return uniqueTags([
    "JDC Mastermind",
    "jdc-mastermind",
    "webinar-paid",
    "Elite offer",
    "Mastermind checkout",
    "Payment pending",
    ...COURSE_ACCESS_TAGS,
    input.paymentMethod,
    input.priceLabel,
    input.couponApplied ? "spartans-coupon" : "",
    ...(input.extra ?? []),
  ]);
}

export function coachingOfferTags(input: {
  coachingMode: "online" | "in-person";
  coachingHours: number;
  priceLabel: string;
  extra?: string[];
}) {
  return uniqueTags([
    "1-on-1 Coaching",
    input.coachingMode === "in-person" ? "In-person Coaching" : "Online Coaching",
    `Coaching: ${input.coachingHours} hour${input.coachingHours === 1 ? "" : "s"}`,
    input.priceLabel,
    ...(input.extra ?? []),
  ]);
}

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
