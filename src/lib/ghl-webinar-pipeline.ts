import { addGhlContactTags, ghlHeaders, lookupGhlContact, removeGhlContactTags, syncContactToGhl } from "@/lib/ghl";
import {
  createGhlOpportunity,
  getMastermindBuyerPipeline,
  listGhlOpportunitiesForContact,
  listGhlOpportunityPipelines,
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
let pipelineCache: { at: number; pipeline: GhlOpportunityPipeline | null } | null = null;

export function resetWebinarPipelineCache() {
  pipelineCache = null;
}

export async function findWebinarPipeline(): Promise<GhlOpportunityPipeline | null> {
  if (pipelineCache && Date.now() - pipelineCache.at < PIPELINE_CACHE_MS) {
    return pipelineCache.pipeline;
  }

  const pipelines = await listGhlOpportunityPipelines();
  const lower = (name: string) => name.trim().toLowerCase();
  const withRegistrantStage = pipelines.filter((item) => pickStage(item, ["registrant"]));
  if (withRegistrantStage.length > 1) {
    console.warn(
      "Several GHL pipelines have a Registrants stage; using the first:",
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
  pipelineCache = { at: Date.now(), pipeline };
  return pipeline;
}

function pickStage(pipeline: GhlOpportunityPipeline, keywords: string[]) {
  for (const keyword of keywords) {
    const match = pipeline.stages.find((stage) => stage.name.toLowerCase().includes(keyword));
    if (match) return match;
  }
  return null;
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
};

/** Pushes one webinar registrant into GoHighLevel so admins can filter, qualify and nurture them:
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
  options: { moveStage?: boolean; replaceStatusTags?: boolean } = {},
): Promise<WebinarGhlSyncResult> {
  const settings = await getResolvedIntegrationSettings();
  if (!settings.ghlApiKey || !settings.ghlLocationId) {
    return { status: "skipped" };
  }

  const tags = tagsFor(webinar, registrant);

  let contactId: string | undefined;
  const existing = await lookupGhlContact(registrant.email, registrant.phone);
  if (existing?.id) {
    contactId = existing.id;
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
  if (!contactId) {
    return { status: "failed" };
  }

  if (options.replaceStatusTags) {
    const stale = Object.entries(STATUS_TAG)
      .filter(([status]) => status !== registrant.status)
      .map(([, tag]) => tag);
    await removeGhlContactTags(contactId, stale);
  }

  const pipeline = await findWebinarPipeline();
  if (!pipeline) {
    return { status: "no_pipeline" };
  }
  const stage = stageFor(pipeline, registrant.status);
  if (!stage) {
    return { status: "no_pipeline" };
  }

  const opportunities = await listGhlOpportunitiesForContact(pipeline.id, contactId);

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
    return { status: updated.ok ? "synced" : "failed" };
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
        return { status: "failed" };
      }
      await addContactNote(contactId, noteFor(webinar, registrant));
    }
    return { status: "synced" };
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
    return { status: "failed" };
  }
  await addContactNote(contactId, noteFor(webinar, registrant));
  return { status: "synced" };
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
};

let backfillState: WebinarGhlBackfillState = {
  running: false,
  total: 0,
  processed: 0,
  synced: 0,
  failed: 0,
  noPipeline: false,
  skippedNotConnected: false,
};

export function getWebinarGhlBackfillState(): WebinarGhlBackfillState {
  return { ...backfillState };
}

const BACKFILL_CONCURRENCY = 2;
const BACKFILL_DELAY_MS = 250;

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
    return { started: false, total: 0, reason: "GoHighLevel isn't connected — add your API key and location ID in Integrations first." };
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
  };

  void (async () => {
    let cursor = 0;
    async function worker() {
      while (cursor < jobs.length) {
        const job = jobs[cursor];
        cursor += 1;
        try {
          const result = await syncWebinarRegistrantToGhl(job.webinar, job.registrant);
          if (result.status === "synced") backfillState.synced += 1;
          else if (result.status === "no_pipeline") backfillState.noPipeline = true;
          else backfillState.failed += 1;
        } catch (error) {
          console.error("Webinar GHL backfill item failed", error);
          backfillState.failed += 1;
        }
        backfillState.processed += 1;
        await new Promise((resolve) => setTimeout(resolve, BACKFILL_DELAY_MS));
      }
    }

    try {
      await Promise.all(Array.from({ length: BACKFILL_CONCURRENCY }, worker));
    } catch (error) {
      console.error("Webinar GHL backfill crashed", error);
    } finally {
      backfillState.running = false;
      backfillState.finishedAt = new Date().toISOString();
    }
  })();

  return { started: true, total: jobs.length };
}
