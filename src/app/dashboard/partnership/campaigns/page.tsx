import Link from "next/link";

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
      <div className="pp-empty">
        <p>No campaign is available to you yet. Once your partner access is approved, your campaigns appear here.</p>
      </div>
    );
  }

  return (
    <ul className="pp-campaigns">
      {campaigns.map((campaign) => {
        const rule = rules.get(campaign.slug)!;
        const campaignSales = sales.filter((sale) => sale.campaignSlug === campaign.slug && sale.status !== "void");
        const earned = campaignSales.reduce((sum, sale) => sum + sale.commissionAmount, 0);
        const clickCount = clicks.filter((click) => click.campaignSlug === campaign.slug).length;
        return (
          <li key={campaign.slug} className="pp-campaign">
            <div className="pp-campaign-media" aria-hidden>
              <span>{rule.title.slice(0, 1)}</span>
            </div>
            <div className="pp-campaign-body">
              <h2 className="pp-campaign-title">{rule.title}</h2>
              <p className="pp-campaign-desc">{rule.description}</p>
              <p className="pp-chips">
                {campaignTerms(rule)
                  .split(" · ")
                  .map((term) => (
                    <span key={term} className="pp-chip">
                      {term}
                    </span>
                  ))}
              </p>
              <dl className="pp-campaign-stats">
                <div>
                  <dt>Clicks</dt>
                  <dd>{clickCount}</dd>
                </div>
                <div>
                  <dt>Sales</dt>
                  <dd>{campaignSales.length}</dd>
                </div>
                <div>
                  <dt>Earned</dt>
                  <dd>{formatPhp(earned)}</dd>
                </div>
              </dl>
            </div>
            <Link href="/dashboard/partnership/link" className="pp-btn is-primary pp-campaign-cta">
              Get link &amp; QR
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
