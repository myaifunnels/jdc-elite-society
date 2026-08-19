"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  FolderDown,
  LayoutDashboard,
  Link2,
  Network,
  QrCode,
  Shield,
  Wallet,
} from "lucide-react";

import { cn } from "@/lib/utils";

const items = [
  { href: "/dashboard/partnership", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/partnership/link", label: "Link & QR", icon: QrCode },
  { href: "/dashboard/partnership/campaigns", label: "Campaigns", icon: Link2 },
  { href: "/dashboard/partnership/team", label: "Genealogy", icon: Network },
  { href: "/dashboard/partnership/materials", label: "Materials", icon: FolderDown },
  { href: "/dashboard/partnership/payouts", label: "Payouts", icon: Wallet },
];

export function PartnershipNav({ isAdmin }: { isAdmin: boolean }) {
  const pathname = usePathname();
  const links = isAdmin
    ? [...items, { href: "/dashboard/partnership/admin", label: "Admin", icon: Shield }]
    : items;

  return (
    <nav aria-label="Partnership" className="mb-5 flex flex-wrap gap-1">
      {links.map((item) => {
        const Icon = item.icon;
        const active =
          item.href === "/dashboard/partnership"
            ? pathname === item.href
            : pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn("dashboard-nav-item pressable !inline-flex w-auto", active && "is-active")}
          >
            <Icon size={14} aria-hidden />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
