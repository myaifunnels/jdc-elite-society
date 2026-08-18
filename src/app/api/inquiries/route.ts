import { NextResponse } from "next/server";

import { createLead, updateLeadGhlSync } from "@/lib/crm-store";
import { syncLeadToGhl } from "@/lib/ghl";
import { getResolvedIntegrationSettings } from "@/lib/integrations-store";
import { leadSchema } from "@/lib/validations";

export const maxDuration = 30;

export async function POST(request: Request) {
  const json = await request.json();
  const parsed = leadSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const lead = createLead({
    ...parsed.data,
    tags: parsed.data.tags
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean),
    source: "Website inquiry",
  });

  const settings = await getResolvedIntegrationSettings();
  const result = await syncLeadToGhl(lead, settings);
  const syncedLead = updateLeadGhlSync(lead.id, {
    ghlContactId: result.contactId,
    ghlSyncStatus: result.status,
    ghlSyncError: result.error,
  });

  return NextResponse.json({ lead: syncedLead ?? lead });
}
