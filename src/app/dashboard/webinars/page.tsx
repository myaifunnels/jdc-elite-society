import { AddWebinarForm } from "@/components/dashboard/add-webinar-form";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { MacosWindow } from "@/components/dashboard/macos-window";
import { WebinarAdminCard } from "@/components/dashboard/webinar-admin-card";
import { requireCapability } from "@/lib/session";
import { listWebinars } from "@/lib/webinars-store";

export default async function WebinarsAdminPage() {
  await requireCapability("webinars");
  const webinars = await listWebinars();

  return (
    <DashboardShell
      title="Webinars"
      description="Manage the episodes shown on the public /webinars page — the featured hero, all-episode list, and each one's CTA button."
    >
      <div className="dashboard-widget-grid">
        <MacosWindow title="Add a webinar" className="dashboard-span-2">
          <AddWebinarForm />
        </MacosWindow>

        <div className="dashboard-span-2 sms-template-group">
          <h2 className="sms-template-group-title">All webinars ({webinars.length})</h2>
          {webinars.length ? (
            <div className="sms-template-list">
              {webinars.map((webinar) => (
                <WebinarAdminCard key={webinar.id} webinar={webinar} />
              ))}
            </div>
          ) : (
            <p className="macos-lead">No webinars yet. Add your first one above.</p>
          )}
        </div>
      </div>
    </DashboardShell>
  );
}
