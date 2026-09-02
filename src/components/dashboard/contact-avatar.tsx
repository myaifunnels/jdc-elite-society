import { cn } from "@/lib/utils";
import { isDisplayableImageSrc, mediaSrc } from "@/lib/media";

export function ContactAvatar({
  name,
  photoUrl,
  size = "md",
}: {
  name: string;
  photoUrl?: string;
  size?: "sm" | "md" | "lg" | "xl";
}) {
  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
  const pixels = size === "xl" ? 96 : size === "lg" ? 68 : size === "sm" ? 28 : 36;
  const src = isDisplayableImageSrc(photoUrl) ? mediaSrc(photoUrl) : undefined;

  return (
    <span className={cn("contact-avatar", `is-${size}`)}>
      {src ? (
        // User-uploaded photos may be R2 hosts or data URLs.
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" width={pixels} height={pixels} />
      ) : (
        <span>{initials || "•"}</span>
      )}
    </span>
  );
}
