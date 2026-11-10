import { stopImpersonation } from "@/app/dashboard/contacts/impersonate-actions";
import { AuthUser } from "@/lib/types";

export function ImpersonationBanner({
  user,
  impersonator,
}: {
  user: AuthUser;
  impersonator: AuthUser;
}) {
  return (
    <div className="impersonation-banner">
      <p>
        Viewing <strong>{user.name}</strong> as {user.role}. Signed in as admin {impersonator.name}.
      </p>
      <form action={stopImpersonation}>
        <button type="submit" className="macos-btn macos-btn-secondary">
          Back to admin
        </button>
      </form>
    </div>
  );
}
