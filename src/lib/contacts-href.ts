export type ContactsView = "pipeline" | "roster" | "map" | "registrants";

export function parseContactsView(value?: string): ContactsView {
  if (value === "roster" || value === "map" || value === "registrants" || value === "pipeline") {
    return value;
  }
  if (value === "dashboard" || value === "list") {
    return value === "list" ? "roster" : "pipeline";
  }
  return "pipeline";
}

export function contactsHref(params: {
  view?: ContactsView;
  kind?: string;
  q?: string;
  tags?: string[];
  page?: number;
  status?: string;
}) {
  const search = new URLSearchParams();
  if (params.view && params.view !== "pipeline") {
    search.set("view", params.view);
  }
  if (params.kind) {
    search.set("kind", params.kind);
  }
  if (params.q) {
    search.set("q", params.q);
  }
  if (params.status && params.status !== "all") {
    search.set("status", params.status);
  }
  for (const tag of params.tags ?? []) {
    search.append("tag", tag);
  }
  if (params.page && params.page > 1) {
    search.set("page", String(params.page));
  }
  const query = search.toString();
  return query ? `/dashboard/contacts?${query}` : "/dashboard/contacts";
}
