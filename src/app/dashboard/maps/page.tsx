import { redirect } from "next/navigation";

import { requireRoles } from "@/lib/session";

export default async function MapsRedirectPage() {
  await requireRoles(["admin"]);
  redirect("/dashboard");
}
