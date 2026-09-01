import { EliteOfferPage } from "@/components/elite/elite-offer-page";
import { JsonLd } from "@/components/seo/json-ld";
import { mastermindJsonLd } from "@/lib/mastermind-seo";

export default function ElitePage() {
  return (
    <>
      <JsonLd data={mastermindJsonLd()} />
      <EliteOfferPage />
    </>
  );
}
