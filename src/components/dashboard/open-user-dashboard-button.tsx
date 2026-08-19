import { openUserDashboard } from "@/app/dashboard/contacts/impersonate-actions";

export function OpenUserDashboardButton({
  userId,
  label = "Open user dashboard",
}: {
  userId: string;
  label?: string;
}) {
  return (
    <form action={openUserDashboard}>
      <input type="hidden" name="userId" value={userId} />
      <button type="submit" className="macos-btn macos-btn-primary">
        {label}
      </button>
    </form>
  );
}
