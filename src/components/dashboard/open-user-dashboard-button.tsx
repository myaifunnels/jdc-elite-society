import { openUserDashboard } from "@/app/dashboard/contacts/impersonate-actions";

export function OpenUserDashboardButton({
  userId = "",
  email = "",
  name = "",
  phone = "",
  label = "Dashboard",
}: {
  userId?: string;
  email?: string;
  name?: string;
  phone?: string;
  label?: string;
}) {
  return (
    <form action={openUserDashboard}>
      <input type="hidden" name="userId" value={userId} />
      <input type="hidden" name="email" value={email} />
      <input type="hidden" name="name" value={name} />
      <input type="hidden" name="phone" value={phone} />
      <button type="submit" className="macos-btn macos-btn-primary">
        {label}
      </button>
    </form>
  );
}
