import { AffiliateTreeNode } from "@/lib/types";

export function GenealogyTree({ node, depth = 0 }: { node: AffiliateTreeNode; depth?: number }) {
  return (
    <div className="grid gap-2" style={{ paddingLeft: depth ? "1rem" : 0 }}>
      <div className="dashboard-contact-row !cursor-default">
        <span>
          <strong>{node.name}</strong>
          <em>
            /go/{node.code} · {node.status}
          </em>
        </span>
      </div>
      {node.children.length > 0 ? (
        <div className="grid gap-2 border-l border-[var(--line)] pl-3">
          {node.children.map((child) => (
            <GenealogyTree key={child.userId} node={child} depth={depth + 1} />
          ))}
        </div>
      ) : depth === 0 ? (
        <p className="macos-lead" style={{ textAlign: "left" }}>
          No one sits under you yet. Admin assigns structure; your share link attributes inquiries only.
        </p>
      ) : null}
    </div>
  );
}
