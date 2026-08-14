import type { AgentStep, CompareAnalysisResult } from "@/types/workspace";
import { getDemoProductDocuments, type DemoDocument } from "@/data/demo/product-documents";

export { getDemoProductDocuments };
export type AnalyzeDocPayload = DemoDocument;

/**
 * Client-facing compare agent — always calls server pipeline with file text.
 */
export async function runCompareAnalysis(
  docs: AnalyzeDocPayload[],
  onStep?: (steps: AgentStep[]) => void
): Promise<CompareAnalysisResult> {
  if (onStep) {
    onStep([
      { id: "upload", label: "文件已上传", status: "done" },
      { id: "parse", label: "正在解析供应商资料", status: "processing" },
      { id: "extract", label: "正在提取产品参数", status: "pending" },
      { id: "certs", label: "正在识别认证和企业信息", status: "pending" },
      { id: "normalize", label: "正在统一参数单位", status: "pending" },
      { id: "compare", label: "正在进行产品横向比较", status: "pending" },
      { id: "score", label: "正在计算六维评分", status: "pending" },
    ]);
  }

  const response = await fetch("/api/compare/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      documents: docs.map((d) => ({
        id: d.id,
        name: d.name,
        type: d.type,
        size: d.size,
        category: d.category,
        parseStatus: d.parseStatus,
        supplierName: d.supplierName,
        productLabel: d.productLabel,
        textContent: d.textContent || "",
        uploadedAt: d.uploadedAt,
        demoSource: d.demoSource,
        errorMessage: d.errorMessage,
      })),
    }),
  });

  const data = (await response.json()) as {
    result?: CompareAnalysisResult;
    error?: string;
    mode?: string;
  };

  if (!response.ok || !data.result) {
    throw new Error(data.error || `产品比选分析失败（HTTP ${response.status}）`);
  }

  if (onStep) {
    onStep(
      [
        "文件已上传",
        "正在解析供应商资料",
        "正在提取产品参数",
        "正在识别认证和企业信息",
        "正在统一参数单位",
        "正在进行产品横向比较",
        "正在计算六维评分",
      ].map((label, i) => ({
        id: `step-${i}`,
        label,
        status: "done" as const,
      }))
    );
  }

  return data.result;
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
