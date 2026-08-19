import { redirect } from "next/navigation";

import { requireSessionUser } from "@/lib/session";

export default async function UniversityCourseRedirectPage() {
  await requireSessionUser();
  redirect("/dashboard/university");
}
