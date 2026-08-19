import { contactSeed } from "@/data/crm";
import { ContactKind, ContactRecord, DashboardRole, PartnerMapPin } from "@/lib/types";

const records: ContactRecord[] = [...contactSeed];
const SESSION_PARTNER_NAME = "Rico Dela Pena";

function visibleToRole(role: DashboardRole) {
  if (role === "admin") {
    return records;
  }

  if (role === "partner") {
    return records.filter(
      (contact) =>
        contact.name === SESSION_PARTNER_NAME || contact.assignedPartner === SESSION_PARTNER_NAME,
    );
  }

  return [];
}

export function listContacts(role: DashboardRole, kind?: ContactKind) {
  const visible = visibleToRole(role);
  return kind ? visible.filter((contact) => contact.kind === kind) : visible;
}

export function listLeads(role: DashboardRole) {
  return listContacts(role, "contact");
}

export function getContact(role: DashboardRole, id: string) {
  return visibleToRole(role).find((contact) => contact.id === id) ?? null;
}

export function listAssignedContacts(role: DashboardRole, partnerName: string) {
  return listContacts(role, "contact").filter((contact) => contact.assignedPartner === partnerName);
}

export function listPartnerMapPins(role: DashboardRole): PartnerMapPin[] {
  return listContacts(role, "partner")
    .filter((partner): partner is ContactRecord & { lat: number; lng: number } => {
      return typeof partner.lat === "number" && typeof partner.lng === "number";
    })
    .map((partner) => ({
      id: partner.id,
      name: partner.name,
      region: partner.region ?? partner.city,
      address: partner.address,
      photoUrl: partner.photoUrl,
      lat: partner.lat,
      lng: partner.lng,
    }));
}

export function createLead(
  payload: Omit<ContactRecord, "id" | "createdAt" | "status" | "source" | "kind"> & {
    source?: string;
  },
) {
  const lead: ContactRecord = {
    id: `contact-${records.length + 1001}`,
    kind: "contact",
    createdAt: new Date().toISOString().slice(0, 10),
    status: "new",
    source: payload.source ?? "Website form",
    ...payload,
  };

  records.unshift(lead);
  return lead;
}
