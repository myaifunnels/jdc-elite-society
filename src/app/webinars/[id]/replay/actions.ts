"use server";

import { revalidatePath } from "next/cache";

import { requireSessionUser } from "@/lib/session";
import { createComment } from "@/lib/webinar-comments-store";

export type CommentFormState = { error?: string; success?: string };

export async function postWebinarCommentAction(
  webinarId: string,
  _prevState: CommentFormState,
  formData: FormData,
): Promise<CommentFormState> {
  const user = await requireSessionUser();
  const body = String(formData.get("body") ?? "").trim();

  if (!body) {
    return { error: "Write something before posting." };
  }
  if (body.length > 2000) {
    return { error: "Keep comments under 2000 characters." };
  }

  await createComment({
    webinarId,
    userId: user.id,
    name: user.name,
    photoUrl: user.facebookPhotoUrl,
    body,
  });

  revalidatePath(`/webinars/${webinarId}/replay`);
  return { success: "Posted." };
}
