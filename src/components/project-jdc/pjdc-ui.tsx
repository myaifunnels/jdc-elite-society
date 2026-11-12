// Small display pieces shared by the server screens and the client widgets.

import { ContactAvatar } from "@/components/dashboard/contact-avatar";
import { PROJECT_JDC_STATUS_LABELS, type ProjectJdcStatus } from "@/lib/project-jdc-status";
import { cn } from "@/lib/utils";

export function PjdcAvatar({
  name,
  photoUrl,
  status,
  size = "md",
}: {
  name: string;
  photoUrl?: string;
  status?: ProjectJdcStatus;
  size?: "sm" | "md" | "lg" | "xl";
}) {
  return (
    <span className={cn("pjdc-avatar", status && `is-${status}`, `is-${size}`)}>
      <ContactAvatar name={name} photoUrl={photoUrl} size={size} />
    </span>
  );
}

export function StatusPill({ status }: { status: ProjectJdcStatus }) {
  return <span className={cn("pjdc-status", `is-${status}`)}>{PROJECT_JDC_STATUS_LABELS[status]}</span>;
}

export function ProgressBar({ value, max, label }: { value: number; max: number; label: string }) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div
      className={cn("pjdc-bar", pct >= 100 && "is-full")}
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={Math.min(value, max)}
    >
      <span style={{ width: `${pct}%` }} />
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="pjdc-empty">
      <span className="pjdc-empty-icon" aria-hidden>
        {icon}
      </span>
      <p className="pjdc-empty-title">{title}</p>
      {children ? <div className="pjdc-empty-text">{children}</div> : null}
    </div>
  );
}

export function firstName(name: string) {
  return name.trim().split(/\s+/)[0] || name;
}

export function shortDate(iso: string | null | undefined) {
  if (!iso) return "Not yet";
  return new Date(iso).toLocaleDateString("en-PH", { month: "short", day: "numeric", timeZone: "Asia/Manila" });
}
