import Link from "next/link";

import { ContactAvatar } from "@/components/dashboard/contact-avatar";
import { MacosWindow } from "@/components/dashboard/macos-window";
import { programs } from "@/data/programs";
import { AuthUser } from "@/lib/types";

export function PendingMemberHome({ user }: { user: AuthUser }) {
  const firstName = user.name.split(" ")[0] || "there";
  const photoUrl = user.facebookPhotoUrl;

  return (
    <div className="dashboard-widget-grid">
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
                ? "The team is reviewing your registration and payment. Stay close — verified members get the path, the programs, and Coach JDC."
                : "Put your face on the account, tell us who you are, and we start the verification clock."}
            </p>
          </div>
        </div>

        <ol className="pending-progress">
          <li className={user.profileComplete ? "is-done" : "is-current"}>
            <span>1</span>
            <strong>Profile</strong>
            <em>{user.profileComplete ? "Done. You look ready." : "Photo, story, and membership."}</em>
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
          <Link
            href="/dashboard/profile"
            className={user.profileComplete ? "macos-btn macos-btn-secondary" : "macos-btn macos-btn-primary"}
          >
            {user.profileComplete ? "See my profile" : "Complete my profile"}
          </Link>
          <Link href="/dashboard/university" className="macos-btn macos-btn-secondary">
            Peek at University
          </Link>
          <Link href="/contact" className="macos-btn macos-btn-secondary">
            Message Coach JDC
          </Link>
        </div>
      </MacosWindow>

      {programs.slice(0, 3).map((program) => (
        <article key={program.slug} className="dashboard-metric-card is-locked">
          <p className="macos-kicker">Unlocks when active</p>
          <p className="dashboard-metric-title">{program.title}</p>
          <p className="dashboard-metric-copy">{program.shortDescription}</p>
        </article>
      ))}
    </div>
  );
}
