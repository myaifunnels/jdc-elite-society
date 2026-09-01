export const PIPELINE_STAGES = [
  {
    id: "leads",
    label: "Leads",
    detail: "New inquiries and people who are not in a paid batch yet.",
  },
  {
    id: "payment",
    label: "Payment for Verification",
    detail: "Checkout receipts and payment-pending tags waiting on the team.",
  },
  {
    id: "first-batch",
    label: "First Batch",
    detail: "GHL contacts tagged mastermind or jdc-mastermind-buyer.",
  },
  {
    id: "second-batch",
    label: "Second Batch",
    detail: "GHL contacts tagged jdc-mastermind-second-batch.",
  },
] as const;

export type PipelineStageId = (typeof PIPELINE_STAGES)[number]["id"];

export const SECOND_BATCH_TAGS = ["jdc-mastermind-second-batch"];
export const FIRST_BATCH_TAGS = ["jdc-mastermind-buyer", "jdc-mastermind", "mastermind", "jdc mastermind"];
const PAYMENT_TAGS = ["payment pending"];
const LEAD_TAGS = ["pipeline-leads", "lead"];

export const PIPELINE_GHL_FETCH_TAGS = [...FIRST_BATCH_TAGS, ...SECOND_BATCH_TAGS];

export const PIPELINE_WRITE_TAGS: Record<PipelineStageId, string[]> = {
  leads: ["pipeline-leads"],
  payment: ["Payment pending"],
  "first-batch": ["jdc-mastermind-buyer", "jdc-mastermind"],
  "second-batch": ["jdc-mastermind-second-batch"],
};

export const PIPELINE_MANAGED_TAGS = uniqueLower([
  ...LEAD_TAGS,
  ...PAYMENT_TAGS,
  ...FIRST_BATCH_TAGS,
  ...SECOND_BATCH_TAGS,
  "pipeline-leads",
  "payment pending",
]);

function uniqueLower(values: string[]) {
  return [...new Set(values.map((value) => value.toLowerCase()))];
}

export function tagKey(value: string) {
  return value.replace(/\s+/g, " ").trim().toLowerCase();
}

function hasExactTag(tags: string[], names: string[]) {
  const have = new Set(tags.map(tagKey));
  return names.some((name) => have.has(tagKey(name)));
}

export function classifyPipelineStage(
  tags: string[],
  options?: { paymentPending?: boolean },
): PipelineStageId {
  if (hasExactTag(tags, SECOND_BATCH_TAGS)) {
    return "second-batch";
  }
  if (hasExactTag(tags, FIRST_BATCH_TAGS)) {
    return "first-batch";
  }
  if (hasExactTag(tags, PAYMENT_TAGS) || options?.paymentPending) {
    return "payment";
  }
  return "leads";
}

export function tagsForPipelineStage(currentTags: string[], stage: PipelineStageId) {
  const kept = currentTags.filter((tag) => !PIPELINE_MANAGED_TAGS.includes(tagKey(tag)));
  return [...kept, ...PIPELINE_WRITE_TAGS[stage]];
}

export function isPipelineStageId(value: string): value is PipelineStageId {
  return PIPELINE_STAGES.some((stage) => stage.id === value);
}
