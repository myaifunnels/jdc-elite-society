import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { MacosWindow } from "@/components/dashboard/macos-window";
import { VerifyPaymentButton } from "@/components/dashboard/verify-payment-button";
import { listMemberRegistrations } from "@/lib/auth-store";
import { membershipLabel } from "@/lib/membership";
import { requireRoles } from "@/lib/session";

export default async function RegistrationsPage() {
  await requireRoles(["admin"]);
  const members = await listMemberRegistrations();

  return (
    <DashboardShell
      title="Registrations"
      description="Verify registration and payment after the member completes their account profile."
    >
      <MacosWindow title="Member registrations" bodyClassName="dashboard-contact-list">
        {members.length === 0 ? (
          <p className="macos-lead" style={{ textAlign: "left" }}>
            No member registrations yet.
          </p>
        ) : (
          members.map((member) => (
            <article key={member.id} className="registration-row">
              <div>
                <strong>{member.name}</strong>
                <em>
                  {member.email} · {member.phone} · {member.company || "No company"}
                </em>
                <p>
                  Profile {member.profileComplete ? "complete" : "incomplete"} · Payment{" "}
                  {member.paymentVerified ? "verified" : "pending"} · {membershipLabel(member.memberships)} ·{" "}
                  {member.accountStatus}
                </p>
              </div>
              {member.paymentVerified ? (
                <span className="status-pill is-verified">Verified payment</span>
              ) : (
                <VerifyPaymentButton userId={member.id} />
              )}
            </article>
          ))
        )}
      </MacosWindow>
    </DashboardShell>
  );
}
