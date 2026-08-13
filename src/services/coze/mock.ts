import type { CozeReviewRequest, CozeReviewResult } from "@/types/coze-review";
import { uid } from "@/lib/utils";

export function buildDemoCozeReview(input: CozeReviewRequest): CozeReviewResult {
  return {
    source: "demo",
    demoLabel: "当前为演示结果",
    summary: `已按「${input.contractType} / ${input.reviewStance}」立场完成模拟审查（重点：${input.focusContent || "通用条款"}）。`,
    opinions: [
      {
        id: uid("op"),
        title: "付款周期偏长，资金占用风险高",
        problem: "合同约定验收后 60 日支付 90%，质保金一年后支付，对甲方资金安排不友好。",
        analysis:
          "在海外工程项目中，长账期叠加质保金将抬升综合采购成本，且未约定逾期付款利息上限与争议期间支付安排。",
        suggestion: "建议将主款支付周期调整为验收后 30 日，质保金比例降至 5%，并明确逾期利率与止付条件。",
        riskLevel: "high",
        clause: "付款条款",
      },
      {
        id: uid("op"),
        title: "防火合规义务表述不够刚性",
        problem: "合同仅写“须达到 A1 级”，未绑定具体标准文件与检测报告交付时点。",
        analysis:
          "缺少标准编号、第三方检测报告与资料缺失时的拒收/解约权，后续合规争议举证困难。",
        suggestion:
          "补充 EN 13501-1 或项目规范对应标准，并要求供货前提供近 3 年第三方报告，否则甲方可拒收。",
        riskLevel: "medium",
        clause: "技术与合规要求",
      },
      {
        id: uid("op"),
        title: "违约金条款单边性不足",
        problem: "仅约定逾期付款违约金，未对供货延误、认证资料缺失设置对等违约责任。",
        analysis: "审查立场为甲方时，应平衡供应履约风险，避免仅约束付款侧。",
        suggestion: "增加供货延误、关键认证缺失的阶梯违约金与限期补正机制。",
        riskLevel: "medium",
        clause: "违约责任",
      },
    ],
    legalCitations: [
      {
        id: uid("law"),
        citation: "《中华人民共和国民法典》第 577 条（违约责任）",
        status: "valid",
        detail: "引用方向正确，可用于支持逾期履约违约责任安排。",
      },
      {
        id: uid("law"),
        citation: "EN 13501-1 Reaction to Fire",
        status: "unverifiable",
        detail: "演示模式未联网核验标准文本有效版本，请人工确认项目适用版本。",
      },
    ],
    enterpriseChecks: [
      {
        id: uid("ent"),
        name: "LuminaCeil（合同相对方）",
        status: "unverifiable",
        detail: "演示模式未调用工商/企业核验接口，请人工核验营业执照与签约主体一致性。",
      },
      {
        id: uid("ent"),
        name: "某某酒店工程公司（合同相对方）",
        status: "unverifiable",
        detail: "演示模式无法完成企业存续与授权签字人核验。",
      },
    ],
    feishuReportUrl: undefined,
    rawText: undefined,
  };
}
