import { redirect } from "next/navigation";

export default function RegistrationsPage() {
  redirect("/dashboard/contacts?view=registrants");
}
