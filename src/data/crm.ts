import { DashboardMetric, LeadRecord, PartnerSummary } from "@/lib/types";

export const leadSeed: LeadRecord[] = [
  {
    id: "lead-1001",
    name: "Maria Santos",
    email: "maria.santos@example.com",
    phone: "+63 917 555 0112",
    dateOfBirth: "1991-04-16",
    address: "Makati City, Metro Manila",
    city: "Makati",
    tags: ["Mindset", "Warm"],
    programInterest: "Mindset Reset",
    status: "qualified",
    source: "Homepage CTA",
    assignedPartner: "Rico Dela Pena",
    createdAt: "2026-08-17",
  },
  {
    id: "lead-1002",
    name: "John Villanueva",
    email: "john.v@example.com",
    phone: "+63 915 123 8891",
    dateOfBirth: "1988-10-03",
    address: "Doha, Qatar",
    city: "Doha",
    tags: ["OFW", "Retirement"],
    programInterest: "OFW Retirement Blueprint",
    status: "follow-up",
    source: "Program page",
    assignedPartner: "Anna Garcia",
    createdAt: "2026-08-15",
  },
  {
    id: "lead-1003",
    name: "Paolo Reyes",
    email: "paolo.reyes@example.com",
    phone: "+63 998 201 4411",
    dateOfBirth: "1995-02-11",
    address: "Cebu City, Cebu",
    city: "Cebu City",
    tags: ["Business", "New"],
    programInterest: "Business Kickstart",
    status: "new",
    source: "Contact form",
    assignedPartner: "Rico Dela Pena",
    createdAt: "2026-08-18",
  },
];

export const dashboardMetrics: DashboardMetric[] = [
  { label: "New leads this week", value: "28", detail: "Across all public forms and CTA flows" },
  { label: "Qualified leads", value: "14", detail: "Ready for follow-up or partner assignment" },
  { label: "Partner conversion", value: "31%", detail: "Average close rate across active partner channels" },
];

export const partnerSummary: PartnerSummary[] = [
  {
    id: "partner-1",
    name: "Rico Dela Pena",
    region: "Metro Manila",
    activeLeads: 12,
    winRate: "34%",
    status: "active",
  },
  {
    id: "partner-2",
    name: "Anna Garcia",
    region: "Middle East",
    activeLeads: 8,
    winRate: "29%",
    status: "active",
  },
  {
    id: "partner-3",
    name: "Mika Ramos",
    region: "Visayas",
    activeLeads: 5,
    winRate: "18%",
    status: "ramping",
  },
];
