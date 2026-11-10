"use server";

import { revalidatePath } from "next/cache";

import { hasAccess } from "@/lib/access";
import { setPipelineStage } from "@/lib/crm-store";
import { requireCapability } from "@/lib/session";

export type PipelineMoveState = {
  error?: string;
};

export async function movePipelineCard(cardId: string, stageId: string): Promise<PipelineMoveState> {
  const { user, access } = await requireCapability("contacts.all");
  if (!hasAccess(access, "contacts.tags") && user.role !== "admin") {
    return { error: "You cannot move pipeline cards." };
  }
  if (!cardId || !stageId) {
    return { error: "Unknown pipeline stage." };
  }

  const viewer = { ...user, seeAllContacts: true };
  const result = await setPipelineStage(viewer, cardId, stageId);
  revalidatePath("/dashboard/contacts");
  revalidatePath("/dashboard/pipeline");
  if (!result.ok) {
    return { error: result.error };
  }
  return {};
}
