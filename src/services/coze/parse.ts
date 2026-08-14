import type {
  CozeEnterpriseCheck,
  CozeLegalCitationCheck,
  CozeReviewOpinion,
  CozeReviewResult,
} from "@/types/coze-review";
import { uid } from "@/lib/utils";

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function pickString(obj: Record<string, unknown>, keys: string[]): string {
  for (const key of keys) {
    const v = obj[key];
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return "";
}

function parseOpinion(item: unknown, index: number): CozeReviewOpinion {
  if (typeof item === "string") {
    return {
      id: uid("op"),
      title: `审查意见 ${index + 1}`,
      problem: item,
      analysis: "",
      suggestion: "",
    };
  }
  const obj = (item && typeof item === "object" ? item : {}) as Record<string, unknown>;
  return {
    id: uid("op"),
    title:
      pickString(obj, ["title", "标题", "name", "意见标题", "clause_title"]) ||
      `审查意见 ${index + 1}`,
    problem: pickString(obj, ["problem", "问题", "issue", "risk", "风险点", "description"]),
    analysis: pickString(obj, ["analysis", "分析", "reason", "说明"]),
    suggestion: pickString(obj, ["suggestion", "修改建议", "建议", "recommendation", "fix"]),
    clause: pickString(obj, ["clause", "条款", "section"]) || undefined,
    riskLevel: (() => {
      const raw = pickString(obj, ["riskLevel", "risk", "风险等级"]).toLowerCase();
      if (raw.includes("high") || raw.includes("高")) return "high";
      if (raw.includes("low") || raw.includes("低")) return "low";
      if (raw.includes("medium") || raw.includes("中")) return "medium";
      return undefined;
    })(),
  };
}

function parseLegal(item: unknown, index: number): CozeLegalCitationCheck {
  if (typeof item === "string") {
    return {
      id: uid("law"),
      citation: item,
      status: "unverifiable",
      detail: "",
    };
  }
  const obj = (item && typeof item === "object" ? item : {}) as Record<string, unknown>;
  const statusRaw = pickString(obj, ["status", "结果", "核验结果"]).toLowerCase();
  let status: CozeLegalCitationCheck["status"] = "unverifiable";
  if (statusRaw.includes("valid") || statusRaw.includes("通过") || statusRaw.includes("正确"))
    status = "valid";
  else if (statusRaw.includes("invalid") || statusRaw.includes("错误") || statusRaw.includes("不成立"))
    status = "invalid";
  else if (statusRaw.includes("missing") || statusRaw.includes("缺失")) status = "missing";

  return {
    id: uid("law"),
    citation:
      pickString(obj, ["citation", "法律引用", "law", "reference", "条文"]) ||
      `法律引用 ${index + 1}`,
    status,
    detail: pickString(obj, ["detail", "说明", "analysis", "核验说明"]),
  };
}

function parseEnterprise(item: unknown, index: number): CozeEnterpriseCheck {
  if (typeof item === "string") {
    return {
      id: uid("ent"),
      name: item,
      status: "unverifiable",
      detail: "",
    };
  }
  const obj = (item && typeof item === "object" ? item : {}) as Record<string, unknown>;
  const statusRaw = pickString(obj, ["status", "结果", "核验结果"]).toLowerCase();
  let status: CozeEnterpriseCheck["status"] = "unverifiable";
  if (statusRaw.includes("match") || statusRaw.includes("一致") || statusRaw.includes("通过"))
    status = "matched";
  else if (statusRaw.includes("mismatch") || statusRaw.includes("不一致")) status = "mismatch";
  else if (statusRaw.includes("not_found") || statusRaw.includes("未找到") || statusRaw.includes("不存在"))
    status = "not_found";

  return {
    id: uid("ent"),
    name: pickString(obj, ["name", "企业名称", "company", "主体"]) || `企业 ${index + 1}`,
    status,
    detail: pickString(obj, ["detail", "说明", "核验说明", "analysis"]),
  };
}

function extractFeishuUrl(text: string): string | undefined {
  const match = text.match(/https?:\/\/[\w.-]*feishu\.cn\/[^\s"'<>]+/i);
  return match?.[0];
}

function tryParseJson(text: string): unknown {
  const trimmed = text.trim();
  if (!trimmed) return null;
  try {
    return JSON.parse(trimmed);
  } catch {
    // try fenced json
    const fence = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
    if (fence) {
      try {
        return JSON.parse(fence[1]);
      } catch {
        return null;
      }
    }
    // try first {...}
    const start = trimmed.indexOf("{");
    const end = trimmed.lastIndexOf("}");
    if (start >= 0 && end > start) {
      try {
        return JSON.parse(trimmed.slice(start, end + 1));
      } catch {
        return null;
      }
    }
    return null;
  }
}

export function parseCozeWorkflowData(
  data: unknown,
  meta?: { debugUrl?: string; executeId?: string }
): CozeReviewResult {
  let rawText = "";
  let root: Record<string, unknown> = {};

  if (typeof data === "string") {
    rawText = data;
    const parsed = tryParseJson(data);
    if (parsed && typeof parsed === "object") root = parsed as Record<string, unknown>;
  } else if (data && typeof data === "object") {
    root = data as Record<string, unknown>;
    rawText = JSON.stringify(data, null, 2);
  }

  // Common nesting: { output: {...} } / { data: {...} } / { result: {...} }
  const nestedKeys = ["output", "data", "result", "review", "审查结果", "output_data"];
  for (const key of nestedKeys) {
    const value = root[key];
    if (typeof value === "string") {
      const parsed = tryParseJson(value);
      if (parsed && typeof parsed === "object") {
        root = { ...root, ...(parsed as Record<string, unknown>) };
        rawText = rawText || value;
      }
    } else if (value && typeof value === "object") {
      root = { ...root, ...(value as Record<string, unknown>) };
    }
  }

  const opinionsRaw =
    root.opinions ||
    root.review_opinions ||
    root.issues ||
    root["审查意见"] ||
    root["审查意见列表"] ||
    root.suggestions;

  const legalRaw =
    root.legalCitations ||
    root.legal_citations ||
    root.law_checks ||
    root["法律引用"] ||
    root["法律引用核验"] ||
    root["法律引用核验结果"];

  const enterpriseRaw =
    root.enterpriseChecks ||
    root.enterprise_checks ||
    root.company_checks ||
    root["企业信息"] ||
    root["企业信息核验"] ||
    root["企业信息核验结果"];

  const opinions = asArray(opinionsRaw).map(parseOpinion);
  const legalCitations = asArray(legalRaw).map(parseLegal);
  const enterpriseChecks = asArray(enterpriseRaw).map(parseEnterprise);

  // If model returned plain text only, surface as one opinion
  if (opinions.length === 0 && rawText && rawText !== "undefined") {
    opinions.push({
      id: uid("op"),
      title: "工作流返回结果",
      problem: rawText.slice(0, 2000),
      analysis: "扣子工作流未返回结构化审查意见字段，已展示原始输出供人工阅读。",
      suggestion: "可在扣子结束节点将输出整理为 opinions / legalCitations / enterpriseChecks / feishuReportUrl。",
    });
  }

  const feishuReportUrl =
    pickString(root, [
      "feishuReportUrl",
      "feishu_url",
      "feishu_doc_url",
      "report_url",
      "飞书报告",
      "飞书完整审查报告地址",
      "飞书文档",
    ]) || extractFeishuUrl(rawText);

  return {
    source: "coze",
    summary: pickString(root, ["summary", "摘要", "总评", "overview"]) || undefined,
    opinions,
    legalCitations,
    enterpriseChecks,
    feishuReportUrl: feishuReportUrl || undefined,
    rawText: rawText || undefined,
    debugUrl: meta?.debugUrl,
    executeId: meta?.executeId,
  };
}

export function buildXuqiuText(input: {
  productPayload?: import("@/types/coze-review").ProductCompliancePayload;
  contractType?: string;
  reviewStance?: string;
  focusContent?: string;
  additionalRequirements?: string;
  contractText?: string;
}): string {
  if (input.productPayload) {
    const p = input.productPayload;
    return [
      "请基于以下产品比选结构化结果，完成海外工程产品合规审查。",
      "",
      `产品类型：${p.productType}`,
      `公司名称：${p.companyName}`,
      `认证报告：${p.certificationReport}`,
      `单价：${p.unitPrice}`,
      `总价：${p.totalPrice}`,
      `服务物流：${p.serviceLogistics}`,
      `补充要求：${p.additionalRequirements}`,
      "",
      "软膜天花技术性资料已附在结构化文件（wenjian）中。",
      "",
      "请输出：",
      "1) 审查意见列表（每条含问题、分析、修改建议）",
      "2) 法律引用核验结果",
      "3) 企业信息核验结果",
      "4) 飞书完整审查报告地址（如已生成）",
    ].join("\n");
  }

  const lines = [
    `合同类型：${input.contractType || "采购合同"}`,
    `审查立场：${input.reviewStance || "甲方"}`,
    `重点审查内容：${input.focusContent || "通用条款与合规风险"}`,
    `补充要求：${input.additionalRequirements || "无"}`,
    "",
    "请输出：",
    "1) 审查意见列表（每条含问题、分析、修改建议）",
    "2) 法律引用核验结果",
    "3) 企业信息核验结果",
    "4) 飞书完整审查报告地址（如已生成）",
  ];
  if (input.contractText?.trim()) {
    lines.push("", "【合同文本补充】", input.contractText.trim());
  }
  return lines.join("\n");
}
