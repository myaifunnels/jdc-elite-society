import { leadSeed } from "@/data/crm";
import { LeadRecord } from "@/lib/types";

const records = [...leadSeed];

export function listLeads(role: "admin" | "partner" | "member") {
  if (role === "admin") {
    return records;
  }

  if (role === "partner") {
    return records.filter((lead) => lead.assignedPartner === "Rico Dela Pena");
  }

  return [];
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
    ...payload,
  };

  records.unshift(lead);
  return lead;
}
