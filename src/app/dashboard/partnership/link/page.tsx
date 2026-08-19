import { AffiliateQrCard } from "@/components/dashboard/affiliate-qr-card";
import { CopyLinkButton } from "@/components/dashboard/copy-link-button";
import { MacosWindow } from "@/components/dashboard/macos-window";
import { getProfile, brandedUrl, listCampaigns } from "@/lib/affiliate-store";
import { getResolvedBrandingSettings } from "@/lib/branding-store";
import { requireAffiliateAccess } from "@/lib/session";

export default async function PartnershipLinkPage() {
  const user = await requireAffiliateAccess();
  const profile = await getProfile(user.id);
  const branding = await getResolvedBrandingSettings();
  const campaigns = await listCampaigns(true);

  if (!profile) {
    return <p className="macos-lead">Your partner profile is still being created. Refresh in a moment.</p>;
  }

  const url = brandedUrl(profile.code);

  return (
    <div className="dashboard-widget-grid">
      <MacosWindow title="Branded affiliate link" className="dashboard-span-2">
        <p className="macos-lead" style={{ textAlign: "left" }}>
          Share this link. It stamps a 30-day cookie, tracks the click, and sends people to register unless a campaign
          says otherwise.
        </p>
        <p className="mt-4 break-all font-semibold">{url}</p>
        <div className="macos-actions mt-4">
          <CopyLinkButton value={url} />
        </div>
      </MacosWindow>

      <MacosWindow title="QR code">
        <AffiliateQrCard url={url} label={`${branding.logoAlt || "JDC"} ${profile.code}`} />
      </MacosWindow>

      <MacosWindow title="Campaign links" className="dashboard-span-2" bodyClassName="dashboard-contact-list">
        {campaigns.map((campaign) => {
          const campaignUrl = brandedUrl(profile.code, campaign.slug);
          return (
            <div key={campaign.id} className="dashboard-contact-row !cursor-default">
              <span>
                <strong>{campaign.title}</strong>
                <em className="break-all">{campaignUrl}</em>
              </span>
              <CopyLinkButton value={campaignUrl} label="Copy" />
            </div>
          );
        })}
      </MacosWindow>
    </div>
  );
}
