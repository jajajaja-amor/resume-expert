import type {
  CozeReviewRequest,
  CozeReviewResult,
  CozeStatusResponse,
  ProductCompliancePayload,
} from "@/types/coze-review";

export async function fetchCozeStatus(): Promise<CozeStatusResponse> {
  try {
    const response = await fetch("/api/coze/status", { cache: "no-store" });
    const contentType = response.headers.get("content-type") || "";
    if (!response.ok || !contentType.includes("application/json")) {
      return {
        configured: false,
        workflowConfigured: false,
        mode: "demo",
        reason: "status_unavailable",
      };
    }
    return response.json();
  } catch {
    return {
      configured: false,
      workflowConfigured: false,
      mode: "demo",
      reason: "status_unavailable",
    };
  }
}

export type CozeReviewApiResponse =
  | { ok: true; result: CozeReviewResult; mode: "coze" | "demo" }
  | {
      ok: false;
      error: string;
      retryable?: boolean;
      needsAuth?: boolean;
      debugUrl?: string;
      authUrl?: string;
    };

export async function submitCozeReview(input: {
  productPayload: ProductCompliancePayload;
  additionalRequirements?: string;
  preferDemo?: boolean;
}): Promise<CozeReviewApiResponse> {
  let response: Response;
  try {
    response = await fetch("/api/coze/review", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        productPayload: input.productPayload,
        additionalRequirements: input.additionalRequirements || "",
        preferDemo: Boolean(input.preferDemo),
      } satisfies CozeReviewRequest),
    });
  } catch {
    return {
      ok: false,
      error: "网络请求失败，请检查服务是否运行后重试。",
      retryable: true,
    };
  }

  const contentType = response.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) {
    return {
      ok: false,
      error: `服务异常（HTTP ${response.status}），请刷新页面后重试。`,
      retryable: true,
    };
  }

  const data = (await response.json().catch(() => ({}))) as {
    result?: CozeReviewResult;
    mode?: "coze" | "demo";
    error?: string;
    retryable?: boolean;
    needsAuth?: boolean;
    debugUrl?: string;
    authUrl?: string;
  };

  if (!response.ok || !data.result) {
    return {
      ok: false,
      error: data.error || `提交失败（${response.status}）`,
      retryable: data.retryable ?? true,
      needsAuth: data.needsAuth,
      debugUrl: data.debugUrl,
      authUrl: data.authUrl,
    };
  }

  return { ok: true, result: data.result, mode: data.mode || "demo" };
}

export async function fetchDemoCozeReview(
  input: CozeReviewRequest
): Promise<CozeReviewResult> {
  const response = await fetch("/api/coze/review", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const data = (await response.json()) as { result?: CozeReviewResult; error?: string };
  if (!response.ok || !data.result) {
    throw new Error(data.error || "演示结果生成失败");
  }
  return data.result;
}
