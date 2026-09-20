import { cn } from "@/lib/utils";

export function JdcWordmark({ compact = false }: { compact?: boolean }) {
  return (
    <span className={cn("jdc-wordmark", compact && "is-compact")} aria-hidden="true">
      <span className="jdc-letter">j</span>
      <span className="jdc-letter">D</span>
      <span className="jdc-letter">C</span>
    </span>
  );
}
