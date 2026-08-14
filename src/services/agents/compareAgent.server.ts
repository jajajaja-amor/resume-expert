import { getAIConfig } from "@/lib/ai/config";
import type { AgentStep, CompareAnalysisResult } from "@/types/workspace";
import {
  runComparePipeline,
  type AnalyzeDocumentInput,
} from "@/services/compare/pipeline";

/**
 * Server-side compare agent entry used by API / tests.
 */
export async function runCompareAnalysisServer(
  docs: AnalyzeDocumentInput[],
  onStep?: (steps: AgentStep[]) => void
): Promise<{ result: CompareAnalysisResult; mode: "mock" | "llm" }> {
  const config = getAIConfig();
  const explicitDemo = docs.some(
    (d) => (d as AnalyzeDocumentInput & { demoSource?: boolean }).demoSource
  );
  const result = await runComparePipeline(docs, {
    onStep,
    demoMode: explicitDemo,
  });
  return { result: { ...result, demoMode: explicitDemo }, mode: config.mode };
}
