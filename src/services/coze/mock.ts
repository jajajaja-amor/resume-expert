import type { CozeReviewRequest, CozeReviewResult } from "@/types/coze-review";
import { uid } from "@/lib/utils";

export function buildDemoCozeReview(input: CozeReviewRequest): CozeReviewResult {
  const payload = input.productPayload;
  const company = payload?.companyName || "目标供应商";
  const productType = payload?.productType || "软膜天花";
  const cert = payload?.certificationReport || "认证资料";
  const unitPrice = payload?.unitPrice || "单价待确认";

  return {
    source: "demo",
    demoLabel: "当前为演示结果",
    summary: `已基于产品比选结构化结果完成模拟合规审查：${productType} / ${company}（单价 ${unitPrice}）。`,
    opinions: [
      {
        id: uid("op"),
        title: "第三方测试报告完整性不足",
        problem: "选型资料中未见近 3 年第三方防火/VOC 测试报告原件索引。",
        analysis:
          "海外公共区域天花材料通常要求可追溯的第三方检测报告；缺少报告将导致进场验收与当地消防备案风险。",
        suggestion: "要求供应商在合同附件中提交近 3 年第三方报告，并明确缺失时可拒收/解约。",
        riskLevel: "high",
        clause: "认证与测试资料",
      },
      {
        id: uid("op"),
        title: "认证报告与项目规范映射不完整",
        problem: `当前认证信息为「${cert}」，尚未逐条映射到项目规范检查项。`,
        analysis: "仅有认证名称不足以证明满足目标市场全部条款，需核对标准版本与适用范围。",
        suggestion: "补充认证-规范对照表，并标注适用标准编号、有效期与适用场所。",
        riskLevel: "medium",
        clause: "合规映射",
      },
      {
        id: uid("op"),
        title: "物流与总价口径待确认",
        problem: `单价为「${payload?.unitPrice || "未提供"}」，总价为「${payload?.totalPrice || "未提供"}」，物流服务描述仍偏概括。`,
        analysis: "海外项目需明确包装、海运/空运方案、保险与到场周期，否则无法锁定综合采购成本。",
        suggestion: "补充物流方案、保险责任与按项目面积核算的总价明细。",
        riskLevel: "medium",
        clause: "价格与物流",
      },
    ],
    legalCitations: [
      {
        id: uid("law"),
        citation: "EN 13501-1 Reaction to Fire",
        status: "unverifiable",
        detail: "演示模式未联网核验标准文本有效版本，请人工确认项目适用版本。",
      },
      {
        id: uid("law"),
        citation: "《中华人民共和国民法典》合同编相关违约责任条款",
        status: "valid",
        detail: "可用于支持资料缺失、延期交付等违约安排（演示判断）。",
      },
    ],
    enterpriseChecks: [
      {
        id: uid("ent"),
        name: company,
        status: "unverifiable",
        detail: "演示模式未调用工商/企查接口，请人工核验签约主体与授权签字人。",
      },
    ],
    feishuReportUrl: undefined,
    rawText: undefined,
  };
}
