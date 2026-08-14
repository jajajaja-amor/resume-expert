import { NextResponse } from "next/server";
import { runComparePipeline } from "@/services/compare/pipeline";
import { getAIConfig } from "@/lib/ai/config";
import type { DocumentFile } from "@/types/workspace";

export const runtime = "nodejs";
export const maxDuration = 300;

type AnalyzeDoc = DocumentFile & {
  textContent?: string;
  demoSource?: boolean;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { documents?: AnalyzeDoc[] };
    const documents = body.documents ?? [];
    if (!documents.length) {
      return NextResponse.json({ error: "请先上传至少一份产品资料。" }, { status: 400 });
    }

    const config = getAIConfig();
    const explicitDemo = documents.some((d) => d.demoSource);
    const result = await runComparePipeline(documents, {
      demoMode: explicitDemo,
    });

    return NextResponse.json({
      result: { ...result, demoMode: explicitDemo },
      mode: config.mode,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "产品比选分析失败";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
