import { redirect } from "next/navigation";

export default function LeadsRedirectPage() {
  redirect("/dashboard/contacts?kind=contact");
}
