import { NextResponse } from "next/server";
import { runComplianceAnalysisServer } from "@/services/agents/complianceAgent.server";
import type { DocumentFile, SelectionResult } from "@/types/workspace";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      selection?: SelectionResult;
      documents?: DocumentFile[];
    };
    if (!body.selection) {
      return NextResponse.json({ error: "缺少 SelectionResult" }, { status: 400 });
    }
    const { result, mode } = await runComplianceAnalysisServer(
      body.selection,
      body.documents ?? []
    );
    return NextResponse.json({ result, mode });
  } catch (error) {
    const message = error instanceof Error ? error.message : "合规审核分析失败";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
