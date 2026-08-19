import { AffiliateQrCard } from "@/components/dashboard/affiliate-qr-card";
import { CopyLinkButton } from "@/components/dashboard/copy-link-button";
import { MacosWindow } from "@/components/dashboard/macos-window";
import { campaignsForPrograms } from "@/lib/affiliate";
import { brandedUrl, getProfile } from "@/lib/affiliate-store";
import { requireAffiliateAccess } from "@/lib/session";

export default async function PartnershipCampaignsPage() {
  const user = await requireAffiliateAccess();
  const profile = await getProfile(user.id);
  const campaigns = campaignsForPrograms(profile?.programs ?? user.affiliatePrograms, user.role === "admin");

  return (
    <div className="dashboard-widget-grid">
      <MacosWindow title="Your campaigns" className="dashboard-span-2">
        <p className="macos-lead" style={{ textAlign: "left" }}>
          Each campaign has its own affiliate link and QR code. Pioneer promotes the Foundation Course. Coaches tagged
          jdc-partner also get Mastermind Sessions 1 and 2 at an additional 20%.
        </p>
      </MacosWindow>
      {campaigns.map((campaign) => {
        const url = profile ? brandedUrl(profile.code, campaign.slug) : "";
        return (
          <MacosWindow key={campaign.slug} title={campaign.shortTitle} className="dashboard-span-2">
            <p className="macos-kicker">{campaign.requiredProgram === "pioneer" ? "Pioneer" : "jdc-partner"} · 20%</p>
            <p className="macos-lead" style={{ textAlign: "left" }}>
              {campaign.title}
            </p>
            <p className="mt-3 text-sm text-[var(--muted)]">{campaign.description}</p>
            {url ? (
              <>
                <p className="mt-3 break-all text-sm font-semibold">{url}</p>
                <div className="macos-actions mt-3">
                  <CopyLinkButton value={url} />
                </div>
                <div className="mt-4">
                  <AffiliateQrCard url={url} label={`${campaign.slug}-${profile?.code ?? "link"}`} />
                </div>
              </>
            ) : null}
          </MacosWindow>
        );
      })}
    </div>
  );
}
