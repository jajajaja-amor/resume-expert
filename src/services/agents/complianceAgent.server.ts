import { getAIConfig } from "@/lib/ai/config";
import type {
  AgentStep,
  ComplianceAnalysisResult,
  DocumentFile,
  SelectionResult,
} from "@/types/workspace";
import { runComplianceAnalysisMock } from "@/services/agents/complianceAgent.mock";

/**
 * Server-side compliance agent entry.
 * Swap point for Specification Parser → Checklist Generator → Compliance Checker.
 */
export async function runComplianceAnalysisServer(
  selection: SelectionResult,
  docs: DocumentFile[],
  onStep?: (steps: AgentStep[]) => void
): Promise<{ result: ComplianceAnalysisResult; mode: "mock" | "llm" }> {
  const config = getAIConfig();
  const result = await runComplianceAnalysisMock(selection, docs, onStep);
  return {
    result: {
      ...result,
      demoMode: config.mode === "mock" ? true : result.demoMode,
    },
    mode: config.mode,
  };
}
