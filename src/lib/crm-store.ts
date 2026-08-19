import { contactSeed } from "@/data/crm";
import { AuthUser, ContactKind, ContactRecord, DashboardMetric, PartnerMapPin } from "@/lib/types";

const records: ContactRecord[] = [...contactSeed];

export type CrmViewer = Pick<AuthUser, "role" | "name" | "email">;

function isOwnPartnerRecord(contact: ContactRecord, viewer: CrmViewer) {
  return (
    contact.kind === "partner" &&
    (contact.email.toLowerCase() === viewer.email.toLowerCase() || contact.name === viewer.name)
  );
}

function isAssignedToViewer(contact: ContactRecord, viewer: CrmViewer) {
  return contact.kind === "contact" && contact.assignedPartner === viewer.name;
}

function visibleToViewer(viewer: CrmViewer) {
  if (viewer.role === "admin") {
    return records;
  }

  if (viewer.role === "partner") {
    return records.filter((contact) => isOwnPartnerRecord(contact, viewer) || isAssignedToViewer(contact, viewer));
  }

  return [];
}

export function listContacts(viewer: CrmViewer, kind?: ContactKind) {
  const visible = visibleToViewer(viewer);
  return kind ? visible.filter((contact) => contact.kind === kind) : visible;
}

export function listLeads(viewer: CrmViewer) {
  return listContacts(viewer, "contact");
}

export function getContact(viewer: CrmViewer, id: string) {
  return visibleToViewer(viewer).find((contact) => contact.id === id) ?? null;
}

export function listAssignedContacts(viewer: CrmViewer, partnerName: string) {
  if (viewer.role !== "admin" && partnerName !== viewer.name) {
    return [];
  }

  return listContacts(viewer, "contact").filter((contact) => contact.assignedPartner === partnerName);
}

export function listPartnerMapPins(viewer: CrmViewer): PartnerMapPin[] {
  return listContacts(viewer, "partner")
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

export function listViewerMetrics(viewer: CrmViewer): DashboardMetric[] {
  const contacts = listContacts(viewer, "contact");
  const followUp = contacts.filter((contact) => contact.status === "follow-up" || contact.status === "qualified");
  const won = contacts.filter((contact) => contact.status === "won");

  return [
    {
      label: "Assigned contacts",
      value: String(contacts.length),
      detail: "People currently on your desk",
    },
    {
      label: "Need follow-up",
      value: String(followUp.length),
      detail: "Qualified or waiting on the next conversation",
    },
    {
      label: "Won",
      value: String(won.length),
      detail: "Closed from your assigned list",
    },
  ];
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
