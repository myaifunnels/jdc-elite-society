import { redirect } from "next/navigation";

import { requireCapability } from "@/lib/session";

export default async function MapsRedirectPage() {
  await requireCapability("contacts.view");
  redirect("/dashboard");
}
