"use server";

import { revalidatePath } from "next/cache";

import { hasAccess } from "@/lib/access";
import { setPipelineStage } from "@/lib/crm-store";
import { isPipelineStageId } from "@/lib/pipeline";
import { requireCapability } from "@/lib/session";

export type PipelineMoveState = {
  error?: string;
};

export async function movePipelineCard(contactId: string, stageId: string): Promise<PipelineMoveState> {
  const { user, access } = await requireCapability("contacts.all");
  if (!hasAccess(access, "contacts.tags") && user.role !== "admin") {
    return { error: "You cannot move pipeline cards." };
  }
  if (!isPipelineStageId(stageId)) {
    return { error: "Unknown pipeline stage." };
  }

  const viewer = { ...user, seeAllContacts: true };
  const result = await setPipelineStage(viewer, contactId, stageId);
  revalidatePath("/dashboard/pipeline");
  revalidatePath("/dashboard/contacts");
  if (!result.ok) {
    return { error: result.error };
  }
  return {};
}
