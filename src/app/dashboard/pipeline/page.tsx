import Link from "next/link";

import { PipelineWorkspace } from "@/components/dashboard/pipeline-workspace";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { listPipelineBoard } from "@/lib/crm-store";
import { listEliteCheckoutOrders } from "@/lib/elite-checkout-store";
import { PIPELINE_STAGES } from "@/lib/pipeline";
import { requireCapability } from "@/lib/session";
import { siteUrl } from "@/lib/site";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function PipelinePage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>;
}) {
  const { user } = await requireCapability("contacts.all");
  const view = (await searchParams).view === "list" ? "list" : "kanban";
  const orders = await listEliteCheckoutOrders();
  const pendingEmails = new Set(
    orders.filter((order) => order.status === "pending").map((order) => order.email.toLowerCase()),
  );
  const cards = await listPipelineBoard({ ...user, seeAllContacts: true }, pendingEmails);
  const counts = Object.fromEntries(PIPELINE_STAGES.map((stage) => [stage.id, cards.filter((card) => card.stage === stage.id).length]));

  return (
    <DashboardShell
      title="Pipeline"
      description="Kanban of Leads, payment checks, First Batch, and Second Batch. Moves write tags to the GHL subaccount; GHL tag changes sync back here."
    >
      <div className="dashboard-widget-grid pipeline-metrics">
        {PIPELINE_STAGES.map((stage) => (
          <article key={stage.id} className="dashboard-metric-card">
            <p className="macos-kicker">{stage.label}</p>
            <p className="dashboard-metric-value">{counts[stage.id] ?? 0}</p>
            <p className="dashboard-metric-copy">{stage.detail}</p>
          </article>
        ))}
      </div>

      <div className="macos-toolbar pipeline-toolbar">
        <div className="macos-segment" style={{ gridTemplateColumns: "1fr 1fr", width: "min(16rem, 100%)" }}>
          <Link href="/dashboard/pipeline" className={cn(view === "kanban" && "is-active")}>
            Kanban
          </Link>
          <Link href="/dashboard/pipeline?view=list" className={cn(view === "list" && "is-active")}>
            List
          </Link>
        </div>
      </div>

      <PipelineWorkspace cards={cards} view={view} />
      <p className="pipeline-sync-note">
        Mirror webhook: <code>{siteUrl}/api/ghl/webhook</code> — add it to the JDC Elite Society subaccount for Contact Tag Update / Contact Update.
      </p>
    </DashboardShell>
  );
}
