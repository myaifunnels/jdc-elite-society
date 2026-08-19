export const membershipOptions = ["spartan", "jes"] as const;

export type Membership = (typeof membershipOptions)[number];

export type MembershipTheme = "jes" | "spartan" | "both";

export function parseMemberships(value: unknown): Membership[] {
  const raw = Array.isArray(value)
    ? value
    : String(value ?? "")
        .split(",")
        .map((item) => item.trim());

  return [...new Set(raw.filter((item): item is Membership => item === "spartan" || item === "jes"))];
}

export function serializeMemberships(memberships: Membership[]) {
  return parseMemberships(memberships).join(",");
}

export function membershipTheme(memberships: Membership[] | undefined): MembershipTheme | "" {
  const values = parseMemberships(memberships ?? []);
  const jes = values.includes("jes");
  const spartan = values.includes("spartan");

  if (jes && spartan) {
    return "both";
  }

  if (spartan) {
    return "spartan";
  }

  if (jes) {
    return "jes";
  }

  return "";
}

export function membershipLabel(memberships: Membership[] | undefined) {
  const values = parseMemberships(memberships ?? []);
  const labels = [
    values.includes("spartan") ? "Spartans" : "",
    values.includes("jes") ? "JES Member" : "",
  ].filter(Boolean);

  return labels.join(" · ") || "Member";
}
