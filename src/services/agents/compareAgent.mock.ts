import { delay } from "@/lib/utils";
import type { AgentStep, CompareAnalysisResult, DocumentFile } from "@/types/workspace";
import { COMPARE_AGENT_STEPS } from "@/services/agents/steps";
import { runComparePipeline } from "@/services/compare/pipeline";
import { getDemoProductDocuments } from "@/data/demo/product-documents";

export { getDemoProductDocuments };

/**
 * Local fallback — runs extract/normalize/score on provided text. No fabricated params.
 */
export async function runCompareAnalysisMock(
  docs: DocumentFile[],
  onStep?: (steps: AgentStep[]) => void
): Promise<CompareAnalysisResult> {
  const steps: AgentStep[] = COMPARE_AGENT_STEPS.map((s) => ({ ...s }));
  const bump = async (index: number) => {
    steps.forEach((s, i) => {
      if (i < index) s.status = "done";
      else if (i === index) s.status = "processing";
      else s.status = "pending";
    });
    onStep?.(steps.map((s) => ({ ...s })));
    await delay(120);
  };

  for (let i = 0; i < steps.length; i++) {
    await bump(i);
  }

  return runComparePipeline(docs, {
    demoMode: docs.some((d) => (d as DocumentFile & { demoSource?: boolean }).demoSource),
  });
}
