import type { ProductCompliancePayload } from "@/types/coze-review";
import type { SelectionResult } from "@/types/workspace";

function paramValue(
  selection: SelectionResult,
  labels: string[],
  fallback = "未提供"
): string {
  const found = selection.coreParameters.find((p) =>
    labels.some((label) => p.label.includes(label))
  );
  return found?.value?.trim() || fallback;
}

function dimensionBlurb(selection: SelectionResult, key: string): string {
  const dim = selection.dimensions.find((d) => d.dimension === key);
  if (!dim) return "";
  const reasons = dim.reasons.map((r) => r.text).join("；");
  return `${dim.label} ${dim.score}/100${reasons ? `（${reasons}）` : ""}`;
}

/**
 * Map stage-1 SelectionResult into the structured fields required by Coze compliance review.
 */
export function selectionToProductPayload(
  selection: SelectionResult,
  additionalRequirements = ""
): ProductCompliancePayload {
  const unitPrice = paramValue(selection, ["单价", "价格"], "未提供");
  const fire = paramValue(selection, ["防火"], "未提供");
  const material = paramValue(selection, ["材质"], "未提供");
  const width = paramValue(selection, ["幅宽"], "未提供");
  const weight = paramValue(selection, ["重量"], "未提供");
  const cert = paramValue(selection, ["认证"], "未提供");

  const technicalMaterials = [
    `产品：${selection.productName}`,
    `型号：${selection.model}`,
    `防火等级：${fire}`,
    `材质：${material}`,
    `幅宽：${width}`,
    `重量：${weight}`,
    `来源文件：${selection.sourceDocuments.join("、") || "未提供"}`,
    `产品优势：${selection.advantages.join("；") || "无"}`,
    `潜在风险：${selection.risks.join("；") || "无"}`,
  ].join("\n");

  const serviceLogistics = [
    dimensionBlurb(selection, "weight"),
    dimensionBlurb(selection, "supply"),
    weight !== "未提供" ? `运输重量参考：${weight}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  const pending = [...selection.pendingItems, selection.humanNotes || ""]
    .filter(Boolean)
    .join("；");

  return {
    productType: selection.productName || "软膜天花 / 建筑装饰材料",
    companyName: selection.supplierName,
    certificationReport: cert,
    technicalMaterials,
    unitPrice,
    totalPrice: "待项目面积确认后核算（单价已提供）",
    serviceLogistics: serviceLogistics || "待补充物流与交付方案",
    additionalRequirements:
      additionalRequirements.trim() ||
      pending ||
      "请结合海外工程项目规范完成合规审查，并输出审查意见、法律引用核验、企业信息核验与飞书报告。",
    selectionSummary: {
      projectName: selection.projectName,
      productName: selection.productName,
      model: selection.model,
      overallScore: selection.overallScore,
      sourceDocuments: selection.sourceDocuments,
    },
  };
}

export function productPayloadToStructuredText(payload: ProductCompliancePayload): string {
  return [
    "# 产品比选结构化结果（阶段一输出 / 阶段二输入）",
    "",
    `产品类型：${payload.productType}`,
    `公司名称：${payload.companyName}`,
    `认证报告：${payload.certificationReport}`,
    `软膜天花技术性资料：`,
    payload.technicalMaterials,
    "",
    `单价：${payload.unitPrice}`,
    `总价：${payload.totalPrice}`,
    `服务物流：`,
    payload.serviceLogistics,
    "",
    `补充要求：${payload.additionalRequirements}`,
    "",
    payload.selectionSummary
      ? [
          "## 选型摘要",
          `项目：${payload.selectionSummary.projectName || "—"}`,
          `产品：${payload.selectionSummary.productName || "—"}`,
          `型号：${payload.selectionSummary.model || "—"}`,
          `综合评分：${payload.selectionSummary.overallScore ?? "—"}`,
          `来源文件：${(payload.selectionSummary.sourceDocuments || []).join("、") || "—"}`,
        ].join("\n")
      : "",
  ]
    .filter(Boolean)
    .join("\n");
}

export function productPayloadToJsonFile(payload: ProductCompliancePayload): {
  fileName: string;
  mime: string;
  bytes: Buffer;
  text: string;
} {
  const text = JSON.stringify(payload, null, 2);
  return {
    fileName: `selection-result-${Date.now()}.json`,
    mime: "application/json",
    bytes: Buffer.from(text, "utf8"),
    text,
  };
}
