import type {
  ComparisonMetric,
  DimensionScore,
  Evidence,
  ProductScore,
  ScoreDimension,
} from "@/types/workspace";
import { MISSING_VALUE, type CompareFieldKey } from "@/services/compare/fields";
import type { NormalizeResult } from "@/services/compare/normalize";

export interface ProductScoreInput {
  productId: string;
  supplierId: string;
  supplierName: string;
  productName: string;
  model: string;
  values: Partial<Record<CompareFieldKey, { raw: string; normalized: NormalizeResult; evidence: Evidence[] }>>;
}

function clamp(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n)));
}

function hasValue(raw?: string): boolean {
  return Boolean(raw && raw !== MISSING_VALUE);
}

function fireScore(raw?: string): { score: number; reason: DimensionScore["reasons"][number] } {
  if (!hasValue(raw)) {
    return { score: 35, reason: { type: "warning", text: "资料未提供防火等级，合规维度降权" } };
  }
  const v = raw!.toUpperCase();
  if (/\bA1\b/.test(v)) return { score: 96, reason: { type: "positive", text: `防火等级 ${raw}` } };
  if (/A2/.test(v)) return { score: 90, reason: { type: "positive", text: `防火等级 ${raw}` } };
  if (/B1/.test(v)) return { score: 62, reason: { type: "warning", text: `防火等级 ${raw}，公共区域可能不足` } };
  if (/B2/.test(v)) return { score: 40, reason: { type: "negative", text: `防火等级 ${raw} 风险较高` } };
  return { score: 70, reason: { type: "warning", text: `已记录防火信息：${raw}` } };
}

/**
 * Score products only from extracted/normalized fields.
 * Missing evidence lowers confidence and score — never invents attributes.
 */
export function scoreProducts(inputs: ProductScoreInput[]): {
  scores: ProductScore[];
  comparisons: ComparisonMetric[];
} {
  const priceNums = inputs
    .map((p) => ({
      id: p.productId,
      n: p.values.unit_price?.normalized.normalizedValue,
    }))
    .filter((x): x is { id: string; n: number } => typeof x.n === "number");

  const minPrice = priceNums.length ? Math.min(...priceNums.map((x) => x.n)) : null;
  const maxPrice = priceNums.length ? Math.max(...priceNums.map((x) => x.n)) : null;

  const weightNums = inputs
    .map((p) => ({
      id: p.productId,
      n: p.values.weight?.normalized.normalizedValue,
    }))
    .filter((x): x is { id: string; n: number } => typeof x.n === "number");
  const minW = weightNums.length ? Math.min(...weightNums.map((x) => x.n)) : null;
  const maxW = weightNums.length ? Math.max(...weightNums.map((x) => x.n)) : null;

  const scores: ProductScore[] = inputs.map((p) => {
    const v = p.values;
    const dims: DimensionScore[] = [];

    // 01 价格 — lower better
    {
      const reasons: DimensionScore["reasons"] = [];
      const evidence = v.unit_price?.evidence ?? [];
      let score = 40;
      const num = v.unit_price?.normalized.normalizedValue;
      if (typeof num === "number" && minPrice != null && maxPrice != null) {
        if (maxPrice === minPrice) score = 85;
        else score = 100 - ((num - minPrice) / (maxPrice - minPrice)) * 45;
        reasons.push({
          type: num <= minPrice ? "positive" : "warning",
          text: `归一化单价 ${v.unit_price?.normalized.display}`,
        });
      } else {
        reasons.push({ type: "warning", text: "资料未提供可比较单价" });
        score = 35;
      }
      dims.push({
        dimension: "price",
        label: "价格",
        score: clamp(score),
        maxScore: 100,
        reasons,
        evidence,
        confidence: typeof num === "number" ? 80 : 40,
        editable: true,
      });
    }

    // 02 合规性
    {
      const reasons: DimensionScore["reasons"] = [];
      const evidence = [
        ...(v.fire_rating?.evidence ?? []),
        ...(v.certification?.evidence ?? []),
        ...(v.voc?.evidence ?? []),
      ];
      let score = 30;
      const fire = fireScore(v.fire_rating?.raw);
      score += fire.score * 0.45;
      reasons.push(fire.reason);
      if (hasValue(v.certification?.raw)) {
        score += 20;
        reasons.push({ type: "positive", text: `认证：${v.certification!.raw}` });
      } else {
        reasons.push({ type: "warning", text: "资料未提供产品认证" });
      }
      if (hasValue(v.voc?.raw)) {
        score += 15;
        reasons.push({ type: "positive", text: `VOC：${v.voc!.raw}` });
      } else {
        reasons.push({ type: "warning", text: "资料未提供 VOC 信息" });
      }
      dims.push({
        dimension: "compliance",
        label: "合规性",
        score: clamp(score / 1.1),
        maxScore: 100,
        reasons,
        evidence,
        confidence: evidence.length ? 75 : 35,
        editable: true,
      });
    }

    // 03 企业特性
    {
      const reasons: DimensionScore["reasons"] = [];
      const evidence = [
        ...(v.enterprise_qual?.evidence ?? []),
        ...(v.overseas_exp?.evidence ?? []),
        ...(v.company_name?.evidence ?? []),
      ];
      let score = 35;
      if (hasValue(v.enterprise_qual?.raw)) {
        score += 30;
        reasons.push({ type: "positive", text: `企业资质：${v.enterprise_qual!.raw}` });
      } else reasons.push({ type: "warning", text: "资料未提供企业资质" });
      if (hasValue(v.overseas_exp?.raw)) {
        score += 25;
        reasons.push({ type: "positive", text: `海外经验：${v.overseas_exp!.raw}` });
      } else reasons.push({ type: "warning", text: "资料未提供海外项目经验" });
      dims.push({
        dimension: "enterprise",
        label: "企业特性",
        score: clamp(score),
        maxScore: 100,
        reasons,
        evidence,
        confidence: evidence.length ? 70 : 35,
        editable: true,
      });
    }

    // 04 产品性能
    {
      const reasons: DimensionScore["reasons"] = [];
      const evidence = [
        ...(v.material?.evidence ?? []),
        ...(v.thickness?.evidence ?? []),
        ...(v.width?.evidence ?? []),
      ];
      let score = 30;
      let filled = 0;
      if (hasValue(v.material?.raw)) {
        filled++;
        score += 22;
        reasons.push({ type: "positive", text: `材质：${v.material!.normalized.display}` });
      }
      if (hasValue(v.thickness?.raw)) {
        filled++;
        score += 22;
        reasons.push({ type: "positive", text: `厚度：${v.thickness!.normalized.display}` });
      }
      if (hasValue(v.width?.raw)) {
        filled++;
        score += 22;
        reasons.push({
          type: "positive",
          text: `幅宽（归一化）：${v.width!.normalized.display}`,
        });
      }
      if (filled === 0) reasons.push({ type: "warning", text: "性能相关参数均未在资料中找到" });
      dims.push({
        dimension: "performance",
        label: "产品性能",
        score: clamp(score),
        maxScore: 100,
        reasons,
        evidence,
        confidence: filled ? 70 : 30,
        editable: true,
      });
    }

    // 05 重量/运输 — lower weight better when comparable
    {
      const reasons: DimensionScore["reasons"] = [];
      const evidence = v.weight?.evidence ?? [];
      let score = 40;
      const num = v.weight?.normalized.normalizedValue;
      if (typeof num === "number" && minW != null && maxW != null) {
        if (maxW === minW) score = 80;
        else score = 100 - ((num - minW) / (maxW - minW)) * 40;
        reasons.push({
          type: "positive",
          text: `重量归一化：${v.weight?.normalized.display}`,
        });
      } else {
        reasons.push({ type: "warning", text: "资料未提供可比较重量，运输维度降权" });
        score = 35;
      }
      dims.push({
        dimension: "weight",
        label: "重量/运输",
        score: clamp(score),
        maxScore: 100,
        reasons,
        evidence,
        confidence: typeof num === "number" ? 75 : 35,
        editable: true,
      });
    }

    // 06 供应能力
    {
      const reasons: DimensionScore["reasons"] = [];
      const evidence = [
        ...(v.lead_time?.evidence ?? []),
        ...(v.moq?.evidence ?? []),
        ...(v.quantity?.evidence ?? []),
      ];
      let score = 35;
      if (hasValue(v.lead_time?.raw)) {
        score += 25;
        reasons.push({ type: "positive", text: `交付周期：${v.lead_time!.normalized.display}` });
      } else reasons.push({ type: "warning", text: "资料未提供交付周期" });
      if (hasValue(v.moq?.raw)) {
        score += 20;
        reasons.push({ type: "positive", text: `MOQ：${v.moq!.normalized.display}` });
      } else reasons.push({ type: "warning", text: "资料未提供 MOQ" });
      if (hasValue(v.quantity?.raw)) {
        score += 15;
        reasons.push({ type: "positive", text: `产品数量：${v.quantity!.normalized.display}` });
      }
      dims.push({
        dimension: "supply",
        label: "供应能力",
        score: clamp(score),
        maxScore: 100,
        reasons,
        evidence,
        confidence: evidence.length ? 70 : 35,
        editable: true,
      });
    }

    const overall = clamp(dims.reduce((s, d) => s + d.score, 0) / dims.length);
    return {
      productId: p.productId,
      supplierId: p.supplierId,
      supplierName: p.supplierName,
      productName: p.productName,
      model: p.model,
      overall,
      dimensions: dims,
    };
  });

  scores.sort((a, b) => b.overall - a.overall);

  const comparisons: ComparisonMetric[] = buildComparisons(inputs, scores);
  return { scores, comparisons };
}

function buildComparisons(
  inputs: ProductScoreInput[],
  scores: ProductScore[]
): ComparisonMetric[] {
  const byId = new Map(scores.map((s) => [s.productId, s]));
  const metric = (
    key: string,
    label: string,
    direction: ComparisonMetric["direction"],
    pick: (p: ProductScoreInput) => { raw: string; bar: number }
  ): ComparisonMetric => ({
    key,
    label,
    direction,
    values: inputs.map((p) => {
      const { raw, bar } = pick(p);
      return {
        productId: p.productId,
        supplierName: p.supplierName,
        raw,
        score: bar,
      };
    }),
  });

  return [
    metric("price", "价格（越低越好）", "lower_better", (p) => {
      const display = p.values.unit_price?.normalized.display || MISSING_VALUE;
      const dim = byId.get(p.productId)?.dimensions.find((d) => d.dimension === "price");
      return { raw: display, bar: dim?.score ?? 0 };
    }),
    metric("compliance", "合规性", "higher_better", (p) => {
      const parts = [
        p.values.fire_rating?.raw,
        p.values.certification?.raw,
        p.values.voc?.raw,
      ].filter(hasValue);
      const dim = byId.get(p.productId)?.dimensions.find((d) => d.dimension === "compliance");
      return { raw: parts.join(" / ") || MISSING_VALUE, bar: dim?.score ?? 0 };
    }),
    metric("enterprise", "企业特性", "higher_better", (p) => {
      const parts = [p.values.enterprise_qual?.raw, p.values.overseas_exp?.raw].filter(hasValue);
      const dim = byId.get(p.productId)?.dimensions.find((d) => d.dimension === "enterprise");
      return { raw: parts.join(" / ") || MISSING_VALUE, bar: dim?.score ?? 0 };
    }),
    metric("performance", "产品性能", "higher_better", (p) => {
      const parts = [
        p.values.material?.normalized.display,
        p.values.thickness?.normalized.display,
        p.values.width?.normalized.display,
      ].filter((x) => hasValue(x));
      const dim = byId.get(p.productId)?.dimensions.find((d) => d.dimension === "performance");
      return { raw: parts.join(" / ") || MISSING_VALUE, bar: dim?.score ?? 0 };
    }),
    metric("weight", "重量/运输", "lower_better", (p) => {
      const display = p.values.weight?.normalized.display || MISSING_VALUE;
      const dim = byId.get(p.productId)?.dimensions.find((d) => d.dimension === "weight");
      return { raw: display, bar: dim?.score ?? 0 };
    }),
    metric("supply", "供应能力", "higher_better", (p) => {
      const parts = [
        p.values.lead_time?.normalized.display,
        p.values.moq?.normalized.display,
        p.values.quantity?.normalized.display,
      ].filter((x) => hasValue(x));
      const dim = byId.get(p.productId)?.dimensions.find((d) => d.dimension === "supply");
      return { raw: parts.join(" / ") || MISSING_VALUE, bar: dim?.score ?? 0 };
    }),
  ];
}

export function dimensionLabel(dimension: ScoreDimension): string {
  const map: Record<ScoreDimension, string> = {
    price: "价格",
    compliance: "合规性",
    enterprise: "企业特性",
    performance: "产品性能",
    weight: "重量/运输",
    supply: "供应能力",
  };
  return map[dimension];
}
