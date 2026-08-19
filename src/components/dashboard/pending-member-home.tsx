import Link from "next/link";

import { ContactAvatar } from "@/components/dashboard/contact-avatar";
import { MacosWindow } from "@/components/dashboard/macos-window";
import { AuthUser } from "@/lib/types";

export function PendingMemberHome({
  user,
  compact = false,
}: {
  user: AuthUser;
  compact?: boolean;
}) {
  const firstName = user.name.split(" ")[0] || "there";
  const photoUrl = user.facebookPhotoUrl;

  return (
    <div className={compact ? "account-dash-pending" : "dashboard-widget-grid"}>
      <MacosWindow title={user.profileComplete ? "Your seat is reserved" : "You're in"} className="dashboard-span-2">
        <div className="pending-hero">
          <ContactAvatar name={user.name} photoUrl={photoUrl} size="xl" />
          <div>
            <p className="macos-kicker">{user.profileComplete ? "Almost live" : "Next up"}</p>
            <h2>
              {user.profileComplete
                ? `${firstName}, your room is being unlocked.`
                : `${firstName}, finish your profile and the wait gets fun.`}
            </h2>
            <p>
              {user.profileComplete
                ? "The team is reviewing your registration and payment. You can still edit your account below anytime."
                : "Put your face on the account, tell us who you are, and we start the verification clock."}
            </p>
          </div>
        </div>

        <ol className="pending-progress">
          <li className={user.profileComplete ? "is-done" : "is-current"}>
            <span>1</span>
            <strong>Profile</strong>
            <em>{user.profileComplete ? "Saved. Keep it current." : "Photo, story, and membership."}</em>
          </li>
          <li className={user.paymentVerified ? "is-done" : user.profileComplete ? "is-current" : ""}>
            <span>2</span>
            <strong>Team review</strong>
            <em>{user.paymentVerified ? "Payment confirmed." : "Registration and payment check."}</em>
          </li>
          <li className={user.accountStatus === "verified" ? "is-done" : ""}>
            <span>3</span>
            <strong>Active</strong>
            <em>Your full member workspace opens.</em>
          </li>
        </ol>

        <div className="macos-actions">
          <a href="#account-editor" className="macos-btn macos-btn-primary">
            {user.profileComplete ? "Edit my account" : "Complete my account"}
          </a>
          <Link href="/dashboard/university" className="macos-btn macos-btn-secondary">
            Peek at University
          </Link>
          <Link href="/contact" className="macos-btn macos-btn-secondary">
            Message Coach JDC
          </Link>
        </div>
      </MacosWindow>
    </div>
  );
}
