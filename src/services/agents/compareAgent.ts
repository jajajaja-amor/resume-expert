import type { AgentStep, CompareAnalysisResult, DocumentFile } from "@/types/workspace";
import {
  getDemoProductDocuments,
  runCompareAnalysisMock,
} from "@/services/agents/compareAgent.mock";

export { getDemoProductDocuments };

/**
 * Client-facing compare agent.
 * Progressive Agent steps run via Mock Agent with the same structured I/O
 * expected by future remote Agents (Coze / OpenAI / custom backend).
 * Server route: POST /api/compare/analyze
 */
export async function runCompareAnalysis(
  docs: DocumentFile[],
  onStep?: (steps: AgentStep[]) => void
): Promise<CompareAnalysisResult> {
  return runCompareAnalysisMock(docs, onStep);
}

export async function fetchAIStatus() {
  try {
    const response = await fetch("/api/ai/status", { cache: "no-store" });
    if (!response.ok) return { mode: "mock" as const };
    return response.json() as Promise<{
      mode: "mock" | "llm";
      model?: string;
      provider?: string;
      reason?: "missing_api_key" | "forced";
    }>;
  } catch {
    return { mode: "mock" as const };
  }
}
