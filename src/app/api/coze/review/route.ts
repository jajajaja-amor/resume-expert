import { NextResponse } from "next/server";
import { CozeWorkflowError, runCozeContractReview } from "@/services/coze/client";
import { buildDemoCozeReview } from "@/services/coze/mock";
import type { CozeReviewRequest } from "@/types/coze-review";

export const runtime = "nodejs";
export const maxDuration = 300;

async function parseBody(request: Request): Promise<CozeReviewRequest> {
  const contentType = request.headers.get("content-type") || "";

  if (contentType.includes("multipart/form-data")) {
    const form = await request.formData();
    const file = form.get("file");
    let contractFileBase64: string | undefined;
    let contractFileName: string | undefined;
    let contractFileMime: string | undefined;

    if (file && typeof file === "object" && "arrayBuffer" in file) {
      const blob = file as Blob & { name?: string; type?: string };
      const buf = Buffer.from(await blob.arrayBuffer());
      if (buf.byteLength > 0) {
        contractFileBase64 = buf.toString("base64");
        contractFileName =
          (typeof file === "object" && "name" in file && typeof file.name === "string"
            ? file.name
            : undefined) || "contract.bin";
        contractFileMime = blob.type || undefined;
      }
    }

    return {
      contractText: String(form.get("contractText") || ""),
      contractType: String(form.get("contractType") || "采购合同"),
      reviewStance: String(form.get("reviewStance") || "甲方"),
      focusContent: String(form.get("focusContent") || ""),
      additionalRequirements: String(form.get("additionalRequirements") || ""),
      preferDemo: String(form.get("preferDemo") || "") === "true",
      contractFileBase64,
      contractFileName,
      contractFileMime,
    };
  }

  const json = (await request.json()) as CozeReviewRequest;
  return {
    contractText: json.contractText || "",
    contractType: json.contractType || "采购合同",
    reviewStance: json.reviewStance || "甲方",
    focusContent: json.focusContent || "",
    additionalRequirements: json.additionalRequirements || "",
    preferDemo: Boolean(json.preferDemo),
    contractFileBase64: json.contractFileBase64,
    contractFileName: json.contractFileName,
    contractFileMime: json.contractFileMime,
  };
}

export async function POST(request: Request) {
  try {
    const body = await parseBody(request);

    if (!body.contractText?.trim() && !body.contractFileBase64) {
      return NextResponse.json(
        { error: "请上传合同文件或填写合同文本。" },
        { status: 400 }
      );
    }

    const { result, mode } = await runCozeContractReview(body);
    return NextResponse.json({ result, mode });
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
    const result = buildDemoCozeReview({
      contractType: body.contractType || "采购合同",
      reviewStance: body.reviewStance || "甲方",
      focusContent: body.focusContent || "",
      additionalRequirements: body.additionalRequirements || "",
      contractText: body.contractText || "",
    });
    return NextResponse.json({ result, mode: "demo" as const });
  } catch (error) {
    const message = error instanceof Error ? error.message : "演示结果生成失败";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
