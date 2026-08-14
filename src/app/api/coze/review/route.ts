import { NextResponse } from "next/server";
import { CozeWorkflowError, runCozeContractReview } from "@/services/coze/client";
import { buildDemoCozeReview } from "@/services/coze/mock";
import { maybeAttachFeishuReport } from "@/services/feishu/client";
import type { CozeReviewRequest, ProductCompliancePayload } from "@/types/coze-review";

export const runtime = "nodejs";
export const maxDuration = 300;

function asPayload(value: unknown): ProductCompliancePayload | undefined {
  if (!value || typeof value !== "object") return undefined;
  const obj = value as Record<string, unknown>;
  if (!obj.productType && !obj.companyName) return undefined;
  return {
    productType: String(obj.productType || ""),
    companyName: String(obj.companyName || ""),
    certificationReport: String(obj.certificationReport || ""),
    technicalMaterials: String(obj.technicalMaterials || ""),
    unitPrice: String(obj.unitPrice || ""),
    totalPrice: String(obj.totalPrice || ""),
    serviceLogistics: String(obj.serviceLogistics || ""),
    additionalRequirements: String(obj.additionalRequirements || ""),
    selectionSummary:
      obj.selectionSummary && typeof obj.selectionSummary === "object"
        ? (obj.selectionSummary as ProductCompliancePayload["selectionSummary"])
        : undefined,
  };
}

async function parseBody(request: Request): Promise<CozeReviewRequest> {
  const contentType = request.headers.get("content-type") || "";

  if (contentType.includes("multipart/form-data")) {
    const form = await request.formData();
    const rawPayload = form.get("productPayload");
    let productPayload: ProductCompliancePayload | undefined;
    if (typeof rawPayload === "string" && rawPayload.trim()) {
      try {
        productPayload = asPayload(JSON.parse(rawPayload));
      } catch {
        productPayload = undefined;
      }
    }

    return {
      productPayload,
      additionalRequirements: String(form.get("additionalRequirements") || ""),
      preferDemo: String(form.get("preferDemo") || "") === "true",
      contractText: String(form.get("contractText") || ""),
      contractType: String(form.get("contractType") || ""),
      reviewStance: String(form.get("reviewStance") || ""),
      focusContent: String(form.get("focusContent") || ""),
    };
  }

  const json = (await request.json()) as CozeReviewRequest;
  return {
    productPayload: asPayload(json.productPayload) || json.productPayload,
    additionalRequirements: json.additionalRequirements || "",
    preferDemo: Boolean(json.preferDemo),
    contractText: json.contractText || "",
    contractType: json.contractType,
    reviewStance: json.reviewStance,
    focusContent: json.focusContent,
    contractFileBase64: json.contractFileBase64,
    contractFileName: json.contractFileName,
    contractFileMime: json.contractFileMime,
  };
}

export async function POST(request: Request) {
  try {
    const body = await parseBody(request);

    if (
      !body.productPayload &&
      !body.contractText?.trim() &&
      !body.contractFileBase64
    ) {
      return NextResponse.json(
        { error: "缺少产品比选结构化结果，请先完成产品比选。" },
        { status: 400 }
      );
    }

    if (body.productPayload && body.additionalRequirements?.trim()) {
      body.productPayload = {
        ...body.productPayload,
        additionalRequirements: body.additionalRequirements.trim(),
      };
    }

    const { result, mode } = await runCozeContractReview(body);
    const withFeishu = await maybeAttachFeishuReport(result);
    return NextResponse.json({ result: withFeishu, mode });
  } catch (error) {
    if (error instanceof CozeWorkflowError) {
      return NextResponse.json(
        {
          error: error.message,
          code: error.code,
          retryable: error.retryable,
          needsAuth: error.needsAuth,
          debugUrl: error.debugUrl,
          authUrl: error.authUrl,
          feishuFallbackAvailable: true,
        },
        { status: 502 }
      );
    }

    const message = error instanceof Error ? error.message : "扣子工作流调用失败";
    return NextResponse.json({ error: message, retryable: true }, { status: 500 });
  }
}

/** Demo fallback helper used by UI when Coze fails and user chooses demo */
export async function PUT(request: Request) {
  try {
    const body = (await request.json()) as CozeReviewRequest;
    const result = buildDemoCozeReview(body);
    const withFeishu = await maybeAttachFeishuReport(result);
    return NextResponse.json({ result: withFeishu, mode: "demo" as const });
  } catch (error) {
    const message = error instanceof Error ? error.message : "演示结果生成失败";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
