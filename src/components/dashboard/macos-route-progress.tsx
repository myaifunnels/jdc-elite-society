"use client";

import { usePathname } from "next/navigation";

export function MacosRouteProgress() {
  const pathname = usePathname();

  return (
    <div key={pathname} className="macos-route-progress is-on" aria-hidden>
      <span />
    </div>
  );
}
