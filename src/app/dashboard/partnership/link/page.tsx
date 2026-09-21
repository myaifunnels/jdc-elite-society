import { AffiliateQrCard } from "@/components/dashboard/affiliate-qr-card";
import { CopyLinkButton } from "@/components/dashboard/copy-link-button";
import { MacosWindow } from "@/components/dashboard/macos-window";
import { campaignTerms, campaignsForPrograms } from "@/lib/affiliate";
import { brandedUrl, getProfile, listCampaigns } from "@/lib/affiliate-store";
import { getResolvedBrandingSettings } from "@/lib/branding-store";
import { requireAffiliateAccess } from "@/lib/session";

export default async function PartnershipLinkPage() {
  const user = await requireAffiliateAccess();
  const profile = await getProfile(user.id);
  const branding = await getResolvedBrandingSettings();
  const allowed = campaignsForPrograms(profile?.programs ?? user.affiliatePrograms, user.role === "admin");
  const rules = new Map((await listCampaigns(true)).map((item) => [item.slug, item]));
  const campaigns = allowed.filter((item) => rules.has(item.slug));

  if (!profile) {
    return <p className="macos-lead">Your partner profile is still being created. Refresh in a moment.</p>;
  }

  if (campaigns.length === 0) {
    return (
      <p className="macos-lead">
        No campaign is available to you yet. Once your partner access is approved, your campaigns appear here.
      </p>
    );
  }

  return (
    <div className="dashboard-widget-grid">
      <MacosWindow title="Your campaigns" className="dashboard-span-2">
        <p className="macos-lead" style={{ textAlign: "left" }}>
          Each campaign has its own affiliate link and QR code, and its own commission terms.
        </p>
      </MacosWindow>
      {campaigns.map((campaign) => {
        const url = brandedUrl(profile.code, campaign.slug);
        return (
          <MacosWindow key={campaign.slug} title={campaign.shortTitle} className="dashboard-span-2">
            <p className="macos-kicker">{campaignTerms(rules.get(campaign.slug)!)}</p>
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
