import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { getProgram, programs } from "@/data/programs";

type ProgramPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  return programs.map((program) => ({ slug: program.slug }));
}

export async function generateMetadata({
  params,
}: ProgramPageProps): Promise<Metadata> {
  const { slug } = await params;
  const program = getProgram(slug);

  if (!program) {
    return {};
  }

  return {
    title: program.title,
    description: program.shortDescription,
  };
}

export default async function ProgramPage({ params }: ProgramPageProps) {
  const { slug } = await params;
  const program = getProgram(slug);

  if (!program) {
    notFound();
  }

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="section-space">
        <div className="container-shell">
          <div className="card-surface rounded-[2rem] p-8 sm:p-10">
            <p className="text-xs uppercase tracking-[0.3em] text-[var(--brand-dark)]">A program from Coach JDC</p>
            <h1 className="mt-3 max-w-3xl text-5xl font-semibold tracking-tight">{program.title}</h1>
            <p className="mt-4 max-w-2xl text-lg text-[var(--muted)]">{program.shortDescription}</p>

            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                href={`/contact?program=${encodeURIComponent(program.title)}`}
                className="rounded-full bg-[var(--brand)] px-6 py-3 font-semibold text-white transition hover:bg-[var(--brand-dark)]"
              >
                {program.ctaLabel}
              </Link>
              <Link
                href="/programs"
                className="rounded-full border border-black/10 px-6 py-3 font-semibold transition hover:border-black/30"
              >
                See the other tracks
              </Link>
            </div>
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
            <section className="card-surface rounded-[2rem] p-8">
              <h2 className="text-2xl font-semibold">Who I built this for</h2>
              <p className="mt-4 text-[var(--muted)]">{program.audience}</p>

              <h3 className="mt-8 text-xl font-semibold">What changes if you do the work</h3>
              <p className="mt-3 text-[var(--muted)]">{program.transformation}</p>
            </section>

            <section className="card-surface rounded-[2rem] p-8">
              <h2 className="text-2xl font-semibold">Benefits and modules</h2>
              <div className="mt-6 grid gap-6 md:grid-cols-2">
                <div>
                  <p className="font-semibold">Key benefits</p>
                  <ul className="mt-3 grid gap-3 text-sm text-[var(--muted)]">
                    {program.benefits.map((benefit) => (
                      <li key={benefit}>• {benefit}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="font-semibold">Program structure</p>
                  <ul className="mt-3 grid gap-3 text-sm text-[var(--muted)]">
                    {program.modules.map((module) => (
                      <li key={module}>• {module}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </section>
          </div>

          <section className="mt-8 card-surface rounded-[2rem] p-8">
            <h2 className="text-2xl font-semibold">Frequently asked questions</h2>
            <div className="mt-6 grid gap-4">
              {program.faqs.map((item) => (
                <div key={item.question} className="rounded-[1.5rem] border border-black/8 bg-white px-5 py-4">
                  <h3 className="font-semibold">{item.question}</h3>
                  <p className="mt-2 text-sm text-[var(--muted)]">{item.answer}</p>
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
