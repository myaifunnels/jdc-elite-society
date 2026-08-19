import { CopyLinkButton } from "@/components/dashboard/copy-link-button";
import { MacosWindow } from "@/components/dashboard/macos-window";
import { brandedUrl, getProfile, listCampaigns } from "@/lib/affiliate-store";
import { requireAffiliateAccess } from "@/lib/session";

export default async function PartnershipCampaignsPage() {
  const user = await requireAffiliateAccess();
  const profile = await getProfile(user.id);
  const campaigns = await listCampaigns(true);

  return (
    <div className="dashboard-widget-grid">
      <MacosWindow title="Campaign links" className="dashboard-span-2">
        <p className="macos-lead" style={{ textAlign: "left" }}>
          These are tagged versions of your link. They are not ad accounts, budgets, or creatives — just destinations
          with a campaign slug.
        </p>
      </MacosWindow>
      {campaigns.map((campaign) => {
        const url = profile ? brandedUrl(profile.code, campaign.slug) : "";
        return (
          <MacosWindow key={campaign.id} title={campaign.title}>
            <p className="macos-lead" style={{ textAlign: "left" }}>
              {campaign.description}
            </p>
            <p className="mt-3 text-sm text-[var(--muted)]">Lands on {campaign.destinationPath}</p>
            {url ? (
              <>
                <p className="mt-3 break-all text-sm font-semibold">{url}</p>
                <div className="macos-actions mt-3">
                  <CopyLinkButton value={url} />
                </div>
              </>
            ) : null}
          </MacosWindow>
        );
      })}
    </div>
  );
}
