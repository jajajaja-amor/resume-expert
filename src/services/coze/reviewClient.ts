import type {
  CozeReviewRequest,
  CozeReviewResult,
  CozeStatusResponse,
} from "@/types/coze-review";

export async function fetchCozeStatus(): Promise<CozeStatusResponse> {
  try {
    const response = await fetch("/api/coze/status", { cache: "no-store" });
    if (!response.ok) {
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
    };

export async function submitCozeReview(input: {
  contractText: string;
  contractType: string;
  reviewStance: string;
  focusContent: string;
  additionalRequirements: string;
  file?: File | null;
  preferDemo?: boolean;
}): Promise<CozeReviewApiResponse> {
  const form = new FormData();
  form.set("contractText", input.contractText);
  form.set("contractType", input.contractType);
  form.set("reviewStance", input.reviewStance);
  form.set("focusContent", input.focusContent);
  form.set("additionalRequirements", input.additionalRequirements);
  form.set("preferDemo", input.preferDemo ? "true" : "false");
  if (input.file) form.set("file", input.file);

  const response = await fetch("/api/coze/review", {
    method: "POST",
    body: form,
  });

  const data = (await response.json().catch(() => ({}))) as {
    result?: CozeReviewResult;
    mode?: "coze" | "demo";
    error?: string;
    retryable?: boolean;
    needsAuth?: boolean;
    debugUrl?: string;
  };

  if (!response.ok || !data.result) {
    return {
      ok: false,
      error: data.error || `提交失败（${response.status}）`,
      retryable: data.retryable ?? true,
      needsAuth: data.needsAuth,
      debugUrl: data.debugUrl,
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
