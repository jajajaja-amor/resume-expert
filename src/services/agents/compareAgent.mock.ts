import { delay } from "@/lib/utils";
import {
  DEMO_PRODUCT_DOCS,
  getDemoCompareResult,
} from "@/data/demo/soft-membrane";
import type { AgentStep, CompareAnalysisResult, DocumentFile } from "@/types/workspace";
import { COMPARE_AGENT_STEPS } from "@/services/agents/steps";

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
    await delay(420 + Math.random() * 280);
  };

  for (let i = 0; i < steps.length; i++) {
    await bump(i);
  }
  steps.forEach((s) => {
    s.status = "done";
  });
  onStep?.(steps.map((s) => ({ ...s })));

  const result = getDemoCompareResult();
  if (docs.length > 0) {
    result.products = result.products.map((p, idx) => ({
      ...p,
      documentIds: docs[idx] ? [docs[idx].id] : p.documentIds,
    }));
  }
  return result;
}

export function getDemoProductDocuments(): DocumentFile[] {
  return DEMO_PRODUCT_DOCS.map((d) => ({
    ...d,
    parseStatus: "pending" as const,
    uploadedAt: new Date().toISOString(),
  }));
}
