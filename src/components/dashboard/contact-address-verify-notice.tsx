import Link from "next/link";

import { MacosWindow } from "@/components/dashboard/macos-window";

export function ContactAddressVerifyNotice({
  address,
  onAccountPage = false,
}: {
  address?: string;
  onAccountPage?: boolean;
}) {
  return (
    <MacosWindow title="Verify your account" className="dashboard-span-2">
      <p className="macos-lead" style={{ textAlign: "left" }}>
        The map pin on your contact record is a temporary address. Change it to your real home or OFW address so the
        team can verify your account.
      </p>
      {address ? (
        <p className="dashboard-metric-copy">Current map address: {address}</p>
      ) : (
        <p className="dashboard-metric-copy">No address is saved yet. Add the one you actually live at.</p>
      )}
      <div className="macos-actions">
        {onAccountPage ? (
          <a href="#account-editor" className="macos-btn macos-btn-primary">
            Update my address
          </a>
        ) : (
          <Link href="/dashboard/profile" className="macos-btn macos-btn-primary">
            Open Account and change address
          </Link>
        )}
      </div>
    </MacosWindow>
  );
}
