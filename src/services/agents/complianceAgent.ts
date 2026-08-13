import type {
  AgentStep,
  ComplianceAnalysisResult,
  DocumentFile,
  SelectionResult,
} from "@/types/workspace";
import {
  getDemoSpecDocuments,
  runComplianceAnalysisMock,
} from "@/services/agents/complianceAgent.mock";

export { getDemoSpecDocuments };

/**
 * Client-facing compliance agent.
 * Server route: POST /api/compliance/check
 */
export async function runComplianceAnalysis(
  selection: SelectionResult,
  docs: DocumentFile[],
  onStep?: (steps: AgentStep[]) => void
): Promise<ComplianceAnalysisResult> {
  return runComplianceAnalysisMock(selection, docs, onStep);
}
