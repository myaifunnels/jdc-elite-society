import { ApproveAllRegistrationsForm } from "@/components/dashboard/approve-all-registrations-form";
import { ContactAvatar } from "@/components/dashboard/contact-avatar";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { DeleteUserButton } from "@/components/dashboard/delete-user-button";
import { MacosWindow } from "@/components/dashboard/macos-window";
import { VerifyPaymentButton } from "@/components/dashboard/verify-payment-button";
import { listMemberRegistrations } from "@/lib/auth-store";
import { membershipLabel } from "@/lib/membership";
import { requireCapability } from "@/lib/session";

export default async function RegistrationsPage() {
  const { user: actor } = await requireCapability("registrations");
  const members = await listMemberRegistrations();
  const pendingCount = members.filter((member) => !member.paymentVerified).length;

  return (
    <DashboardShell
      title="Registrations"
      description="Verify registration and payment after the member completes their account profile."
    >
      <MacosWindow title="Approve all" className="dashboard-span-2">
        <ApproveAllRegistrationsForm pendingCount={pendingCount} />
      </MacosWindow>
      <MacosWindow title="Member registrations" bodyClassName="dashboard-contact-list">
        {members.length === 0 ? (
          <p className="macos-lead" style={{ textAlign: "left" }}>
            No member registrations yet.
          </p>
        ) : (
          members.map((member) => (
            <article key={member.id} className="registration-row">
              <ContactAvatar name={member.name} photoUrl={member.facebookPhotoUrl} size="lg" />
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
              {actor.role === "admin" && member.id !== actor.id ? (
                <DeleteUserButton userId={member.id} name={member.name} />
              ) : null}
            </article>
          ))
        )}
      </MacosWindow>
    </DashboardShell>
  );
}
