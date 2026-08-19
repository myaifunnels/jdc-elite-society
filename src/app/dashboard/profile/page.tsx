import Link from "next/link";

import { CompleteProfileForm } from "@/components/auth/complete-profile-form";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { MacosWindow } from "@/components/dashboard/macos-window";
import { requireRoles } from "@/lib/session";

export default async function AccountProfilePage() {
  const user = await requireRoles(["member"]);

  return (
    <DashboardShell
      title="Account profile"
      description="Complete your profile so our team can verify your registration and payment."
    >
      <MacosWindow title={user.profileComplete ? "Profile saved" : "Complete your profile"}>
        {user.profileComplete ? (
          <div className="grid gap-4">
            <p className="macos-lead" style={{ textAlign: "left" }}>
              Your profile is complete. Your account stays pending until our team verifies your
              registration and payment.
            </p>
            <dl className="registration-meta">
              <div>
                <dt>Name</dt>
                <dd>{user.name}</dd>
              </div>
              <div>
                <dt>Email</dt>
                <dd>{user.email}</dd>
              </div>
              <div>
                <dt>Phone</dt>
                <dd>{user.phone}</dd>
              </div>
              <div>
                <dt>Company</dt>
                <dd>{user.company}</dd>
              </div>
              <div>
                <dt>Address</dt>
                <dd>{user.address || "—"}</dd>
              </div>
            </dl>
            <Link href="/dashboard" className="macos-btn macos-btn-secondary self-start">
              Back to dashboard
            </Link>
          </div>
        ) : (
          <CompleteProfileForm />
        )}
      </MacosWindow>
    </DashboardShell>
  );
}
