import { DashboardRole } from "@/lib/types";

export type AccessRole = DashboardRole;

export type Capability =
  | "dashboard"
  | "university"
  | "profile"
  | "contacts.view"
  | "contacts.all"
  | "contacts.tags"
  | "registrations"
  | "integrations"
  | "automation"
  | "settings"
  | "access"
  | "partnership"
  | "partnership.admin";

export type AccessMap = Record<Capability, boolean>;
export type AccessOverride = Partial<Record<Capability, boolean>>;

export type AccessProfile = {
  role: AccessRole;
  defaults: AccessMap;
  overrides: AccessOverride;
  resolved: AccessMap;
};

export const CAPABILITIES: Array<{ id: Capability; label: string; detail: string }> = [
  { id: "dashboard", label: "Dashboard home", detail: "See the signed-in workspace home." },
  { id: "university", label: "University", detail: "Open the membership community embed." },
  { id: "profile", label: "Account profile", detail: "Edit their own profile and membership card." },
  { id: "contacts.view", label: "Contacts", detail: "Open the contacts workspace." },
  { id: "contacts.all", label: "All contacts", detail: "See the full roster, not only assigned people." },
  { id: "contacts.tags", label: "Edit tags", detail: "Add and remove GHL-synced tags." },
  { id: "registrations", label: "Registrants", detail: "Verify member sign-ups and payment on the Contacts registrants tab." },
  { id: "integrations", label: "Integrations", detail: "GHL, Maps, and R2 credentials." },
  { id: "automation", label: "Automation", detail: "SMS templates and the from-number used for buyer/team texts." },
  { id: "settings", label: "Site settings", detail: "Branding and design system." },
  { id: "access", label: "Access control", detail: "Change roles and permission defaults." },
  { id: "partnership", label: "Partnership", detail: "Affiliate link, tree, and payouts." },
  { id: "partnership.admin", label: "Partnership admin", detail: "Grant affiliate access and review payouts." },
];

export const ACCESS_ROLES: Array<{ id: AccessRole; label: string; detail: string }> = [
  { id: "admin", label: "Admin", detail: "Full platform. Defaults on for every room." },
  { id: "partner", label: "Partner", detail: "Assigned contacts, University, own account, and optional partnership." },
  { id: "member", label: "Member", detail: "Verified membership: University and profile." },
  { id: "contact", label: "Contact", detail: "Limited portal for CRM contacts: home, account, and University." },
];

export const ROLE_DEFAULTS: Record<AccessRole, AccessMap> = {
  admin: {
    dashboard: true,
    university: true,
    profile: true,
    "contacts.view": true,
    "contacts.all": true,
    "contacts.tags": true,
    registrations: true,
    integrations: true,
    automation: true,
    settings: true,
    access: true,
    partnership: true,
    "partnership.admin": true,
  },
  partner: {
    dashboard: true,
    university: true,
    profile: true,
    "contacts.view": true,
    "contacts.all": false,
    "contacts.tags": true,
    registrations: false,
    integrations: false,
    automation: false,
    settings: false,
    access: false,
    partnership: false,
    "partnership.admin": false,
  },
  member: {
    dashboard: true,
    university: true,
    profile: true,
    "contacts.view": false,
    "contacts.all": false,
    "contacts.tags": false,
    registrations: false,
    integrations: false,
    automation: false,
    settings: false,
    access: false,
    partnership: false,
    "partnership.admin": false,
  },
  contact: {
    dashboard: true,
    university: true,
    profile: true,
    "contacts.view": false,
    "contacts.all": false,
    "contacts.tags": false,
    registrations: false,
    integrations: false,
    automation: false,
    settings: false,
    access: false,
    partnership: false,
    "partnership.admin": false,
  },
};

export function emptyAccessMap(): AccessMap {
  return { ...ROLE_DEFAULTS.contact, dashboard: true, university: false };
}

export function parseAccessRole(value: string | undefined | null): AccessRole {
  if (value === "admin" || value === "partner" || value === "member" || value === "contact") {
    return value;
  }
  return "member";
}

export function mergeAccess(role: AccessRole, roleDefaults: AccessMap, overrides: AccessOverride): AccessProfile {
  const defaults = { ...ROLE_DEFAULTS[role], ...roleDefaults };
  const resolved = { ...defaults };
  for (const item of CAPABILITIES) {
    const override = overrides[item.id];
    if (typeof override === "boolean") {
      resolved[item.id] = override;
    }
  }
  if (role === "admin") {
    resolved.access = true;
    resolved.dashboard = true;
  }
  resolved.profile = true;
  return { role, defaults, overrides, resolved };
}

export function hasAccess(profile: AccessProfile, capability: Capability) {
  return Boolean(profile.resolved[capability]);
}

export function overrideCount(overrides: AccessOverride) {
  return CAPABILITIES.filter((item) => typeof overrides[item.id] === "boolean").length;
}
