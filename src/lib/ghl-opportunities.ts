import { ghlHeaders } from "@/lib/ghl";
import { getResolvedIntegrationSettings } from "@/lib/integrations-store";
import { tagKey } from "@/lib/pipeline";

export const MASTERMIND_BUYER_PIPELINE_KEY = "jdc-mastermind-buyer";

export type GhlPipelineStage = {
  id: string;
  name: string;
  position?: number;
};

export type GhlOpportunityPipeline = {
  id: string;
  name: string;
  stages: GhlPipelineStage[];
};

export type GhlOpportunity = {
  id: string;
  name: string;
  monetaryValue: number;
  pipelineId: string;
  pipelineStageId: string;
  status: string;
  contactId: string;
  email: string;
  phone: string;
  contactName: string;
};

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
}

function asNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  const parsed = Number(String(value ?? "").replace(/[^\d.-]/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

export function isMastermindBuyerPipeline(name: string) {
  const key = tagKey(name).replace(/_/g, "-");
  const compact = key.replace(/\s+/g, "-");
  return (
    compact === MASTERMIND_BUYER_PIPELINE_KEY ||
    compact.includes("jdc-mastermind-buyer") ||
    compact.includes("mastermind-buyer") ||
    key.includes("mastermind buyer")
  );
}

function mapOpportunity(raw: unknown): GhlOpportunity | null {
  const record = asRecord(raw);
  const contact = asRecord(record.contact);
  const id = String(record.id ?? record.opportunityId ?? "").trim();
  const contactId = String(record.contactId ?? contact.id ?? "").trim();
  if (!id) {
    return null;
  }

  return {
    id,
    name: String(record.name ?? contact.name ?? "").trim(),
    monetaryValue: asNumber(record.monetaryValue ?? record.monetary_value),
    pipelineId: String(record.pipelineId ?? record.pipeline_id ?? "").trim(),
    pipelineStageId: String(record.pipelineStageId ?? record.pipeline_stage_id ?? "").trim(),
    status: String(record.status ?? "open").trim().toLowerCase(),
    contactId,
    email: String(contact.email ?? record.email ?? "").trim(),
    phone: String(contact.phone ?? record.phone ?? "").trim(),
    contactName: String(contact.name ?? [contact.firstName, contact.lastName].filter(Boolean).join(" ")).trim(),
  };
}

export async function listGhlOpportunityPipelines() {
  const settings = await getResolvedIntegrationSettings();
  const token = settings.ghlApiKey;
  const locationId = settings.ghlLocationId;
  if (!token || !locationId) {
    return [] as GhlOpportunityPipeline[];
  }

  try {
    const response = await fetch(
      `https://services.leadconnectorhq.com/opportunities/pipelines?locationId=${encodeURIComponent(locationId)}`,
      { headers: ghlHeaders(token), cache: "no-store" },
    );
    if (!response.ok) {
      console.error("GHL pipelines list failed", response.status, await response.text());
      return [];
    }
    const payload = asRecord(await response.json());
    const list = Array.isArray(payload.pipelines) ? payload.pipelines : [];
    return list.map((item) => {
      const pipeline = asRecord(item);
      const stages = Array.isArray(pipeline.stages) ? pipeline.stages : [];
      return {
        id: String(pipeline.id ?? "").trim(),
        name: String(pipeline.name ?? "").trim(),
        stages: stages
          .map((stage) => {
            const row = asRecord(stage);
            return {
              id: String(row.id ?? "").trim(),
              name: String(row.name ?? "").trim(),
              position: asNumber(row.position),
            };
          })
          .filter((stage) => stage.id)
          .sort((left, right) => (left.position ?? 0) - (right.position ?? 0)),
      };
    }).filter((pipeline) => pipeline.id);
  } catch (error) {
    console.error("GHL pipelines list error", error);
    return [];
  }
}

export async function getMastermindBuyerPipeline() {
  const pipelines = await listGhlOpportunityPipelines();
  const compact = (name: string) => tagKey(name).replace(/_/g, "-").replace(/\s+/g, "-");
  return (
    pipelines.find((pipeline) => compact(pipeline.name) === MASTERMIND_BUYER_PIPELINE_KEY) ??
    pipelines.find((pipeline) => isMastermindBuyerPipeline(pipeline.name)) ??
    null
  );
}

export async function searchGhlOpportunities(pipelineId: string) {
  const settings = await getResolvedIntegrationSettings();
  const token = settings.ghlApiKey;
  const locationId = settings.ghlLocationId;
  if (!token || !locationId || !pipelineId) {
    return [] as GhlOpportunity[];
  }

  const opportunities: GhlOpportunity[] = [];
  const seen = new Set<string>();
  let startAfterId = "";
  let startAfter = "";

  try {
    for (let page = 1; page <= 20; page += 1) {
      const query = new URLSearchParams({
        location_id: locationId,
        pipeline_id: pipelineId,
        status: "all",
        limit: "100",
        page: String(page),
      });
      query.set("pipelineId", pipelineId);
      if (startAfterId) {
        query.set("startAfterId", startAfterId);
      }
      if (startAfter) {
        query.set("startAfter", startAfter);
      }
      const response = await fetch(`https://services.leadconnectorhq.com/opportunities/search?${query.toString()}`, {
        headers: ghlHeaders(token),
        cache: "no-store",
      });
      if (!response.ok) {
        console.error("GHL opportunity search failed", response.status, await response.text());
        break;
      }
      const payload = asRecord(await response.json());
      const list = Array.isArray(payload.opportunities) ? payload.opportunities : [];
      for (const item of list) {
        const mapped = mapOpportunity(item);
        if (!mapped || seen.has(mapped.id)) {
          continue;
        }
        seen.add(mapped.id);
        opportunities.push(mapped);
      }
      const meta = asRecord(payload.meta);
      startAfterId = String(meta.startAfterId ?? payload.startAfterId ?? "").trim();
      startAfter = String(meta.startAfter ?? payload.startAfter ?? "").trim();
      if (list.length < 100 && !startAfterId) {
        break;
      }
    }
  } catch (error) {
    console.error("GHL opportunity search error", error);
  }

  return opportunities;
}

export async function getGhlOpportunityById(opportunityId: string) {
  const settings = await getResolvedIntegrationSettings();
  const token = settings.ghlApiKey;
  if (!token || !opportunityId) {
    return null;
  }

  try {
    const response = await fetch(`https://services.leadconnectorhq.com/opportunities/${opportunityId}`, {
      headers: ghlHeaders(token),
      cache: "no-store",
    });
    if (!response.ok) {
      return null;
    }
    const payload = asRecord(await response.json());
    return mapOpportunity(payload.opportunity ?? payload);
  } catch (error) {
    console.error("GHL opportunity fetch failed", error);
    return null;
  }
}

export async function updateGhlOpportunity(
  opportunityId: string,
  patch: { pipelineStageId?: string; monetaryValue?: number; name?: string },
) {
  const settings = await getResolvedIntegrationSettings();
  const token = settings.ghlApiKey;
  if (!token || !opportunityId) {
    return { skipped: true as const, ok: false as const };
  }

  const body: Record<string, unknown> = {};
  if (patch.pipelineStageId) {
    body.pipelineStageId = patch.pipelineStageId;
  }
  if (typeof patch.monetaryValue === "number") {
    body.monetaryValue = patch.monetaryValue;
  }
  if (patch.name) {
    body.name = patch.name;
  }

  try {
    const response = await fetch(`https://services.leadconnectorhq.com/opportunities/${opportunityId}`, {
      method: "PUT",
      headers: ghlHeaders(token, true),
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      console.error("GHL opportunity update failed", response.status, await response.text());
      return { skipped: false as const, ok: false as const };
    }
    return { skipped: false as const, ok: true as const };
  } catch (error) {
    console.error("GHL opportunity update error", error);
    return { skipped: false as const, ok: false as const };
  }
}

export async function upsertGhlOpportunity(input: {
  contactId: string;
  pipelineId: string;
  pipelineStageId: string;
  name: string;
  monetaryValue: number;
}) {
  const settings = await getResolvedIntegrationSettings();
  const token = settings.ghlApiKey;
  const locationId = settings.ghlLocationId;
  if (!token || !locationId || !input.contactId) {
    return { skipped: true as const, opportunityId: undefined };
  }

  try {
    const response = await fetch("https://services.leadconnectorhq.com/opportunities/upsert", {
      method: "POST",
      headers: ghlHeaders(token, true),
      body: JSON.stringify({
        locationId,
        contactId: input.contactId,
        pipelineId: input.pipelineId,
        pipelineStageId: input.pipelineStageId,
        name: input.name,
        monetaryValue: input.monetaryValue,
        status: "open",
      }),
    });
    if (!response.ok) {
      console.error("GHL opportunity upsert failed", response.status, await response.text());
      return { skipped: false as const, ok: false as const, opportunityId: undefined };
    }
    const payload = asRecord(await response.json());
    const opportunity = asRecord(payload.opportunity);
    const opportunityId = String(opportunity.id ?? payload.id ?? "").trim();
    return { skipped: false as const, ok: true as const, opportunityId: opportunityId || undefined };
  } catch (error) {
    console.error("GHL opportunity upsert error", error);
    return { skipped: false as const, ok: false as const, opportunityId: undefined };
  }
}
