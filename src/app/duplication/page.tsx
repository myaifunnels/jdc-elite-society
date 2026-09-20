import { MastermindBatch2Page } from "@/components/mastermind/mastermind-batch2-page";
import { JsonLd } from "@/components/seo/json-ld";
import { mastermindBatch2JsonLd } from "@/lib/mastermind-batch2-seo";

export default function MastermindPage() {
  return (
    <>
      <JsonLd data={mastermindBatch2JsonLd()} />
      <MastermindBatch2Page />
    </>
  );
}
