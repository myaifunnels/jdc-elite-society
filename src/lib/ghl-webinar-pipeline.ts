import {
  addGhlContactTags,
  findGhlContactDuplicate,
  getGhlContactById,
  ghlHeaders,
  lookupGhlContact,
  removeGhlContactTags,
  syncContactToGhl,
} from "@/lib/ghl";
import {
  createGhlOpportunity,
  getMastermindBuyerPipeline,
  listGhlOpportunitiesForContact,
  listGhlOpportunityPipelines,
  searchGhlOpportunities,
  updateGhlOpportunity,
  type GhlOpportunityPipeline,
} from "@/lib/ghl-opportunities";
import { getResolvedIntegrationSettings } from "@/lib/integrations-store";
import { listRegistrants, type WebinarRegistrant } from "@/lib/webinar-registrants-store";
import { formatWebinarDateLabel, formatWebinarTimeLabel, type WebinarRecord } from "@/lib/webinars";
import { listWebinars } from "@/lib/webinars-store";

/** Webinar registrants are pushed into the campaign pipeline that has a "Registrants" stage (e.g.
 * "B2 Duplication Campaign" → "Webinar Registrants"), so admins qualify and move them through that
 * funnel. Resolution order: a pipeline with a stage named like "registrant" (the first, with a
 * warning if several exist); else an exact "JDC Mastermind" pipeline, the app's recognised
 * Mastermind buyer pipeline, any pipeline with "mastermind" in its name, then one with "webinar" in
 * its name. GHL's API can't create pipelines or stages, so this only ever attaches to ones that
 * already exist. */
const PIPELINE_CACHE_MS = 2 * 60 * 1000;
let pipelineCache: {
  at: number;
  pipeline: GhlOpportunityPipeline | null;
  /** Other pipelines that also have a Registrants stage (only `pipeline` is used). */
  otherCandidates: string[];
} | null = null;

export function resetWebinarPipelineCache() {
  pipelineCache = null;
}

export async function findWebinarPipeline(): Promise<GhlOpportunityPipeline | null> {
  if (pipelineCache && Date.now() - pipelineCache.at < PIPELINE_CACHE_MS) {
    return pipelineCache.pipeline;
  }

  const pipelines = await listGhlOpportunityPipelines();
  const lower = (name: string) => name.trim().toLowerCase();
  const withRegistrantStage = registrantPipelines(pipelines);
  if (withRegistrantStage.length > 1) {
    console.warn(
      "Several AiFunnels pipelines have a Registrants stage; using the first:",
      withRegistrantStage.map((item) => item.name).join(", "),
    );
  }
  const pipeline =
    withRegistrantStage[0] ??
    pipelines.find((item) => lower(item.name) === "jdc mastermind") ??
    (await getMastermindBuyerPipeline()) ??
    pipelines.find((item) => lower(item.name).includes("mastermind")) ??
    pipelines.find((item) => lower(item.name).includes("webinar")) ??
    null;
  pipelineCache = {
    at: Date.now(),
    pipeline,
    otherCandidates: pipeline ? withRegistrantStage.filter((item) => item.id !== pipeline.id).map((item) => item.name) : [],
  };
  return pipeline;
}

/** Pipelines that have a stage named like "registrant", best match first: one with a stage named
 * exactly "Webinar Registrants" outranks one with just a generic "Registrants" stage. */
function registrantPipelines(pipelines: GhlOpportunityPipeline[]) {
  const exact = (item: GhlOpportunityPipeline) =>
    item.stages.some((stage) => stage.name.trim().toLowerCase() === "webinar registrants");
  return pipelines
    .filter((item) => pickStage(item, ["registrant"]))
    .sort((left, right) => Number(exact(right)) - Number(exact(left)));
}

function pickStage(pipeline: GhlOpportunityPipeline, keywords: string[]) {
  for (const keyword of keywords) {
    const match = pipeline.stages.find((stage) => stage.name.toLowerCase().includes(keyword));
    if (match) return match;
  }
  return null;
}

export type WebinarRouting = {
  pipelineName: string;
  stageName: string;
  /** Other pipelines that also have a Registrants stage (only the first is used). */
  otherCandidates: string[];
};

/** Where a new registrant will land right now, read live from AiFunnels — shown in the admin
 * panel so it's obvious whether routing points at the right pipeline and stage. Null when GHL
 * isn't connected or no suitable pipeline exists. */
export async function describeWebinarRouting(): Promise<WebinarRouting | null> {
  const settings = await getResolvedIntegrationSettings();
  if (!settings.ghlApiKey || !settings.ghlLocationId) return null;
  const pipeline = await findWebinarPipeline();
  if (!pipeline) return null;
  const stage = stageFor(pipeline, "confirmed");
  if (!stage) return null;
  return { pipelineName: pipeline.name, stageName: stage.name, otherCandidates: pipelineCache?.otherCandidates ?? [] };
}

/** New registrants enter at the top of the funnel: a stage an admin has named for them
 * ("Registrants", "Webinar Registrants"…) if one exists, otherwise "Leads" (or a "Registered"/
 * "New" stage in a dedicated pipeline, else the first stage). Deliberately NOT matched on
 * "payment": the Mastermind pipeline's "2nd Batch Payment for Verification" is the Mastermind
 * checkout review, not a webinar overflow seat. */
function stageFor(pipeline: GhlOpportunityPipeline, status: WebinarRegistrant["status"]) {
  const entry =
    pickStage(pipeline, ["registrant", "webinar"]) ??
    pickStage(pipeline, ["lead", "registered", "new"]) ??
    pipeline.stages[0] ??
    null;
  if (status === "pending") {
    return pickStage(pipeline, ["pending", "overflow"]) ?? entry;
  }
  return entry;
}

/** Opportunities this module creates carry a "Webinar · …" source, which is how it recognises its
 * own later — and how it avoids ever editing a Mastermind buyer's or existing lead's opportunity. */
const WEBINAR_SOURCE_PREFIX = "Webinar";

/** Last resort when the registrant's email/phone matches no existing contact: a Facebook DM
 * contact (e.g. from the FREE COACHING comment workflow) is often created with just a name — no
 * email or phone to match on — so without this, every such person's registration would create a
 * duplicate contact instead of advancing their FB Page DMs card.
 *
 * Deliberately conservative — returns a match only when it's unambiguous:
 *  - an OPEN opportunity in the webinar pipeline, in a stage strictly before the registrant stage
 *    (so a person who has already moved further along is never touched by this);
 *  - whose contact name matches the registrant's name exactly, case-insensitively;
 *  - and there is exactly ONE such contact — two same-named candidates means "don't guess", not
 *    "pick one";
 *  - and that contact has neither an email nor a phone on file — if it already has a verified
 *    identity, a same-name coincidence is not enough to justify merging into it.
 * Any other outcome returns null and the caller creates a normal new contact instead. */
async function findNamesakeInEarlierStage(
  pipeline: GhlOpportunityPipeline,
  entryStageId: string,
  fullName: string,
): Promise<string | null> {
  const name = fullName.trim().toLowerCase();
  if (!name) return null;
  const entryRank = pipeline.stages.findIndex((item) => item.id === entryStageId);
  if (entryRank < 0) return null;

  const opportunities = await searchGhlOpportunities(pipeline.id);
  const candidateContactIds = new Set(
    opportunities
      .filter((item) => {
        const rank = pipeline.stages.findIndex((stage) => stage.id === item.pipelineStageId);
        return (
          item.status === "open" &&
          rank !== -1 &&
          rank < entryRank &&
          item.contactId &&
          (item.contactName || item.name).trim().toLowerCase() === name
        );
      })
      .map((item) => item.contactId),
  );
  if (candidateContactIds.size !== 1) return null;

  const [contactId] = candidateContactIds;
  const contact = await getGhlContactById(contactId);
  if (!contact || contact.email || contact.phone) return null;
  return contactId;
}

/** Added by the FREE COACHING comment workflow the moment someone comments — it means "commented
 * and was DM'd the registration link", NOT "registered". We only read it, to tell commenters who
 * registered apart from people who registered directly. */
const COMMENT_WORKFLOW_TAG = "passive-income-webinar-registrant";
const COMMENT_SOURCE_TAG = "Webinar source: FREE COACHING comment";
const DIRECT_SOURCE_TAG = "Webinar source: direct";

const STATUS_TAG: Record<WebinarRegistrant["status"], string> = {
  confirmed: "Webinar status: confirmed",
  pending: "Webinar status: pending review",
  rejected: "Webinar status: rejected",
};

function tagsFor(webinar: WebinarRecord, registrant: WebinarRegistrant) {
  return [
    "Webinar registrant",
    `Webinar: ${webinar.title}`,
    `Webinar seat: ${registrant.tier === "free" ? "free" : "overflow"}`,
    STATUS_TAG[registrant.status],
  ];
}

function noteFor(webinar: WebinarRecord, registrant: WebinarRegistrant) {
  const registeredAt = `${formatWebinarDateLabel(registrant.createdAt)} ${formatWebinarTimeLabel(registrant.createdAt)}`;
  return [
    `Webinar registration — ${webinar.title}`,
    `Webinar: ${formatWebinarDateLabel(webinar.scheduledAt)} · ${formatWebinarTimeLabel(webinar.scheduledAt)} Manila Time`,
    `Seat: ${registrant.tier === "free" ? "Free" : `Overflow (₱${registrant.amountPaid} paid)`}`,
    `Status: ${registrant.status === "pending" ? "Pending payment review" : registrant.status === "confirmed" ? "Confirmed" : "Rejected"}`,
    `Registered: ${registeredAt} Manila Time`,
    `Email: ${registrant.email}`,
    `Phone: ${registrant.phone || "—"}`,
    registrant.paymentReceiptUrl ? `Receipt: ${registrant.paymentReceiptUrl}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

async function addContactNote(contactId: string, body: string) {
  const settings = await getResolvedIntegrationSettings();
  const token = settings.ghlApiKey;
  if (!token || !contactId) return;
  try {
    const response = await fetch(`https://services.leadconnectorhq.com/contacts/${contactId}/notes`, {
      method: "POST",
      headers: ghlHeaders(token, true),
      signal: AbortSignal.timeout(10_000),
      body: JSON.stringify({ body }),
    });
    if (!response.ok) {
      console.error("GHL contact note failed", response.status, await response.text());
    }
  } catch (error) {
    console.error("GHL contact note error", error);
  }
}

export type WebinarGhlSyncResult = {
  /** "synced" = contact + opportunity done; "no_pipeline" = contact/tags pushed but no matching
   * pipeline was found in GHL to put an opportunity in; "skipped" = GHL isn't connected. */
  status: "synced" | "no_pipeline" | "skipped" | "failed";
  /** Where this registrant came from: "comment" = they had commented FREE COACHING (workflow tag,
   * or a card in an earlier stage of the funnel), "direct" = they registered without commenting. */
  source?: "comment" | "direct";
  /** Why a "failed" result failed, in words an admin can act on. */
  error?: string;
  /** What happened in the pipeline: a new card, an existing card moved up to the registrant stage,
   * or the person already had a card there (left as it was). */
  action?: PipelineAction;
};

type PipelineAction = "created" | "advanced" | "resynced" | "already_in_pipeline";
type PipelineOutcome = {
  status: WebinarGhlSyncResult["status"];
  advancedFromEarlier?: boolean;
  error?: string;
  action?: PipelineAction;
};
type SyncOptions = { moveStage?: boolean; replaceStatusTags?: boolean };

/** Pushes one webinar registrant into AiFunnels so admins can filter, qualify and nurture them:
 *  1. the contact — created or found, tagged with the webinar, seat type and status (the tags are
 *     what let admins filter by webinar in GHL, and they accumulate across webinars);
 *  2. a lead opportunity in the JDC Mastermind pipeline's "Leads" stage — but only if this person
 *     has no opportunity in that pipeline yet. Someone who's already a lead or a Mastermind buyer
 *     keeps their existing card untouched (no duplicate, no edits to a buyer's deal);
 *  3. a one-time note with the registration details when the opportunity is created.
 * Idempotent — safe to re-run. An opportunity this module created keeps whatever stage an admin
 * moved it to (Qualified, Nurture…) unless `moveStage` is set. */
export async function syncWebinarRegistrantToGhl(
  webinar: WebinarRecord,
  registrant: WebinarRegistrant,
  options: SyncOptions = {},
): Promise<WebinarGhlSyncResult> {
  const settings = await getResolvedIntegrationSettings();
  if (!settings.ghlApiKey || !settings.ghlLocationId) {
    return { status: "skipped" };
  }

  const tags = tagsFor(webinar, registrant);

  let contactId: string | undefined;
  let priorTags: string[] = [];
  // Try GHL's documented duplicate search first, then the older lookup endpoint.
  const existing =
    (await findGhlContactDuplicate(registrant.email, registrant.phone)) ??
    (await lookupGhlContact(registrant.email, registrant.phone));
  if (existing?.id) {
    contactId = existing.id;
    // The lookup response isn't guaranteed to carry tags, so fall back to fetching the contact.
    priorTags = Array.isArray(existing.tags) ? existing.tags : ((await getGhlContactById(existing.id))?.tags ?? []);
    await addGhlContactTags(contactId, tags);
  } else {
    // No email/phone match — before creating a new contact, check for an unambiguous namesake
    // sitting earlier in the funnel (see findNamesakeInEarlierStage) so a Facebook DM contact with
    // no email/phone on file doesn't get duplicated the moment they register.
    const pipelineForMatch = await findWebinarPipeline();
    const stageForMatch = pipelineForMatch ? stageFor(pipelineForMatch, registrant.status) : null;
    const namesakeId =
      pipelineForMatch && stageForMatch
        ? await findNamesakeInEarlierStage(pipelineForMatch, stageForMatch.id, registrant.name)
        : null;

    if (namesakeId) {
      contactId = namesakeId;
      priorTags = (await getGhlContactById(namesakeId))?.tags ?? [];
      await addGhlContactTags(contactId, tags);
    } else {
      const created = await syncContactToGhl({
        name: registrant.name,
        email: registrant.email,
        phone: registrant.phone,
        source: `Webinar · ${webinar.title}`,
        tags,
      });
      contactId = created.contactId;
    }
  }
  if (!contactId) {
    return { status: "failed", error: "Couldn't find or create the contact in AiFunnels (check the API key and its Contacts permission)." };
  }

  if (options.replaceStatusTags) {
    const stale = Object.entries(STATUS_TAG)
      .filter(([status]) => status !== registrant.status)
      .map(([, tag]) => tag);
    await removeGhlContactTags(contactId, stale);
  }

  const outcome = await placeInPipeline(webinar, registrant, contactId, options);

  // Label where this registrant came from, so admins can split the funnel in GHL: people who
  // commented FREE COACHING and then registered, versus people who registered directly. Someone
  // counts as a commenter if their contact carries the workflow's tag (or a source tag we set on an
  // earlier run), or if they had an open card in an earlier funnel stage that we just advanced.
  const has = (tag: string) => priorTags.some((item) => item.toLowerCase() === tag.toLowerCase());
  const isCommenter = has(COMMENT_WORKFLOW_TAG) || has(COMMENT_SOURCE_TAG) || Boolean(outcome.advancedFromEarlier);
  if (isCommenter) {
    if (!has(COMMENT_SOURCE_TAG)) await addGhlContactTags(contactId, [COMMENT_SOURCE_TAG]);
    if (has(DIRECT_SOURCE_TAG)) await removeGhlContactTags(contactId, [DIRECT_SOURCE_TAG]);
  } else if (!has(DIRECT_SOURCE_TAG)) {
    await addGhlContactTags(contactId, [DIRECT_SOURCE_TAG]);
  }

  return {
    status: outcome.status,
    source: isCommenter ? "comment" : "direct",
    error: outcome.error,
    action: outcome.action,
  };
}

/** The pipeline half of the sync: put the registrant's opportunity in the right stage (see the
 * rules on syncWebinarRegistrantToGhl and the comments below). */
async function placeInPipeline(
  webinar: WebinarRecord,
  registrant: WebinarRegistrant,
  contactId: string,
  options: SyncOptions,
): Promise<PipelineOutcome> {
  const pipeline = await findWebinarPipeline();
  if (!pipeline) {
    return { status: "no_pipeline" };
  }
  const stage = stageFor(pipeline, registrant.status);
  if (!stage) {
    return { status: "no_pipeline" };
  }

  const opportunities = await listGhlOpportunitiesForContact(pipeline.id, contactId);
  if (opportunities === null) {
    // Couldn't look — don't guess "none" and risk creating a duplicate card.
    return {
      status: "failed",
      error: "Couldn't read this contact's opportunities from AiFunnels (check the API key's Opportunities permission).",
    };
  }

  // An opportunity this module created earlier (recognised by its "Webinar · …" source): keep it
  // in step with the registration status — a rejected overflow seat closes it as lost — and only
  // move its stage when asked, so an admin's own stage moves are never undone.
  const ours = opportunities.find((item) => item.source.startsWith(WEBINAR_SOURCE_PREFIX));
  if (ours) {
    // If a dedicated Registrants stage has since been added, a card still sitting untouched in
    // the old default ("Leads") moves over to it. A card an admin already moved anywhere else stays.
    const leadsStage = pickStage(pipeline, ["lead"]);
    const upgradeFromLeads = Boolean(leadsStage) && stage.id !== leadsStage!.id && ours.pipelineStageId === leadsStage!.id;
    const updated = await updateGhlOpportunity(ours.id, {
      status: registrant.status === "rejected" ? "lost" : "open",
      ...(options.moveStage || upgradeFromLeads ? { pipelineStageId: stage.id } : {}),
    });
    // "resynced" = we already had this person's card and just confirmed/updated its status — a
    // healthy, expected outcome on a repeat sync, not a skip. Distinct from "already_in_pipeline"
    // below, which means a DIFFERENT card (someone else's route) was left alone.
    return updated.ok
      ? { status: "synced", action: "resynced" }
      : { status: "failed", error: updated.error };
  }

  // Already in this pipeline by another route (a "FB Page DMs" lead from the FREE COACHING comment
  // workflow, an existing lead, a Mastermind buyer…). Never duplicate or edit their deal — with one
  // exception: an open opportunity sitting in an EARLIER stage than the registrant stage advances
  // to it, since registering is exactly the progress that stage represents. Nobody is ever moved
  // backward, and won/lost deals are left alone. The tags added above record the registration.
  if (opportunities.length > 0) {
    const rank = (stageId: string) => pipeline.stages.findIndex((item) => item.id === stageId);
    const entryRank = rank(stage.id);
    const behind = opportunities
      .filter((item) => item.status === "open" && rank(item.pipelineStageId) !== -1 && rank(item.pipelineStageId) < entryRank)
      .sort((left, right) => rank(right.pipelineStageId) - rank(left.pipelineStageId))[0];
    if (behind && registrant.status !== "rejected") {
      const moved = await updateGhlOpportunity(behind.id, { pipelineStageId: stage.id });
      if (!moved.ok) {
        return { status: "failed", error: moved.error };
      }
      await addContactNote(contactId, noteFor(webinar, registrant));
      return { status: "synced", advancedFromEarlier: true, action: "advanced" };
    }
    return { status: "synced", action: "already_in_pipeline" };
  }

  // A rejected overflow request isn't a lead worth creating a card for.
  if (registrant.status === "rejected") {
    return { status: "synced" };
  }

  const created = await createGhlOpportunity({
    contactId,
    pipelineId: pipeline.id,
    pipelineStageId: stage.id,
    name: registrant.name,
    // Deliberately 0: this is a shared Mastermind pipeline whose totals track Mastermind sales, so
    // webinar money (e.g. a ₱499 overflow seat) goes in the note instead of inflating those totals.
    monetaryValue: 0,
    status: "open",
    source: `${WEBINAR_SOURCE_PREFIX} · ${webinar.title}`,
  });
  if (!created.ok) {
    return { status: "failed", error: created.error };
  }
  await addContactNote(contactId, noteFor(webinar, registrant));
  return { status: "synced", action: "created" };
}

const STATUS_RANK: Record<WebinarRegistrant["status"], number> = { confirmed: 2, pending: 1, rejected: 0 };

/** One row per person per webinar (the registrants table can hold duplicates from old double
 * submits) — keeps whichever is furthest along, so a backfill never creates two opportunities. */
function uniqueRegistrants(registrants: WebinarRegistrant[]) {
  const best = new Map<string, WebinarRegistrant>();
  for (const registrant of registrants) {
    const key = registrant.userId || registrant.email;
    const current = best.get(key);
    if (!current || STATUS_RANK[registrant.status] > STATUS_RANK[current.status]) {
      best.set(key, registrant);
    }
  }
  return [...best.values()];
}

export type WebinarGhlBackfillState = {
  running: boolean;
  startedAt?: string;
  finishedAt?: string;
  total: number;
  processed: number;
  synced: number;
  failed: number;
  /** True when contacts were pushed but no webinar pipeline exists in GHL to hold opportunities. */
  noPipeline: boolean;
  skippedNotConnected: boolean;
  /** Registrants who had commented FREE COACHING first. */
  fromComment: number;
  /** Registrants who registered without commenting. */
  direct: number;
  /** What the pipeline step did: brand-new cards, cards moved up from an earlier stage, cards we
   * already had that were simply confirmed/updated (a healthy repeat-sync outcome), and people who
   * already had a DIFFERENT card further along by another route (left untouched — e.g. existing
   * Mastermind buyers). */
  created: number;
  advanced: number;
  resynced: number;
  alreadyInPipeline: number;
  /** Open cards still sitting in a stage before "Webinar Registrants" — i.e. commented (or were
   * otherwise added) but haven't registered. Null until a run has finished counting. */
  stillBeforeRegistrants: number | null;
  /** Up to three distinct reasons registrants failed, so a stuck run explains itself. */
  errorSamples: string[];
};

let backfillState: WebinarGhlBackfillState = {
  running: false,
  total: 0,
  processed: 0,
  synced: 0,
  failed: 0,
  noPipeline: false,
  skippedNotConnected: false,
  fromComment: 0,
  direct: 0,
  created: 0,
  advanced: 0,
  resynced: 0,
  alreadyInPipeline: 0,
  stillBeforeRegistrants: null,
  errorSamples: [],
};

function recordError(message?: string) {
  const text = message?.trim();
  if (text && backfillState.errorSamples.length < 3 && !backfillState.errorSamples.includes(text)) {
    backfillState.errorSamples.push(text);
  }
}

/** How many open opportunities are still in a stage before the registrant stage. Read-only. */
async function countStillBeforeRegistrants(): Promise<number | null> {
  const pipeline = await findWebinarPipeline();
  if (!pipeline) return null;
  const entry = stageFor(pipeline, "confirmed");
  if (!entry) return null;
  const entryRank = pipeline.stages.findIndex((item) => item.id === entry.id);
  const opportunities = await searchGhlOpportunities(pipeline.id);
  return opportunities.filter((item) => {
    const rank = pipeline.stages.findIndex((stage) => stage.id === item.pipelineStageId);
    return item.status === "open" && rank !== -1 && rank < entryRank;
  }).length;
}

export function getWebinarGhlBackfillState(): WebinarGhlBackfillState {
  return { ...backfillState };
}

const BACKFILL_CONCURRENCY = 3;
const BACKFILL_DELAY_MS = 150;

/** Kicks off a background push of every existing registrant (all webinars) into GHL and returns
 * immediately — ~170 registrants at a few GHL calls each takes minutes, longer than a request
 * should be held open, and GHL rate-limits bursts. Progress is readable via
 * getWebinarGhlBackfillState(). Safe to run repeatedly (see syncWebinarRegistrantToGhl). */
export async function startWebinarGhlBackfill(): Promise<{ started: boolean; total: number; reason?: string }> {
  if (backfillState.running) {
    return { started: false, total: backfillState.total, reason: "A sync is already running." };
  }

  const settings = await getResolvedIntegrationSettings();
  if (!settings.ghlApiKey || !settings.ghlLocationId) {
    backfillState = { ...backfillState, skippedNotConnected: true };
    return { started: false, total: 0, reason: "AiFunnels isn't connected — add your API key and location ID in Integrations first." };
  }

  resetWebinarPipelineCache();
  const webinars = await listWebinars();
  const jobs: Array<{ webinar: WebinarRecord; registrant: WebinarRegistrant }> = [];
  for (const webinar of webinars) {
    const registrants = uniqueRegistrants(await listRegistrants(webinar.id));
    for (const registrant of registrants) {
      jobs.push({ webinar, registrant });
    }
  }

  backfillState = {
    running: true,
    startedAt: new Date().toISOString(),
    total: jobs.length,
    processed: 0,
    synced: 0,
    failed: 0,
    noPipeline: false,
    skippedNotConnected: false,
    fromComment: 0,
    direct: 0,
    created: 0,
    advanced: 0,
    resynced: 0,
    alreadyInPipeline: 0,
    stillBeforeRegistrants: null,
    errorSamples: [],
  };

  void (async () => {
    let cursor = 0;
    async function worker() {
      while (cursor < jobs.length) {
        const job = jobs[cursor];
        cursor += 1;
        try {
          const result = await syncWebinarRegistrantToGhl(job.webinar, job.registrant);
          if (result.status === "synced") {
            backfillState.synced += 1;
            if (result.source === "comment") backfillState.fromComment += 1;
            else if (result.source === "direct") backfillState.direct += 1;
            if (result.action === "created") backfillState.created += 1;
            else if (result.action === "advanced") backfillState.advanced += 1;
            else if (result.action === "resynced") backfillState.resynced += 1;
            else if (result.action === "already_in_pipeline") backfillState.alreadyInPipeline += 1;
          } else if (result.status === "no_pipeline") {
            backfillState.noPipeline = true;
          } else {
            backfillState.failed += 1;
            recordError(result.error);
          }
        } catch (error) {
          console.error("Webinar GHL backfill item failed", error);
          backfillState.failed += 1;
          recordError(error instanceof Error ? error.message : "Unexpected error");
        }
        backfillState.processed += 1;
        await new Promise((resolve) => setTimeout(resolve, BACKFILL_DELAY_MS));
      }
    }

    try {
      await Promise.all(Array.from({ length: BACKFILL_CONCURRENCY }, worker));
      backfillState.stillBeforeRegistrants = await countStillBeforeRegistrants();
    } catch (error) {
      console.error("Webinar GHL backfill crashed", error);
    } finally {
      backfillState.running = false;
      backfillState.finishedAt = new Date().toISOString();
    }
  })();

  return { started: true, total: jobs.length };
}
