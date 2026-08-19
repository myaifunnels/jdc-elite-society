import Link from "next/link";

import { CompleteProfileForm } from "@/components/auth/complete-profile-form";
import { ContactAvatar } from "@/components/dashboard/contact-avatar";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { MacosWindow } from "@/components/dashboard/macos-window";
import { membershipLabel } from "@/lib/membership";
import { requireCapability } from "@/lib/session";

export default async function AccountProfilePage() {
  const user = (await requireCapability("profile")).user;

  return (
    <DashboardShell
      title={user.profileComplete ? "Your profile" : "Make it yours"}
      description={
        user.profileComplete
          ? "This is the card the team sees while they turn your account on."
          : "Add your photo and story. That’s how you get from pending to active."
      }
    >
      <MacosWindow title={user.profileComplete ? "Waiting on activation" : "Complete your profile"}>
        {user.profileComplete ? (
          <div className="pending-hero">
            <ContactAvatar name={user.name} photoUrl={user.facebookPhotoUrl} size="xl" />
            <div className="grid gap-4">
              <p className="macos-lead" style={{ textAlign: "left" }}>
                You&apos;re in the queue, {user.name.split(" ")[0]}. Keep this tab close — once
                payment and registration are verified, your full member room opens.
              </p>
              <dl className="registration-meta">
                <div>
                  <dt>Name</dt>
                  <dd>{user.name}</dd>
                </div>
                <div>
                  <dt>Membership</dt>
                  <dd>{membershipLabel(user.memberships)}</dd>
                </div>
                <div>
                  <dt>Company</dt>
                  <dd>{user.company}</dd>
                </div>
                <div>
                  <dt>Who you are</dt>
                  <dd>{user.bestDescribesYou || "—"}</dd>
                </div>
                <div>
                  <dt>Phone</dt>
                  <dd>{user.phone}</dd>
                </div>
                <div>
                  <dt>Email</dt>
                  <dd>{user.email}</dd>
                </div>
                <div>
                  <dt>Address</dt>
                  <dd>{user.address || "—"}</dd>
                </div>
              </dl>
              <Link href="/dashboard" className="macos-btn macos-btn-primary self-start">
                Back to the wait room
              </Link>
            </div>
          </div>
        ) : (
          <CompleteProfileForm />
        )}
      </MacosWindow>
    </DashboardShell>
  );
}
