import Link from "next/link";

import { MacosWindow } from "@/components/dashboard/macos-window";
import { campaignsForPrograms, programLabel } from "@/lib/affiliate";
import { affiliateDashboardStats } from "@/lib/affiliate-store";
import { PAYOUT_COPY, formatManilaDate, formatPhp } from "@/lib/pay-cycle";
import { requireAffiliateAccess } from "@/lib/session";
import { cn } from "@/lib/utils";

type PartnershipTab = "overview" | "activity";

function parsePartnershipTab(value?: string): PartnershipTab {
  return value === "activity" ? "activity" : "overview";
}

export default async function PartnershipHomePage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const user = await requireAffiliateAccess();
  const tab = parsePartnershipTab((await searchParams).tab);
  const stats = await affiliateDashboardStats(user.id);
  const campaigns = campaignsForPrograms(stats.profile?.programs ?? user.affiliatePrograms, user.role === "admin");
  const labels = (stats.profile?.programs ?? user.affiliatePrograms).map(programLabel).join(" · ") || "Admin";

  return (
    <>
      <div className="macos-toolbar" style={{ padding: "0 0 0.9rem" }}>
        <div className="macos-segment" style={{ gridTemplateColumns: "1fr 1fr", width: "min(20rem, 100%)" }}>
          <Link href="/dashboard/partnership" className={cn(tab === "overview" && "is-active")}>
            Overview
          </Link>
          <Link href="/dashboard/partnership?tab=activity" className={cn(tab === "activity" && "is-active")}>
            Activity
          </Link>
        </div>
      </div>

      <div className="dashboard-widget-grid">
        {tab === "overview" ? (
          <>
            <section className="pp-hero dashboard-span-2" aria-label="Earnings this cycle">
              <p className="pp-eyebrow">This cycle · due {formatManilaDate(stats.payday)}</p>
              <p className="pp-hero-value">{formatPhp(stats.thisCycle)}</p>
              <p className="pp-hero-copy">
                Approved and unpaid. Then {formatPhp(stats.nextCycle)} on {formatManilaDate(stats.followingPayday)}.
              </p>
              <div className="pp-hero-actions">
                <Link href="/dashboard/partnership/link" className="pp-btn is-primary">
                  Get my link
                </Link>
                <Link href="/dashboard/partnership/campaigns" className="pp-btn">
                  View campaigns
                </Link>
              </div>
            </section>

            <div className="pp-stats dashboard-span-2">
              <article className="pp-stat">
                <p className="pp-stat-label">Paid to date</p>
                <p className="pp-stat-value">{formatPhp(stats.paidToDate)}</p>
              </article>
              <article className="pp-stat">
                <p className="pp-stat-label">Clicks (7 days)</p>
                <p className="pp-stat-value">{stats.clicks7}</p>
                <p className="pp-stat-note">{stats.clicks30} in 30 days</p>
              </article>
              <article className="pp-stat">
                <p className="pp-stat-label">Your team</p>
                <p className="pp-stat-value">{stats.downline}</p>
                <p className="pp-stat-note">{labels}</p>
              </article>
            </div>

            <MacosWindow title="How payouts work" className="dashboard-span-2">
              <p className="macos-lead" style={{ textAlign: "left" }}>
                {PAYOUT_COPY}{" "}
                {campaigns.length === 1
                  ? `You can promote ${campaigns[0].title}.`
                  : "Use a separate link and QR for each campaign you are allowed to promote."}
              </p>
              <div className="macos-actions">
                <Link href="/dashboard/partnership/payouts" className="macos-btn macos-btn-secondary">
                  Payout details
                </Link>
              </div>
            </MacosWindow>
          </>
        ) : (
          <>
            <article className="dashboard-metric-card">
              <p className="macos-kicker">Following cycle</p>
              <p className="dashboard-metric-value">{formatPhp(stats.nextCycle)}</p>
              <p className="dashboard-metric-copy">Due {formatManilaDate(stats.followingPayday)}</p>
            </article>
            <article className="dashboard-metric-card">
              <p className="macos-kicker">Clicks</p>
              <p className="dashboard-metric-value">{stats.clicks7}</p>
              <p className="dashboard-metric-copy">{stats.clicks30} in the last 30 days</p>
            </article>
            <article className="dashboard-metric-card">
              <p className="macos-kicker">Attributed</p>
              <p className="dashboard-metric-value">{stats.attributed}</p>
              <p className="dashboard-metric-copy">{stats.downline} people in your tree</p>
            </article>

            <MacosWindow title="Recent clicks" bodyClassName="dashboard-contact-list">
              {stats.recentClicks.length === 0 ? (
                <p className="macos-lead" style={{ textAlign: "left" }}>
                  No tracked clicks yet. Share your branded link to start.
                </p>
              ) : (
                stats.recentClicks.map((click) => (
                  <div key={click.id} className="dashboard-contact-row !cursor-default">
                    <span>
                      <strong>{click.campaignSlug || "direct"}</strong>
                      <em>{new Date(click.createdAt).toLocaleString("en-PH")}</em>
                    </span>
                  </div>
                ))
              )}
            </MacosWindow>

            <MacosWindow title="Attributed inquiries & signups" bodyClassName="dashboard-contact-list">
              {stats.recentAttributions.length === 0 ? (
                <p className="macos-lead" style={{ textAlign: "left" }}>
                  Attribution is tracked when someone uses your cookie. It does not create a payable sale by itself.
                </p>
              ) : (
                stats.recentAttributions.map((item) => (
                  <div key={item.id} className="dashboard-contact-row !cursor-default">
                    <span>
                      <strong>{item.name || item.email}</strong>
                      <em>
                        {item.kind} · {item.email}
                      </em>
                    </span>
                  </div>
                ))
              )}
            </MacosWindow>
          </>
        )}
      </div>
    </>
  );
}
