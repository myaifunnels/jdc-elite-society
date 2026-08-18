import Image from "next/image";
import Link from "next/link";

import { Program } from "@/lib/types";

export function ProgramCard({ program }: { program: Program }) {
  return (
    <article className="card-surface interactive-card fade-up overflow-hidden rounded-[2rem]">
      <div className="visual-frame">
        <Image
          src={program.image}
          alt={program.imageAlt}
          fill
          sizes="(max-width: 1024px) 100vw, 50vw"
          className="object-cover"
        />
      </div>
      <div className="p-5 sm:p-8">
        <p className="eyebrow text-xs">Featured program</p>
        <h3 className="mt-3 text-2xl font-semibold tracking-[-0.02em]">{program.title}</h3>
        <p className="mt-3 text-sm text-[var(--muted)]">{program.shortDescription}</p>
        <p className="mt-4 text-sm leading-7">
          <span className="font-medium">For:</span> {program.audience}
        </p>
        <ul className="mt-5 grid gap-2 text-sm text-[var(--muted)]">
          {program.benefits.map((benefit) => (
            <li key={benefit}>• {benefit}</li>
          ))}
        </ul>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href={`/programs/${program.slug}`}
            className="button-primary pressable rounded-full px-4 py-2 font-semibold"
          >
            View this track
          </Link>
          <Link
            href={`/contact?program=${encodeURIComponent(program.title)}`}
            className="button-secondary pressable rounded-full px-4 py-2 font-medium"
          >
            {program.ctaLabel}
          </Link>
        </div>
      </div>
    </article>
  );
}
