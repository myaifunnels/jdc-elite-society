import Link from "next/link";
import { ChevronRight, type LucideIcon } from "lucide-react";

import { MacosWindow } from "@/components/dashboard/macos-window";

export type QuickLink = {
  href: string;
  label: string;
  description: string;
  icon: LucideIcon;
};

export function QuickLinksCard({
  title = "Quick links",
  links,
  className,
}: {
  title?: string;
  links: QuickLink[];
  className?: string;
}) {
  if (!links.length) {
    return null;
  }

  return (
    <MacosWindow title={title} className={className} bodyClassName="dashboard-quick-links">
      {links.map((link) => {
        const Icon = link.icon;
        return (
          <Link key={link.href} href={link.href} className="dashboard-quick-link-row">
            <Icon size={16} aria-hidden />
            <span>
              <strong>{link.label}</strong>
              <small>{link.description}</small>
            </span>
            <ChevronRight size={15} aria-hidden />
          </Link>
        );
      })}
    </MacosWindow>
  );
}
