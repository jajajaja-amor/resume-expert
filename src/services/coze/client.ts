import { getCozeConfig } from "@/services/coze/config";
import { buildDemoCozeReview } from "@/services/coze/mock";
import { buildXuqiuText, parseCozeWorkflowData } from "@/services/coze/parse";
import {
  productPayloadToJsonFile,
  productPayloadToStructuredText,
} from "@/services/coze/selection-payload";
import type { CozeReviewRequest, CozeReviewResult } from "@/types/coze-review";

export class CozeWorkflowError extends Error {
  code?: string | number;
  retryable: boolean;
  debugUrl?: string;
  needsAuth?: boolean;
  authUrl?: string;

  constructor(
    message: string,
    options?: {
      code?: string | number;
      retryable?: boolean;
      debugUrl?: string;
      needsAuth?: boolean;
      authUrl?: string;
    }
  ) {
    super(message);
    this.name = "CozeWorkflowError";
    this.code = options?.code;
    this.retryable = options?.retryable ?? true;
    this.debugUrl = options?.debugUrl;
    this.needsAuth = options?.needsAuth;
    this.authUrl = options?.authUrl;
  }
}

async function uploadFileToCoze(params: {
  apiBase: string;
  pat: string;
  bytes: Buffer;
  fileName: string;
  mime?: string;
}): Promise<string> {
  const form = new FormData();
  const blob = new Blob([new Uint8Array(params.bytes)], {
    type: params.mime || "application/octet-stream",
  });
  form.append("file", blob, params.fileName);

  const response = await fetch(`${params.apiBase}/v1/files/upload`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${params.pat}`,
    },
    body: form,
  });

  const json = (await response.json()) as {
    code?: number;
    msg?: string;
    data?: { id?: string };
  };

  if (!response.ok || json.code !== 0 || !json.data?.id) {
    throw new CozeWorkflowError(
      json.msg || `结构化文件上传到扣子失败（HTTP ${response.status}）`,
      { code: json.code, retryable: true }
    );
  }

  return json.data.id;
}

function buildUploadFile(input: CozeReviewRequest): {
  bytes: Buffer;
  fileName: string;
  mime?: string;
} {
  if (input.productPayload) {
    const file = productPayloadToJsonFile(input.productPayload);
    return {
      bytes: file.bytes,
      fileName: file.fileName,
      mime: file.mime,
    };
  }

  if (input.contractFileBase64) {
    return {
      bytes: Buffer.from(input.contractFileBase64, "base64"),
      fileName: input.contractFileName || "payload.bin",
      mime: input.contractFileMime,
    };
  }

  const text =
    input.contractText?.trim() ||
    [
      `合同类型：${input.contractType || "采购合同"}`,
      `审查立场：${input.reviewStance || "甲方"}`,
      `重点审查内容：${input.focusContent || ""}`,
      `补充要求：${input.additionalRequirements || ""}`,
    ].join("\n");

  return {
    bytes: Buffer.from(text, "utf8"),
    fileName: input.contractFileName || "payload.txt",
    mime: "text/plain",
  };
}

/**
 * Call Coze workflow for product compliance review.
 * Workflow start inputs (discovered): xuqiu (text), wenjian (file)
 */
export async function runCozeContractReview(
  input: CozeReviewRequest
): Promise<{ result: CozeReviewResult; mode: "coze" | "demo" }> {
  const config = getCozeConfig();

  if (input.preferDemo || !config.configured) {
    return { result: buildDemoCozeReview(input), mode: "demo" };
  }

  if (!input.productPayload && !input.contractText?.trim() && !input.contractFileBase64) {
    throw new CozeWorkflowError("缺少产品比选结构化结果，请先完成产品比选。", {
      retryable: false,
    });
  }

  const file = buildUploadFile(input);
  const fileId = await uploadFileToCoze({
    apiBase: config.apiBase,
    pat: config.pat,
    bytes: file.bytes,
    fileName: file.fileName,
    mime: file.mime,
  });

  const xuqiu = buildXuqiuText({
    productPayload: input.productPayload,
    contractType: input.contractType,
    reviewStance: input.reviewStance,
    focusContent: input.focusContent,
    additionalRequirements:
      input.productPayload?.additionalRequirements || input.additionalRequirements,
    contractText: input.productPayload
      ? productPayloadToStructuredText(input.productPayload)
      : input.contractText,
  });

  const parameters = {
    xuqiu,
    wenjian: JSON.stringify({ file_id: fileId }),
  };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 280_000);

  try {
    const response = await fetch(`${config.apiBase}/v1/workflow/run`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.pat}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        workflow_id: config.workflowId,
        parameters,
      }),
      signal: controller.signal,
    });

    const json = (await response.json()) as {
      code?: number;
      msg?: string;
      data?: unknown;
      debug_url?: string;
      execute_id?: string;
      interrupt_data?: {
        type?: number;
        data?: string;
        event_id?: string;
      };
    };

    if (json.interrupt_data) {
      let pluginName = "第三方插件";
      let authUrl: string | undefined;
      try {
        const interruptPayload = JSON.parse(json.interrupt_data.data || "{}") as {
          plugin_name?: string;
          need_auth?: boolean;
          auth_info?: string;
        };
        if (interruptPayload.plugin_name) pluginName = interruptPayload.plugin_name;
        if (interruptPayload.auth_info?.startsWith("http")) {
          authUrl = interruptPayload.auth_info;
        }
      } catch {
        // ignore parse errors
      }

      throw new CozeWorkflowError(
        `扣子工作流已启动，但仍需要「${pluginName}」授权才能继续。请在扣子工作流的飞书节点选择「共享授权」并完成授权后重试；也可先查看演示结果（将使用飞书应用生成报告链接）。`,
        {
          code: json.interrupt_data.type,
          retryable: true,
          debugUrl: json.debug_url,
          needsAuth: true,
          authUrl,
        }
      );
    }

    if (!response.ok || json.code !== 0) {
      throw new CozeWorkflowError(
        json.msg || `扣子工作流调用失败（HTTP ${response.status}）`,
        {
          code: json.code,
          retryable: true,
          debugUrl: json.debug_url,
        }
      );
    }

    const result = parseCozeWorkflowData(json.data, {
      debugUrl: json.debug_url,
      executeId: json.execute_id,
    });

    return { result, mode: "coze" };
  } catch (error) {
    if (error instanceof CozeWorkflowError) throw error;
    if (error instanceof Error && error.name === "AbortError") {
      throw new CozeWorkflowError("扣子工作流调用超时，请稍后重试。", {
        retryable: true,
      });
    }
    throw new CozeWorkflowError(
      error instanceof Error ? error.message : "扣子工作流调用异常",
      { retryable: true }
    );
  } finally {
    clearTimeout(timeout);
  }
}
