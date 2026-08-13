import { getAIConfig } from "@/lib/ai/config";
import type { AgentStep, CompareAnalysisResult, DocumentFile } from "@/types/workspace";
import { runCompareAnalysisMock } from "@/services/agents/compareAgent.mock";

/**
 * Server-side compare agent entry.
 * Currently returns structured Mock Agent output.
 * When LLM_API_KEY is configured, this is the swap point for real Document Parser /
 * Parameter Extractor / Scoring Agent orchestration (Coze / OpenAI / custom backend).
 */
export async function runCompareAnalysisServer(
  docs: DocumentFile[],
  onStep?: (steps: AgentStep[]) => void
): Promise<{ result: CompareAnalysisResult; mode: "mock" | "llm" }> {
  const config = getAIConfig();

  // Real LLM orchestration is reserved here. Without a dedicated product-compliance
  // prompt pipeline, we keep deterministic Demo/Mock structured output so the
  // end-to-end workspace remains demonstrable and evidence-traceable.
  const result = await runCompareAnalysisMock(docs, onStep);
  return {
    result: {
      ...result,
      demoMode: config.mode === "mock" ? true : result.demoMode,
    },
    mode: config.mode,
  };
}
