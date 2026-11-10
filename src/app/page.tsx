import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { HeroBillboard } from "@/components/sections/hero-billboard";

export default function Home() {
  return (
    <div className="min-h-screen">
      <SiteHeader overlay />

      <main>
        <HeroBillboard />
      </main>

      <SiteFooter />
    </div>
  );
}
