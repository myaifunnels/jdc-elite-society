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

export type ContactKind = "partner" | "contact";

export type ContactStatus = "new" | "qualified" | "follow-up" | "won" | "active" | "ramping";

export type ContactRecord = {
  id: string;
  kind: ContactKind;
  name: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  address: string;
  city: string;
  region?: string;
  tags: string[];
  bestDescribesYou: string;
  programInterest: string;
  status: ContactStatus;
  source: string;
  assignedPartner?: string;
  photoUrl?: string;
  lat?: number;
  lng?: number;
  activeContacts?: number;
  winRate?: string;
  createdAt: string;
};

export type LeadRecord = ContactRecord;

export type DashboardMetric = {
  label: string;
  value: string;
  detail: string;
};

export type PartnerSummary = ContactRecord;

export type PartnerMapPin = {
  id: string;
  name: string;
  region: string;
  address: string;
  photoUrl?: string;
  lat: number;
  lng: number;
};
