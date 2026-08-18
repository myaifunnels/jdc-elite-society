import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export function FloatField({
  label,
  icon,
  error,
  className,
  children,
}: {
  label: string;
  icon?: ReactNode;
  error?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn("float-field-stack", className)}>
      <label className={cn("float-field", icon ? "has-icon" : "")}>
        {icon ? <span className="float-field-icon">{icon}</span> : null}
        {children}
        <span className="float-field-label">{label}</span>
      </label>
      {error ? <p className="float-field-error">{error}</p> : null}
    </div>
  );
}
