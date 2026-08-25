import Link from "next/link";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { MacosWindow } from "@/components/dashboard/macos-window";
import {
  AddSmsTemplateForm,
  SendTestSmsForm,
  SmsFromNumberForm,
} from "@/components/dashboard/sms-automation-forms";
import { SmsTemplateCard } from "@/components/dashboard/sms-template-card";
import { getResolvedIntegrationSettings } from "@/lib/integrations-store";
import { requireCapability } from "@/lib/session";
import { listSmsTemplates } from "@/lib/sms-templates-store";
import { cn } from "@/lib/utils";

type AutomationTab = "sms";

export default async function AutomationPage() {
  await requireCapability("automation");
  const tab: AutomationTab = "sms";
  const settings = await getResolvedIntegrationSettings();
  const templates = await listSmsTemplates();

  return (
    <DashboardShell
      title="Automation"
      description="The SMS copy sent for every buyer and team activity in the system — edit the wording, set the from number, and test a send."
    >
      <div className="macos-toolbar" style={{ padding: "0 0 0.9rem" }}>
        <div className="macos-segment" style={{ gridTemplateColumns: "1fr", width: "min(14rem, 100%)" }}>
          <Link href="/dashboard/automation" className={cn(tab === "sms" && "is-active")}>
            SMS Templates
          </Link>
        </div>
      </div>

      <div className="dashboard-widget-grid">
        <MacosWindow title="From number" className="dashboard-span-2">
          <SmsFromNumberForm value={settings.smsFromNumber} />
        </MacosWindow>

        <MacosWindow title="Send a test text" className="dashboard-span-2">
          <SendTestSmsForm templates={templates.map((item) => ({ id: item.id, label: item.label, body: item.body }))} />
        </MacosWindow>

        <div className="dashboard-span-2 sms-template-list">
          {templates.map((template) => (
            <SmsTemplateCard key={template.id} template={template} />
          ))}
        </div>

        <MacosWindow title="Add a custom template" className="dashboard-span-2">
          <p className="macos-lead" style={{ textAlign: "left" }}>
            Not tied to any automatic activity — use it as a saved starting point in the test-send tool above, for
            manual outreach.
          </p>
          <AddSmsTemplateForm />
        </MacosWindow>
      </div>
    </DashboardShell>
  );
}
