import { NextResponse } from "next/server";

/**
 * Agent 状态接口（预留）。
 * 真实 Agent / 工作流接入时，在此读取服务端环境变量并转发请求，
 * API Key 永远不下发到前端。
 */
export async function GET() {
  const configured = Boolean(process.env.AGENT_API_KEY && process.env.AGENT_API_URL);
  const feishuConfigured = Boolean(process.env.FEISHU_APP_ID && process.env.FEISHU_APP_SECRET);
  return NextResponse.json({
    mode: configured ? "live" : "demo",
    feishu: feishuConfigured ? "configured" : "not-configured",
  });
}
