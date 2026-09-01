import { AffiliateQrCard } from "@/components/dashboard/affiliate-qr-card";
import { CopyLinkButton } from "@/components/dashboard/copy-link-button";
import { MacosWindow } from "@/components/dashboard/macos-window";
import { campaignsForPrograms } from "@/lib/affiliate";
import { brandedUrl, getProfile } from "@/lib/affiliate-store";
import { getResolvedBrandingSettings } from "@/lib/branding-store";
import { requireAffiliateAccess } from "@/lib/session";

export default async function PartnershipLinkPage() {
  const user = await requireAffiliateAccess();
  const profile = await getProfile(user.id);
  const branding = await getResolvedBrandingSettings();
  const campaigns = campaignsForPrograms(profile?.programs ?? user.affiliatePrograms, user.role === "admin");

  if (!profile) {
    return <p className="macos-lead">Your partner profile is still being created. Refresh in a moment.</p>;
  }

  if (campaigns.length === 0) {
    return (
      <p className="macos-lead">
        No campaign is assigned yet. Admin must tag you as pioneer and/or jdc-partner.
      </p>
    );
  }

  return (
    <div className="dashboard-widget-grid">
      <MacosWindow title="Your campaigns" className="dashboard-span-2">
        <p className="macos-lead" style={{ textAlign: "left" }}>
          Each campaign has its own affiliate link and QR code. Pioneer promotes the Foundation Course. Coaches tagged
          jdc-partner also get Mastermind Sessions 1 and 2 at an additional 20%.
        </p>
      </MacosWindow>
      {campaigns.map((campaign) => {
        const url = brandedUrl(profile.code, campaign.slug);
        return (
          <MacosWindow key={campaign.slug} title={campaign.shortTitle} className="dashboard-span-2">
            <p className="macos-kicker">{campaign.requiredProgram === "pioneer" ? "Pioneer" : "jdc-partner"} · 20%</p>
            <p className="macos-lead" style={{ textAlign: "left" }}>
              {campaign.description}
            </p>
            <p className="mt-4 break-all font-semibold">{url}</p>
            <div className="macos-actions mt-4">
              <CopyLinkButton value={url} />
            </div>
            <div className="mt-5">
              <AffiliateQrCard url={url} label={`${branding.logoAlt || "JDC"} ${campaign.slug} ${profile.code}`} />
            </div>
          </MacosWindow>
        );
      })}
    </div>
  );
}
