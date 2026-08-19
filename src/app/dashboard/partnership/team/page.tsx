import { GenealogyTree } from "@/components/dashboard/genealogy-tree";
import { MacosWindow } from "@/components/dashboard/macos-window";
import { buildTree } from "@/lib/affiliate-store";
import { listPublicUsers } from "@/lib/auth-store";
import { requireAffiliateAccess } from "@/lib/session";

export default async function PartnershipTeamPage() {
  const user = await requireAffiliateAccess();
  const users = await listPublicUsers();
  const usersById = new Map(users.map((item) => [item.id, item]));
  const tree = await buildTree(user.id, usersById, 5);

  return (
    <MacosWindow title="Genealogy">
      <p className="macos-lead" style={{ textAlign: "left" }}>
        This is your structure for visibility. Commissions in this version are direct only — you do not see other
        people’s earnings.
      </p>
      <div className="mt-4">
        {tree ? (
          <GenealogyTree node={tree} />
        ) : (
          <p className="macos-lead" style={{ textAlign: "left" }}>
            Your tree will appear after admin grants access.
          </p>
        )}
      </div>
    </MacosWindow>
  );
}
