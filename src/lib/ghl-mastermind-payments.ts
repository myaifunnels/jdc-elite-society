import { findGhlContactDuplicate, lookupGhlContact, syncContactToGhl } from "@/lib/ghl";
import {
  addContactNote,
  findWebinarPipeline,
  pickStage,
  pickStageAll,
} from "@/lib/ghl-webinar-pipeline";
import {
  createGhlOpportunity,
  listGhlOpportunitiesForContact,
  updateGhlOpportunity,
} from "@/lib/ghl-opportunities";
import type { EliteCheckoutOrder } from "@/lib/elite-checkout-store";
import { getResolvedIntegrationSettings } from "@/lib/integrations-store";

/** Mastermind checkout payments live in the same campaign pipeline as the webinar registrants
 * ("B2 Duplication Campaign"): a pending receipt belongs in its "Payment for Verification" stage so
 * admins can check it there, an approved one moves on to the "Paid" stage, a rejected one to
 * "Payment Rejected". Cards this module creates carry a "Mastermind payment · …" source. */
const PAYMENT_SOURCE_PREFIX = "Mastermind payment";

export type MastermindPaymentSyncResult = {
  status: "synced" | "no_pipeline" | "skipped" | "failed";
  action?: "created" | "moved" | "updated" | "left_alone";
  error?: string;
};

function stageForOrder(pipeline: NonNullable<Awaited<ReturnType<typeof findWebinarPipeline>>>, status: EliteCheckoutOrder["status"]) {
  const payment = pickStageAll(pipeline, ["payment", "verif"]) ?? pickStage(pipeline, ["pending"]);
  if (status === "approved") return pickStage(pipeline, ["paid", "buyer"]) ?? payment;
  if (status === "rejected") return pickStage(pipeline, ["reject"]) ?? payment;
  return payment;
}

function noteFor(order: EliteCheckoutOrder) {
  const lines = [
    `Mastermind payment — ${order.status === "pending" ? "pending verification" : order.status}`,
    `Amount: ₱${order.price}`,
    `Method: ${order.paymentMethod}`,
    `Submitted: ${order.createdAt}`,
    `Email: ${order.email}`,
    `Phone: ${order.mobile || "—"}`,
  ];
  if (order.receiptUrl) {
    lines.unshift(`PAYMENT RECEIPT: ${order.receiptUrl}`, "");
  }
  return lines.join("\n");
}

const RATE_LIMITED = /\(429\)/;

/** Puts a Mastermind checkout order's card in the right stage of the campaign pipeline, never
 * duplicating: if the person already has a card there (from the webinar, the FREE COACHING funnel,
 * an earlier sync…) that card is moved forward to the payment stage instead of a second one being
 * created, and nobody is ever moved backward. Idempotent; retries once on a 429. */
export async function syncMastermindOrderToGhl(order: EliteCheckoutOrder): Promise<MastermindPaymentSyncResult> {
  const first = await syncOnce(order);
  if (first.status === "failed" && RATE_LIMITED.test(first.error ?? "")) {
    await new Promise((resolve) => setTimeout(resolve, 2000));
    return syncOnce(order);
  }
  return first;
}

async function syncOnce(order: EliteCheckoutOrder): Promise<MastermindPaymentSyncResult> {
  const settings = await getResolvedIntegrationSettings();
  if (!settings.ghlApiKey || !settings.ghlLocationId) return { status: "skipped" };

  const pipeline = await findWebinarPipeline();
  const stage = pipeline ? stageForOrder(pipeline, order.status) : null;
  if (!pipeline || !stage) return { status: "no_pipeline" };

  let contactId: string | undefined;
  const existing = (await findGhlContactDuplicate(order.email, order.mobile)) ?? (await lookupGhlContact(order.email, order.mobile));
  if (existing?.id) {
    contactId = existing.id;
  } else {
    const created = await syncContactToGhl({
      name: order.fullName,
      email: order.email,
      phone: order.mobile,
      source: "Mastermind offer",
      tags: ["jdc-mastermind-payment-verification"],
    });
    contactId = created.contactId;
    if (!contactId) {
      return { status: "failed", error: ("error" in created && created.error) || "Couldn't find or create the contact in AiFunnels." };
    }
  }

  const found = await listGhlOpportunitiesForContact(pipeline.id, contactId);
  if (found.items === null) return { status: "failed", error: found.error };

  const rank = (stageId: string) => pipeline.stages.findIndex((item) => item.id === stageId);
  const targetRank = rank(stage.id);
  const open = found.items.filter((item) => item.status === "open");

  if (found.items.length > 0) {
    // Reuse the card furthest along; never create a second one for the same person.
    const card = [...open].sort((a, b) => rank(b.pipelineStageId) - rank(a.pipelineStageId))[0];
    if (!card) return { status: "synced", action: "left_alone" };
    const cardRank = rank(card.pipelineStageId);
    const behind = cardRank !== -1 && cardRank < targetRank;
    if (behind) {
      const moved = await updateGhlOpportunity(card.id, { pipelineStageId: stage.id, monetaryValue: order.price });
      if (!moved.ok) return { status: "failed", error: moved.error };
      await addContactNote(contactId, noteFor(order));
      return { status: "synced", action: "moved" };
    }
    if (cardRank === targetRank && card.source.startsWith(PAYMENT_SOURCE_PREFIX)) {
      const updated = await updateGhlOpportunity(card.id, { monetaryValue: order.price });
      return updated.ok ? { status: "synced", action: "updated" } : { status: "failed", error: updated.error };
    }
    return { status: "synced", action: "left_alone" };
  }

  if (order.status === "rejected") return { status: "synced", action: "left_alone" };

  const created = await createGhlOpportunity({
    contactId,
    pipelineId: pipeline.id,
    pipelineStageId: stage.id,
    name: order.fullName,
    monetaryValue: order.price,
    status: "open",
    source: `${PAYMENT_SOURCE_PREFIX} · ${order.paymentMethod}`,
  });
  if (!created.ok) return { status: "failed", error: created.error };
  await addContactNote(contactId, noteFor(order));
  return { status: "synced", action: "created" };
}

let lastBackfillAt = 0;
let backfillRunning = false;
const BACKFILL_THROTTLE_MS = 10 * 60 * 1000;

/** Background catch-up for orders that were submitted before payments were pushed to GHL (or
 * whose push failed): syncs every pending Mastermind order, one at a time, at most every 10
 * minutes. Fire-and-forget — the caller never waits on it. Safe to repeat (see syncMastermindOrderToGhl). */
export function backfillPendingMastermindOrders(orders: EliteCheckoutOrder[]) {
  if (backfillRunning || Date.now() - lastBackfillAt < BACKFILL_THROTTLE_MS) return;
  const pending = orders.filter((order) => order.status === "pending" && order.coachingHours === 0);
  if (pending.length === 0) return;
  backfillRunning = true;
  lastBackfillAt = Date.now();
  void (async () => {
    try {
      for (const order of pending) {
        try {
          const result = await syncMastermindOrderToGhl(order);
          if (result.status === "failed") console.error("Mastermind payment GHL backfill failed", order.email, result.error);
        } catch (error) {
          console.error("Mastermind payment GHL backfill error", order.email, error);
        }
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    } finally {
      backfillRunning = false;
    }
  })();
}
