export const membershipOptions = ["jes"] as const;

export type Membership = (typeof membershipOptions)[number];

export type MembershipTheme = "jes";

export function parseMemberships(value: unknown): Membership[] {
  const raw = Array.isArray(value)
    ? value
    : String(value ?? "")
        .split(",")
        .map((item) => item.trim());

  // This is a JES-only platform. Map any legacy membership value to JES so
  // existing users retain access while obsolete membership identities disappear.
  return raw.some((item) => item.length > 0) ? ["jes"] : [];
}

export function serializeMemberships(memberships: Membership[]) {
  return parseMemberships(memberships).join(",");
}

export function membershipTheme(memberships: Membership[] | undefined): MembershipTheme | "" {
  const values = parseMemberships(memberships ?? []);
  return values.includes("jes") ? "jes" : "";
}

export function membershipLabel(memberships: Membership[] | undefined) {
  const values = parseMemberships(memberships ?? []);
  return values.includes("jes") ? "JES Member" : "Member";
}
