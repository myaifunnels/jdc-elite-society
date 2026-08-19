import { Membership } from "@/lib/membership";

export type Program = {
  slug: string;
  title: string;
  shortDescription: string;
  audience: string;
  transformation: string;
  benefits: string[];
  modules: string[];
  faqs: { question: string; answer: string }[];
  ctaLabel: string;
  image: string;
  imageAlt: string;
};

export type NavItem = {
  href: string;
  label: string;
};

export type SiteStat = {
  label: string;
  value: string;
};

export type DashboardRole = "admin" | "partner" | "member";

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: DashboardRole;
  memberships: Membership[];
  bestDescribesYou?: string;
  dateOfBirth?: string;
  address?: string;
  facebookProfileUrl?: string;
  facebookPhotoUrl?: string;
  createdAt: string;
};

export type LeadRecord = {
  id: string;
  name: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  address: string;
  city: string;
  tags: string[];
  bestDescribesYou: string;
  programInterest: string;
  status: "new" | "qualified" | "follow-up" | "won";
  source: string;
  assignedPartner?: string;
  createdAt: string;
};

export type DashboardMetric = {
  label: string;
  value: string;
  detail: string;
};

export type PartnerSummary = {
  id: string;
  name: string;
  region: string;
  activeLeads: number;
  winRate: string;
  status: "active" | "ramping";
};
