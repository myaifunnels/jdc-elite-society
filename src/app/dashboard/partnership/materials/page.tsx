import { MaterialForm } from "@/components/dashboard/partnership-forms";
import { MacosWindow } from "@/components/dashboard/macos-window";
import { listMaterials } from "@/lib/affiliate-store";
import { requireAffiliateAccess } from "@/lib/session";

export default async function PartnershipMaterialsPage() {
  const user = await requireAffiliateAccess();
  const materials = await listMaterials(true);
  const grouped = new Map<string, typeof materials>();
  for (const item of materials) {
    const list = grouped.get(item.category) ?? [];
    list.push(item);
    grouped.set(item.category, list);
  }

  return (
    <div className="dashboard-widget-grid">
      {grouped.size === 0 ? (
        <MacosWindow title="Downloadable materials" className="dashboard-span-2">
          <p className="macos-lead" style={{ textAlign: "left" }}>
            No kits yet. Admin can add logos, scripts, and PDFs here (paste an R2 or CDN URL).
          </p>
        </MacosWindow>
      ) : (
        [...grouped.entries()].map(([category, items]) => (
          <MacosWindow key={category} title={category} className="dashboard-span-2" bodyClassName="dashboard-contact-list">
            {items.map((item) => (
              <a key={item.id} href={item.fileUrl} target="_blank" rel="noreferrer" className="dashboard-contact-row">
                <span>
                  <strong>{item.title}</strong>
                  <em>{item.fileName || item.fileUrl}</em>
                </span>
              </a>
            ))}
          </MacosWindow>
        ))
      )}

      {user.role === "admin" ? (
        <MacosWindow title="Add material" className="dashboard-span-2">
          <MaterialForm />
        </MacosWindow>
      ) : null}
    </div>
  );
}
