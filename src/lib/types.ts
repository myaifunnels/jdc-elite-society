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
export type AccountStatus = "pending" | "verified";

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: DashboardRole;
  memberships: Membership[];
  affiliateAccess: boolean;
  phone: string;
  phoneCountry: string;
  company: string;
  profileComplete: boolean;
  paymentVerified: boolean;
  passwordSet: boolean;
  accountStatus: AccountStatus;
  bestDescribesYou?: string;
  dateOfBirth?: string;
  address?: string;
  facebookProfileUrl?: string;
  facebookPhotoUrl?: string;
  createdAt: string;
};

export type AffiliateStatus = "invited" | "active" | "paused";
export type PayoutMethodKind = "bank" | "gcash" | "maya" | "other";
export type AffiliateSaleStatus = "pending" | "approved" | "void";
export type AffiliatePayoutStatus = "pending" | "approved" | "paid";

export type AffiliateProfile = {
  userId: string;
  code: string;
  sponsorId: string;
  status: AffiliateStatus;
  commissionRate: number;
  activatedAt: string;
};

export type AffiliatePayoutMethod = {
  userId: string;
  method: PayoutMethodKind;
  bankName: string;
  accountName: string;
  accountNumber: string;
  updatedAt: string;
};

export type AffiliateSale = {
  id: string;
  affiliateUserId: string;
  grossAmount: number;
  commissionAmount: number;
  source: string;
  status: AffiliateSaleStatus;
  soldAt: string;
  periodStart: string;
  periodEnd: string;
  scheduledPayDate: string;
  payoutId: string;
  createdAt: string;
};

export type AffiliatePayout = {
  id: string;
  affiliateUserId: string;
  amount: number;
  status: AffiliatePayoutStatus;
  periodStart: string;
  periodEnd: string;
  scheduledPayDate: string;
  paidAt: string;
  reference: string;
  note: string;
  createdAt: string;
};

export type AffiliateCampaign = {
  id: string;
  slug: string;
  title: string;
  description: string;
  destinationPath: string;
  active: boolean;
};

export type AffiliateMaterial = {
  id: string;
  title: string;
  category: string;
  fileUrl: string;
  fileName: string;
  sortOrder: number;
  active: boolean;
};

export type AffiliateClick = {
  id: string;
  code: string;
  campaignSlug: string;
  path: string;
  userAgent: string;
  createdAt: string;
};

export type AffiliateAttribution = {
  id: string;
  kind: "inquiry" | "registration";
  code: string;
  email: string;
  name: string;
  userId: string;
  createdAt: string;
};

export type AffiliateTreeNode = {
  userId: string;
  name: string;
  email: string;
  code: string;
  status: AffiliateStatus;
  activatedAt: string;
  children: AffiliateTreeNode[];
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
  ghlContactId?: string;
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

export type ContactMapPin = PartnerMapPin & {
  kind: ContactKind;
  tags: string[];
};
