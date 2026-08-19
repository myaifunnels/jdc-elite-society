import Image from "next/image";

import { cn } from "@/lib/utils";

export function ContactAvatar({
  name,
  photoUrl,
  size = "md",
}: {
  name: string;
  photoUrl?: string;
  size?: "sm" | "md" | "lg";
}) {
  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
  const pixels = size === "lg" ? 68 : size === "sm" ? 28 : 36;

  return (
    <span className={cn("contact-avatar", `is-${size}`)}>
      {photoUrl ? (
        <Image src={photoUrl} alt="" width={pixels} height={pixels} />
      ) : (
        <span>{initials || "•"}</span>
      )}
    </span>
  );
}
