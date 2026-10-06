import { redirect } from "next/navigation";

// Public registration is closed; accounts are created through the program and webinar flows.
export default function RegisterPage() {
  redirect("/login");
}
