import { leadSeed } from "@/data/crm";
import { LeadRecord } from "@/lib/types";

const records = [...leadSeed];

export function listLeads(role: "admin" | "partner") {
  if (role === "admin") {
    return records;
  }

  return records.filter((lead) => lead.assignedPartner === "Rico Dela Pena");
}

export function createLead(
  payload: Omit<LeadRecord, "id" | "createdAt" | "status" | "source"> & {
    source?: string;
  },
) {
  const lead: LeadRecord = {
    id: `lead-${records.length + 1001}`,
    createdAt: new Date().toISOString().slice(0, 10),
    status: "new",
    source: payload.source ?? "Website form",
    ghlSyncStatus: "pending",
    ...payload,
  };

  records.unshift(lead);
  return lead;
}

export function updateLeadGhlSync(
  leadId: string,
  update: Pick<LeadRecord, "ghlContactId" | "ghlSyncStatus" | "ghlSyncError">,
) {
  const lead = records.find((item) => item.id === leadId);

  if (!lead) {
    return null;
  }

  lead.ghlContactId = update.ghlContactId;
  lead.ghlSyncStatus = update.ghlSyncStatus;
  lead.ghlSyncError = update.ghlSyncError;
  return lead;
}
