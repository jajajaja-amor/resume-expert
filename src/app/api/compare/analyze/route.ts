import { NextResponse } from "next/server";
import { runCompareAnalysisServer } from "@/services/agents/compareAgent.server";
import type { DocumentFile } from "@/types/workspace";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { documents?: DocumentFile[] };
    const documents = body.documents ?? [];
    const { result, mode } = await runCompareAnalysisServer(documents);
    return NextResponse.json({ result, mode });
  } catch (error) {
    const message = error instanceof Error ? error.message : "产品比选分析失败";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
