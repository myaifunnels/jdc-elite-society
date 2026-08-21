import { AccountProfileDashboard } from "@/components/dashboard/account-profile-dashboard";
import { ContactAddressVerifyNotice } from "@/components/dashboard/contact-address-verify-notice";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { hasAccess } from "@/lib/access";
import { requireSessionUser } from "@/lib/session";
import { resolveAccess } from "@/lib/access-store";
import { contactNeedsAddressConfirm, getContactByEmail } from "@/lib/crm-store";

export default async function AccountProfilePage() {
  const user = await requireSessionUser();
  const access = await resolveAccess(user);
  const crmContact = user.role === "contact" ? await getContactByEmail(user.email) : null;
  const needsAddressConfirm = user.role === "contact" && contactNeedsAddressConfirm(crmContact);

  return (
    <DashboardShell
      title="Account"
      description={
        needsAddressConfirm
          ? "Replace the temporary map address with your real location so we can verify your Contact account."
          : "Edit your photo, details, membership, and password. Email stays on this login."
      }
    >
      {needsAddressConfirm ? (
        <div className="account-dash-stack">
          <ContactAddressVerifyNotice address={crmContact?.address || user.address} onAccountPage />
          <AccountProfileDashboard
            user={user}
            showWorkspaceLinks
            showPath={hasAccess(access, "path")}
            needsAddressConfirm={needsAddressConfirm}
            mapAddress={crmContact?.address}
          />
        </div>
      ) : (
        <AccountProfileDashboard
          user={user}
          showWorkspaceLinks
          showPath={hasAccess(access, "path")}
        />
      )}
    </DashboardShell>
  );
}
