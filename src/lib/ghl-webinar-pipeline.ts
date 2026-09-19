import { addGhlContactTags, ghlHeaders, lookupGhlContact, removeGhlContactTags, syncContactToGhl } from "@/lib/ghl";
import {
  createGhlOpportunity,
  listGhlOpportunitiesForContact,
  listGhlOpportunityPipelines,
  updateGhlOpportunity,
  type GhlOpportunityPipeline,
} from "@/lib/ghl-opportunities";
import { getResolvedIntegrationSettings } from "@/lib/integrations-store";
import { listRegistrants, type WebinarRegistrant } from "@/lib/webinar-registrants-store";
import { formatWebinarDateLabel, formatWebinarTimeLabel, type WebinarRecord } from "@/lib/webinars";
import { listWebinars } from "@/lib/webinars-store";

/** The GoHighLevel pipeline webinar registrants are pushed into. GHL's public API can't create
 * pipelines, so an admin creates it once in GHL (any name containing "webinar" works — this exact
 * name is preferred) with stages like Registered → Attended → Qualified → Nurture. New
 * registrants land in the stage named like "Registered" (or the first stage); overflow seats
 * awaiting payment review land in a stage named like "Pending"/"Overflow" when one exists. */
export const WEBINAR_PIPELINE_NAME = "JDC Webinar Registrants";

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
  const exact = pipelines.find((item) => item.name.trim().toLowerCase() === WEBINAR_PIPELINE_NAME.toLowerCase());
  const pipeline = exact ?? pipelines.find((item) => item.name.toLowerCase().includes("webinar")) ?? null;
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

function stageFor(pipeline: GhlOpportunityPipeline, status: WebinarRegistrant["status"]) {
  const registered = pickStage(pipeline, ["registered", "new"]) ?? pipeline.stages[0] ?? null;
  if (status === "pending") {
    return pickStage(pipeline, ["pending", "overflow", "payment", "review"]) ?? registered;
  }
  return registered;
}

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
  /** "synced" = contact + opportunity done; "no_pipeline" = contact/tags pushed but there's no
   * webinar pipeline in GHL yet to put an opportunity in; "skipped" = GHL isn't connected. */
  status: "synced" | "no_pipeline" | "skipped" | "failed";
};

/** Pushes one webinar registrant into GoHighLevel so admins can filter, qualify and nurture them:
 *  1. the contact — created or found, tagged with the webinar, seat type and status;
 *  2. an opportunity in the webinar pipeline (one per person per webinar, so registering for
 *     several webinars gives several trackable opportunities), valued at what they paid;
 *  3. a one-time note with the registration details.
 * Idempotent — safe to re-run. An existing opportunity's stage is left alone (an admin may have
 * already moved it to Qualified/Nurture) unless `moveStage` is set, which the approve/reject
 * actions use so a reviewed overflow seat advances out of "Pending". */
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

  const name = `${registrant.name} — ${webinar.title}`;
  const opportunityStatus = registrant.status === "rejected" ? "lost" : "open";
  const opportunities = await listGhlOpportunitiesForContact(pipeline.id, contactId);
  const match = opportunities.find((item) => item.name === name);

  if (match) {
    const updated = await updateGhlOpportunity(match.id, {
      name,
      monetaryValue: registrant.amountPaid,
      status: opportunityStatus,
      ...(options.moveStage ? { pipelineStageId: stage.id } : {}),
    });
    return { status: updated.ok ? "synced" : "failed" };
  }

  const created = await createGhlOpportunity({
    contactId,
    pipelineId: pipeline.id,
    pipelineStageId: stage.id,
    name,
    monetaryValue: registrant.amountPaid,
    status: opportunityStatus,
    source: "Webinar registration",
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
