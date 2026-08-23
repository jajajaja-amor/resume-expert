import { NextRequest, NextResponse } from "next/server";

const COZE_ENDPOINT = "https://api.coze.cn/v1/workflow/run";

function classify(text: string) {
  const lower = text.toLowerCase();
  if (lower.includes("追问") || lower.includes("补充") || lower.includes("需要确认")) return "needs_info";
  if (lower.includes("风险") || lower.includes("敏感") || lower.includes("违规")) return "risk";
  return "done";
}

export async function POST(request: NextRequest) {
  const workflowId = process.env.COZE_WORKFLOW_ID;
  const token = process.env.COZE_PAT;
  if (!workflowId || !token) return NextResponse.json({ message: "工作流尚未完成安全配置，请打开连接设置检查后重试。" }, { status: 503 });
  const payload = await request.json();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 60000);
  try {
    const response = await fetch(COZE_ENDPOINT, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ workflow_id: workflowId, parameters: { task_type: payload.taskType, task: payload.input, project: payload.project } }),
      signal: controller.signal,
    });
    const data = await response.json().catch(() => null);
    if (!response.ok) {
      const message = response.status === 401 || response.status === 403 ? "无权使用该工作流，请检查连接信息。" : response.status === 404 ? "未找到该工作流，请检查工作流 ID。" : "工作流暂时无法使用，请稍后重试。";
      return NextResponse.json({ message }, { status: response.status });
    }
    const raw = data?.data ?? data;
    const text = typeof raw === "string" ? raw : raw?.output ?? raw?.content ?? raw?.result ?? "";
    return NextResponse.json({ kind: classify(String(text)), body: String(text), evidence: raw?.evidence });
  } catch (error) {
    const message = error instanceof Error && error.name === "AbortError" ? "等待时间过长，请稍后重试或检查工作流。" : "连接失败，请检查连接设置后重试。";
    return NextResponse.json({ message }, { status: 502 });
  } finally { clearTimeout(timer); }
}
