import { redirect } from "next/navigation";

import { requireRoles } from "@/lib/session";

export default async function LeadsRedirectPage() {
  await requireRoles(["admin", "partner"]);
  redirect("/dashboard/contacts");
}
