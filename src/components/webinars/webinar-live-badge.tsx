/** Pulsing red "LIVE NOW" badge — shown wherever a webinar is inside its live window. Hook-free so
 * server components (the dashboard) and client components (the public page) can both render it. */
export function WebinarLiveBadge({ size = "md", label = "Live now" }: { size?: "sm" | "md"; label?: string }) {
  const compact = size === "sm";
  return (
    <span
      role="status"
      className={`inline-flex items-center gap-2 rounded-full border border-red-300/50 bg-red-500/20 font-extrabold uppercase text-red-50 shadow-[0_0_28px_rgba(239,68,68,0.35)] backdrop-blur-xl ${
        compact ? "px-3 py-1 text-[0.65rem] tracking-[0.1em]" : "px-5 py-3 text-sm tracking-[0.1em]"
      }`}
    >
      <span aria-hidden className="relative flex h-2.5 w-2.5">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
        <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-red-400" />
      </span>
      {label}
    </span>
  );
}
