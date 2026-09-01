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
                ? `${firstName}, University is already open.`
                : `${firstName}, finish your profile when you can — University is already open.`}
            </h2>
            <p>
              {user.role === "contact"
                ? user.profileComplete
                  ? "One more step: change the temporary map address on your account to the place you actually live. That is how we verify a Contact seat."
                  : "Finish your profile, then change the temporary map address to your real home or OFW address so we can verify you."
                : user.profileComplete
                  ? "The team is still reviewing payment. University stays open unless they reject or delete the record."
                  : "University is already on. Finish your profile when you can."}
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
            University
          </Link>
          <Link href="/contact" className="macos-btn macos-btn-secondary">
            Message Coach JDC
          </Link>
        </div>
      </MacosWindow>
    </div>
  );
}
