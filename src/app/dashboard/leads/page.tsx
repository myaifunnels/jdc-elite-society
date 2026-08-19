import { redirect } from "next/navigation";

import { requireCapability } from "@/lib/session";

export default async function LeadsRedirectPage() {
  await requireCapability("contacts.view");
  redirect("/dashboard/contacts");
}
