import { redirect } from "next/navigation";

import { requireRoles } from "@/lib/session";

export default async function PartnersRedirectPage() {
  await requireRoles(["admin"]);
  redirect("/dashboard/contacts?kind=partner");
}
