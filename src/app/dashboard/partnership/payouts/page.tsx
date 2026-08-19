import { MacosWindow } from "@/components/dashboard/macos-window";
import { PayoutMethodForm } from "@/components/dashboard/partnership-forms";
import { getPayoutMethod, listPayouts, listSales } from "@/lib/affiliate-store";
import { maskAccountNumber } from "@/lib/affiliate";
import { formatManilaDate, formatPhp, PAYOUT_COPY } from "@/lib/pay-cycle";
import { requireAffiliateAccess } from "@/lib/session";

export default async function PartnershipPayoutsPage() {
  const user = await requireAffiliateAccess();
  const method = await getPayoutMethod(user.id);
  const sales = await listSales(user.id);
  const payouts = await listPayouts(user.id);

  const cycles = new Map<
    string,
    { date: string; start: string; end: string; commission: number; paid: number; items: typeof sales }
  >();

  for (const sale of sales) {
    const current = cycles.get(sale.scheduledPayDate) ?? {
      date: sale.scheduledPayDate,
      start: sale.periodStart,
      end: sale.periodEnd,
      commission: 0,
      paid: 0,
      items: [],
    };
    if (sale.status !== "void") {
      current.commission += sale.commissionAmount;
      if (sale.payoutId) {
        current.paid += sale.commissionAmount;
      }
    }
    current.items.push(sale);
    cycles.set(sale.scheduledPayDate, current);
  }

  const ordered = [...cycles.values()].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="dashboard-widget-grid">
      <MacosWindow title="Bank / e-wallet" className="dashboard-span-2">
        <p className="macos-lead" style={{ textAlign: "left" }}>
          {PAYOUT_COPY} Account numbers are masked for anyone who is not you or an admin.
        </p>
        {method ? (
          <p className="mt-3 text-sm text-[var(--muted)]">
            On file: {method.method} · {method.accountName} · {maskAccountNumber(method.accountNumber)}
          </p>
        ) : null}
        <div className="mt-4">
          <PayoutMethodForm method={method} />
        </div>
      </MacosWindow>

      <MacosWindow title="Pay cycles" className="dashboard-span-2">
        {ordered.length === 0 ? (
          <p className="macos-lead" style={{ textAlign: "left" }}>
            No recorded sales yet. Admin enters closed sales; 20% lands in the 1–15 or 16–end cycle.
          </p>
        ) : (
          <div className="grid gap-4">
            {ordered.map((cycle) => (
              <div key={cycle.date} className="rounded-2xl border border-[var(--line)] p-4">
                <p className="font-semibold">Due {formatManilaDate(cycle.date)}</p>
                <p className="text-sm text-[var(--muted)]">
                  {formatManilaDate(cycle.start)} – {formatManilaDate(cycle.end)} · {formatPhp(cycle.commission)}{" "}
                  earned · {formatPhp(cycle.paid)} paid
                </p>
                <ul className="mt-3 grid gap-2 text-sm">
                  {cycle.items.map((sale) => (
                    <li key={sale.id}>
                      {formatManilaDate(sale.soldAt)} · {sale.source || "Sale"} · {formatPhp(sale.commissionAmount)} ·{" "}
                      {sale.status}
                      {sale.payoutId ? " · included in payout" : ""}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </MacosWindow>

      <MacosWindow title="Paid history" className="dashboard-span-2">
        {payouts.length === 0 ? (
          <p className="macos-lead" style={{ textAlign: "left" }}>
            Paid batches will show here with the GCash or bank reference.
          </p>
        ) : (
          <ul className="grid gap-2 text-sm">
            {payouts.map((payout) => (
              <li key={payout.id}>
                {formatManilaDate(payout.scheduledPayDate)} · {formatPhp(payout.amount)} · {payout.status}
                {payout.reference ? ` · ${payout.reference}` : ""}
              </li>
            ))}
          </ul>
        )}
      </MacosWindow>
    </div>
  );
}
