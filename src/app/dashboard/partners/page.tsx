import { redirect } from "next/navigation";

import { requireCapability } from "@/lib/session";

export default async function PartnersRedirectPage() {
  await requireCapability("contacts.view");
  redirect("/dashboard/contacts?kind=partner");
}
