import { mediaSrc } from "@/lib/media";

const RING = "h-9 w-9 rounded-full border-2 border-[#050b18] sm:h-10 sm:w-10";

function initialsFor(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]![0]}${parts[parts.length - 1]![0]}`.toUpperCase();
}

function hueFor(seed: string) {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) % 360;
  }
  return hash;
}

/** Never fabricate people: this only ever renders real confirmed registrants passed in. */
export function WebinarAvatarRow({
  registrants,
  max = 6,
}: {
  registrants: { name: string; photoUrl?: string }[];
  max?: number;
}) {
  if (registrants.length === 0) return null;

  const visible = registrants.slice(0, max);
  const extra = registrants.length - visible.length;

  return (
    <div className="flex items-center gap-3">
      <div className="flex -space-x-2.5">
        {visible.map((registrant, index) => {
          const src = mediaSrc(registrant.photoUrl);
          const hue = hueFor(registrant.name || String(index));
          return src ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={`${registrant.name}-${index}`}
              src={src}
              alt={registrant.name}
              className={`${RING} object-cover`}
            />
          ) : (
            <span
              key={`${registrant.name}-${index}`}
              className={`${RING} flex items-center justify-center text-[0.65rem] font-extrabold text-white`}
              style={{ background: `hsl(${hue} 55% 38%)` }}
              aria-hidden="true"
              title={registrant.name}
            >
              {initialsFor(registrant.name)}
            </span>
          );
        })}
        {extra > 0 ? (
          <span
            className={`${RING} flex items-center justify-center bg-black/60 text-[0.62rem] font-extrabold text-white/90 backdrop-blur-md`}
          >
            +{extra}
          </span>
        ) : null}
      </div>
      <span className="text-xs font-semibold text-white/70">
        {registrants.length} {registrants.length === 1 ? "person" : "people"} registered
      </span>
    </div>
  );
}
