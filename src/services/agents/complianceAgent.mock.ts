import { delay } from "@/lib/utils";
import {
  DEMO_SPEC_DOCS,
  getDemoComplianceResult,
} from "@/data/demo/soft-membrane";
import type {
  AgentStep,
  ComplianceAnalysisResult,
  DocumentFile,
  SelectionResult,
} from "@/types/workspace";
import { COMPLIANCE_AGENT_STEPS } from "@/services/agents/steps";

export async function runComplianceAnalysisMock(
  selection: SelectionResult,
  _docs: DocumentFile[],
  onStep?: (steps: AgentStep[]) => void
): Promise<ComplianceAnalysisResult> {
  const steps: AgentStep[] = COMPLIANCE_AGENT_STEPS.map((s) => ({ ...s }));
  const bump = async (index: number) => {
    steps.forEach((s, i) => {
      if (i < index) s.status = "done";
      else if (i === index) s.status = "processing";
      else s.status = "pending";
    });
    onStep?.(steps.map((s) => ({ ...s })));
    await delay(400 + Math.random() * 260);
  };

  for (let i = 0; i < steps.length; i++) {
    await bump(i);
  }
  steps.forEach((s) => {
    s.status = "done";
  });
  onStep?.(steps.map((s) => ({ ...s })));

  return getDemoComplianceResult(selection.productId);
}

export function getDemoSpecDocuments(): DocumentFile[] {
  return DEMO_SPEC_DOCS.map((d) => ({
    ...d,
    parseStatus: "pending" as const,
    uploadedAt: new Date().toISOString(),
  }));
}
