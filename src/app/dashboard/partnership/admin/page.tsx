import { approveAllPartnerships } from "@/app/dashboard/partnership/actions";
import { MacosWindow } from "@/components/dashboard/macos-window";
import {
  ApproveAllPartnershipsForm,
  CampaignForm,
  GrantAccessForm,
  MarkPaidForm,
  RecordSaleForm,
  UpdateAffiliateForm,
  VoidSaleForm,
} from "@/components/dashboard/partnership-forms";
import { maskAccountNumber } from "@/lib/affiliate";
import {
  cycleQueue,
  getPayoutMethod,
  listCampaigns,
  listProfiles,
  listSales,
  unpaidApprovedSales,
} from "@/lib/affiliate-store";
import { listPublicUsers } from "@/lib/auth-store";
import { followingPayDate, formatManilaDate, formatPhp, nextPayDate } from "@/lib/pay-cycle";
import { requireCapability } from "@/lib/session";

export default async function PartnershipAdminPage() {
  await requireCapability("partnership.admin");
  const approval = await approveAllPartnerships();
  const users = await listPublicUsers();
  const profiles = await listProfiles();
  const payday = nextPayDate();
  const following = followingPayDate();
  const thisQueue = await cycleQueue(payday);
  const nextQueue = await cycleQueue(following);
  const unpaid = await unpaidApprovedSales();
  const recentSales = (await listSales()).slice(0, 12);
  const campaigns = await listCampaigns(false);

  async function queueRows(scheduled: string, grouped: Awaited<ReturnType<typeof cycleQueue>>) {
    return Promise.all(
      [...grouped.entries()].map(async ([userId, row]) => {
        const person = users.find((item) => item.id === userId);
        const method = await getPayoutMethod(userId);
        return { userId, person, method, ...row, scheduled };
      }),
    );
  }

  const dueNow = await queueRows(payday, thisQueue);
  const dueNext = await queueRows(following, nextQueue);

  return (
    <div className="dashboard-widget-grid">
      <MacosWindow title="Approve all" className="dashboard-span-2">
        <p className="macos-lead" style={{ textAlign: "left" }}>
          Activate invited partners, keep their Pioneer / jdc-partner campaigns, and approve pending sales. Revoked
          partners with no programs stay paused. Opening this page also runs that approval.
        </p>
        {approval.success ? <p className="mt-3 text-sm text-emerald-400">{approval.success}</p> : null}
        <div className="mt-4">
          <ApproveAllPartnershipsForm />
        </div>
      </MacosWindow>

      <MacosWindow title="Grant access" className="dashboard-span-2">
        <p className="macos-lead" style={{ textAlign: "left" }}>
          Tag a contact pioneer for the Foundation Course campaign. Tag jdc-partner (coaches only) to unlock the extra
          20% Mastermind Sessions 1 and 2 campaign with a separate link.
        </p>
        <div className="mt-4">
          <GrantAccessForm users={users} profiles={profiles} />
        </div>
      </MacosWindow>

      <MacosWindow title="Roster" className="dashboard-span-2">
        {profiles.length === 0 ? (
          <p className="macos-lead" style={{ textAlign: "left" }}>
            No affiliates yet.
          </p>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {profiles.map((profile) => (
              <UpdateAffiliateForm key={profile.userId} profile={profile} users={users} profiles={profiles} />
            ))}
          </div>
        )}
      </MacosWindow>

      <MacosWindow title="Record a sale" className="dashboard-span-2">
        <p className="macos-lead" style={{ textAlign: "left" }}>
          Enter a closed purchase. Foundation Course is for pioneers. Mastermind Sessions 1 and 2 is the extra 20%
          campaign for jdc-partner coaches. Commission is not paid automatically.
        </p>
        <div className="mt-4">
          <RecordSaleForm users={users} profiles={profiles} />
        </div>
      </MacosWindow>

      <MacosWindow title={`Pay cycle · ${formatManilaDate(payday)}`} className="dashboard-span-2">
        {dueNow.length === 0 ? (
          <p className="macos-lead" style={{ textAlign: "left" }}>
            Nothing unpaid for this payday. Unpaid approved commissions: {unpaid.length}.
          </p>
        ) : (
          <div className="grid gap-4">
            {dueNow.map((row) => (
              <div key={row.userId} className="rounded-2xl border border-[var(--line)] p-4">
                <p className="font-semibold">{row.person?.name ?? row.userId}</p>
                <p className="text-sm text-[var(--muted)]">
                  {formatPhp(row.amount)} ·{" "}
                  {row.method
                    ? `${row.method.method} · ${row.method.accountName} · ${maskAccountNumber(row.method.accountNumber)}`
                    : "No payout method on file"}
                </p>
                <div className="mt-3">
                  <MarkPaidForm affiliateUserId={row.userId} scheduledPayDate={row.scheduled} amount={row.amount} />
                </div>
              </div>
            ))}
          </div>
        )}
      </MacosWindow>

      <MacosWindow title={`Next cycle · ${formatManilaDate(following)}`}>
        {dueNext.length === 0 ? (
          <p className="macos-lead" style={{ textAlign: "left" }}>
            Empty.
          </p>
        ) : (
          <ul className="grid gap-2 text-sm">
            {dueNext.map((row) => (
              <li key={row.userId}>
                {row.person?.name ?? row.userId} · {formatPhp(row.amount)}
              </li>
            ))}
          </ul>
        )}
      </MacosWindow>

      <MacosWindow title="Recent sales" bodyClassName="dashboard-contact-list">
        {recentSales.length === 0 ? (
          <p className="macos-lead" style={{ textAlign: "left" }}>
            No sales recorded.
          </p>
        ) : (
          recentSales.map((sale) => {
            const person = users.find((item) => item.id === sale.affiliateUserId);
            return (
              <div key={sale.id} className="dashboard-contact-row !cursor-default">
                <span>
                  <strong>{person?.name ?? sale.affiliateUserId}</strong>
                  <em>
                    {formatPhp(sale.commissionAmount)} · due {formatManilaDate(sale.scheduledPayDate)} · {sale.status}
                  </em>
                </span>
                {!sale.payoutId && sale.status !== "void" ? <VoidSaleForm saleId={sale.id} /> : null}
              </div>
            );
          })
        )}
      </MacosWindow>

      <MacosWindow title="Campaigns" className="dashboard-span-2">
        <ul className="mb-4 grid gap-2 text-sm">
          {campaigns.map((campaign) => (
            <li key={campaign.id}>
              {campaign.title} · /go/CODE/{campaign.slug} → {campaign.destinationPath}
              {campaign.active ? "" : " (inactive)"}
            </li>
          ))}
        </ul>
        <CampaignForm />
      </MacosWindow>
    </div>
  );
}
