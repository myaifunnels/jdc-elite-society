import Link from "next/link";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import {
  AddEmailTemplateForm,
  EmailFromAddressForm,
  SendTestEmailForm,
} from "@/components/dashboard/email-automation-forms";
import { EmailTemplateCard } from "@/components/dashboard/email-template-card";
import { MacosWindow } from "@/components/dashboard/macos-window";
import {
  AddSmsTemplateForm,
  SendTestSmsForm,
  SmsFromNumberForm,
} from "@/components/dashboard/sms-automation-forms";
import { SmsTemplateCard } from "@/components/dashboard/sms-template-card";
import { EMAIL_TEMPLATE_GROUPS } from "@/lib/email-templates";
import { listEmailTemplates } from "@/lib/email-templates-store";
import { getResolvedIntegrationSettings } from "@/lib/integrations-store";
import { requireCapability } from "@/lib/session";
import { SMS_TEMPLATE_GROUPS } from "@/lib/sms-templates";
import { listSmsTemplates } from "@/lib/sms-templates-store";
import { cn } from "@/lib/utils";

type AutomationTab = "sms" | "email";

export default async function AutomationPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  await requireCapability("automation");
  const requested = (await searchParams).tab;
  const tab: AutomationTab = requested === "email" ? "email" : "sms";
  const settings = await getResolvedIntegrationSettings();

  const smsTemplates = await listSmsTemplates();
  const smsByKey = new Map(smsTemplates.filter((item) => item.key).map((item) => [item.key, item]));
  const smsCustom = smsTemplates.filter((item) => item.isCustom);

  const emailTemplates = await listEmailTemplates();
  const emailByKey = new Map(emailTemplates.filter((item) => item.key).map((item) => [item.key, item]));
  const emailCustom = emailTemplates.filter((item) => item.isCustom);

  return (
    <DashboardShell
      title="Automation"
      description="SMS and email copy for JDC Elite Society, account, and support. Texts send through GHL, then TextBee, then Twilio; emails send through Resend. Edit wording here, then test a send."
    >
      <div className="macos-toolbar" style={{ padding: "0 0 0.9rem" }}>
        <div className="macos-segment" style={{ gridTemplateColumns: "1fr 1fr", width: "min(20rem, 100%)" }}>
          <Link href="/dashboard/automation" className={cn(tab === "sms" && "is-active")}>
            SMS Templates
          </Link>
          <Link href="/dashboard/automation?tab=email" className={cn(tab === "email" && "is-active")}>
            Email Templates
          </Link>
        </div>
      </div>

      {tab === "sms" ? (
        <div className="dashboard-widget-grid">
          <MacosWindow title="From number" className="dashboard-span-2">
            <SmsFromNumberForm value={settings.smsFromNumber} />
          </MacosWindow>

          <MacosWindow title="Send a test text" className="dashboard-span-2">
            <SendTestSmsForm templates={smsTemplates.map((item) => ({ id: item.id, label: item.label, body: item.body }))} />
          </MacosWindow>

          {SMS_TEMPLATE_GROUPS.map((group) => (
            <div key={group.id} className="dashboard-span-2 sms-template-group">
              <h2 className="sms-template-group-title">{group.label}</h2>
              <div className="template-list">
                {group.keys.map((key) => {
                  const template = smsByKey.get(key);
                  return template ? <SmsTemplateCard key={template.id} template={template} /> : null;
                })}
              </div>
            </div>
          ))}

          {smsCustom.length ? (
            <div className="dashboard-span-2 sms-template-group">
              <h2 className="sms-template-group-title">Custom</h2>
              <div className="template-list">
                {smsCustom.map((template) => (
                  <SmsTemplateCard key={template.id} template={template} />
                ))}
              </div>
            </div>
          ) : null}

          <MacosWindow title="Add a custom template" className="dashboard-span-2">
            <p className="macos-lead" style={{ textAlign: "left" }}>
              Not tied to an automatic activity — use it as a saved starting point in the test-send tool above.
            </p>
            <AddSmsTemplateForm />
          </MacosWindow>
        </div>
      ) : (
        <div className="dashboard-widget-grid">
          <MacosWindow title="From address" className="dashboard-span-2">
            <EmailFromAddressForm value={settings.emailFromAddress} />
          </MacosWindow>

          <MacosWindow title="Send a test email" className="dashboard-span-2">
            <SendTestEmailForm
              templates={emailTemplates.map((item) => ({
                id: item.id,
                label: item.label,
                subject: item.subject,
                html: item.html,
              }))}
            />
          </MacosWindow>

          {EMAIL_TEMPLATE_GROUPS.map((group) => (
            <div key={group.id} className="dashboard-span-2 sms-template-group">
              <h2 className="sms-template-group-title">{group.label}</h2>
              <div className="template-list">
                {group.keys.map((key) => {
                  const template = emailByKey.get(key);
                  return template ? <EmailTemplateCard key={template.id} template={template} /> : null;
                })}
              </div>
            </div>
          ))}

          {emailCustom.length ? (
            <div className="dashboard-span-2 sms-template-group">
              <h2 className="sms-template-group-title">Custom</h2>
              <div className="template-list">
                {emailCustom.map((template) => (
                  <EmailTemplateCard key={template.id} template={template} />
                ))}
              </div>
            </div>
          ) : null}

          <MacosWindow title="Add a custom template" className="dashboard-span-2">
            <p className="macos-lead" style={{ textAlign: "left" }}>
              Not tied to an automatic activity — use it as a saved starting point in the test-send tool above.
            </p>
            <AddEmailTemplateForm />
          </MacosWindow>
        </div>
      )}
    </DashboardShell>
  );
}
