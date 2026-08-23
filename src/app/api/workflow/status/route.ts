import { NextResponse } from "next/server";

export async function GET() {
  const configured = Boolean(process.env.COZE_WORKFLOW_ID && process.env.COZE_PAT);
  return NextResponse.json({ status: configured ? "已连接" : "未配置" });
}
