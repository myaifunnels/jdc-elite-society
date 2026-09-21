import Link from "next/link";

import { MacosWindow } from "@/components/dashboard/macos-window";
import { campaignTerms, campaignsForPrograms } from "@/lib/affiliate";
import { getProfile, listCampaigns, listClicks, listSales } from "@/lib/affiliate-store";
import { formatPhp } from "@/lib/pay-cycle";
import { requireAffiliateAccess } from "@/lib/session";

export default async function PartnershipCampaignsPage() {
  const user = await requireAffiliateAccess();
  const profile = await getProfile(user.id);
  const allowed = campaignsForPrograms(profile?.programs ?? user.affiliatePrograms, user.role === "admin");
  const rules = new Map((await listCampaigns(true)).map((item) => [item.slug, item]));
  const campaigns = allowed.filter((item) => rules.has(item.slug));
  const [clicks, sales] = await Promise.all([profile ? listClicks(profile.code) : [], listSales(user.id)]);

  if (campaigns.length === 0) {
    return (
      <p className="macos-lead">
        No campaign is available to you yet. Once your partner access is approved, your campaigns appear here.
      </p>
    );
  }

  return (
    <div className="dashboard-widget-grid">
      {campaigns.map((campaign) => {
        const rule = rules.get(campaign.slug)!;
        const campaignSales = sales.filter((sale) => sale.campaignSlug === campaign.slug && sale.status !== "void");
        const earned = campaignSales.reduce((sum, sale) => sum + sale.commissionAmount, 0);
        const clickCount = clicks.filter((click) => click.campaignSlug === campaign.slug).length;
        return (
          <MacosWindow key={campaign.slug} title={rule.title}>
            <p className="macos-kicker">{campaignTerms(rule)}</p>
            <p className="macos-lead" style={{ textAlign: "left" }}>
              {rule.description}
            </p>
            <dl className="mt-4 grid grid-cols-3 gap-3 text-sm">
              <div>
                <dt className="text-[var(--muted)]">Clicks</dt>
                <dd className="m-0 text-lg font-semibold">{clickCount}</dd>
              </div>
              <div>
                <dt className="text-[var(--muted)]">Sales</dt>
                <dd className="m-0 text-lg font-semibold">{campaignSales.length}</dd>
              </div>
              <div>
                <dt className="text-[var(--muted)]">Earned</dt>
                <dd className="m-0 text-lg font-semibold">{formatPhp(earned)}</dd>
              </div>
            </dl>
            <div className="macos-actions mt-4">
              <Link href="/dashboard/partnership/link" className="macos-btn macos-btn-primary">
                Get link &amp; QR
              </Link>
            </div>
          </MacosWindow>
        );
      })}
    </div>
  );
}
