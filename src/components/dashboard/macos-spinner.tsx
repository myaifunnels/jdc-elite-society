"use client";

import { cn } from "@/lib/utils";

export function MacosSpinner({
  size = 36,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <span
      className={cn("macos-spinner", className)}
      style={{ width: size, height: size }}
      role="status"
      aria-label="Loading"
    >
      {Array.from({ length: 12 }, (_, index) => (
        <span key={index} style={{ transform: `rotate(${index * 30}deg)` }} />
      ))}
    </span>
  );
}
