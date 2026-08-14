import { MISSING_VALUE } from "@/services/compare/fields";

const USD_TO_CNY = 7.15;
const EUR_TO_CNY = 7.8;
const GBP_TO_CNY = 9.1;

const EN_ZH: Record<string, string> = {
  pvc: "PVC",
  polyester: "聚酯",
  fabric: "织物",
  membrane: "膜材",
  stretch: "软膜",
  ceiling: "天花",
  days: "天",
  weeks: "周",
  months: "月",
  roll: "卷",
  rolls: "卷",
  sqm: "㎡",
  "m2": "㎡",
  certified: "已认证",
  available: "可提供",
  yes: "是",
  no: "否",
};

export interface NormalizeResult {
  normalizedValue: string | number | null;
  normalizedUnit?: string;
  conversionRule?: string;
  display: string;
  status: "normalized" | "review";
  originalUnit?: string;
}

function parseNumber(raw: string): number | null {
  const m = raw.replace(/,/g, "").match(/-?\d+(?:\.\d+)?/);
  return m ? Number(m[0]) : null;
}

export function translateToZh(raw: string): string {
  let out = raw;
  for (const [en, zh] of Object.entries(EN_ZH)) {
    out = out.replace(new RegExp(`\\b${en}\\b`, "gi"), zh);
  }
  return out;
}

export function normalizeWidth(raw: string): NormalizeResult {
  const lower = raw.toLowerCase();
  const num = parseNumber(raw);
  if (num == null) {
    return {
      normalizedValue: null,
      display: MISSING_VALUE,
      status: "review",
      conversionRule: "无法识别数值，需人工确认",
    };
  }
  if (/mm|毫米/.test(lower)) {
    const m = Number((num / 1000).toFixed(4));
    return {
      normalizedValue: m,
      normalizedUnit: "m",
      originalUnit: "mm",
      conversionRule: "毫米 ÷ 1000 → 米",
      display: `${m} m`,
      status: "normalized",
    };
  }
  if (/cm|厘米/.test(lower)) {
    const m = Number((num / 100).toFixed(4));
    return {
      normalizedValue: m,
      normalizedUnit: "m",
      originalUnit: "cm",
      conversionRule: "厘米 ÷ 100 → 米",
      display: `${m} m`,
      status: "normalized",
    };
  }
  if (/inch|in\b|英寸/.test(lower)) {
    const m = Number((num * 0.0254).toFixed(4));
    return {
      normalizedValue: m,
      normalizedUnit: "m",
      originalUnit: "inch",
      conversionRule: "英寸 × 0.0254 → 米",
      display: `${m} m`,
      status: "normalized",
    };
  }
  if (/m\b|米/.test(lower) || (!/[a-zA-Z\u4e00-\u9fff]/.test(lower) && num <= 20)) {
    return {
      normalizedValue: num,
      normalizedUnit: "m",
      originalUnit: /m\b|米/.test(lower) ? "m" : "假定 m",
      conversionRule: /m\b|米/.test(lower) ? "已是米" : "无单位且数值较小，暂按米处理（待确认）",
      display: `${num} m`,
      status: /m\b|米/.test(lower) ? "normalized" : "review",
    };
  }
  return {
    normalizedValue: num,
    normalizedUnit: "m",
    display: `${num}（单位待确认）`,
    status: "review",
    conversionRule: "未能识别幅宽单位",
  };
}

export function normalizePriceToCny(raw: string): NormalizeResult {
  const num = parseNumber(raw);
  if (num == null) {
    return {
      normalizedValue: null,
      display: MISSING_VALUE,
      status: "review",
      conversionRule: "无法识别价格数值",
    };
  }
  const lower = raw.toLowerCase();
  if (/\$|usd|美元/.test(lower)) {
    const cny = Number((num * USD_TO_CNY).toFixed(2));
    return {
      normalizedValue: cny,
      normalizedUnit: "CNY/㎡",
      originalUnit: "USD",
      conversionRule: `美元 × ${USD_TO_CNY} → 人民币（演示汇率）`,
      display: `¥${cny} /㎡`,
      status: "normalized",
    };
  }
  if (/€|eur|欧元/.test(lower)) {
    const cny = Number((num * EUR_TO_CNY).toFixed(2));
    return {
      normalizedValue: cny,
      normalizedUnit: "CNY/㎡",
      originalUnit: "EUR",
      conversionRule: `欧元 × ${EUR_TO_CNY} → 人民币（演示汇率）`,
      display: `¥${cny} /㎡`,
      status: "normalized",
    };
  }
  if (/£|gbp|英镑/.test(lower)) {
    const cny = Number((num * GBP_TO_CNY).toFixed(2));
    return {
      normalizedValue: cny,
      normalizedUnit: "CNY/㎡",
      originalUnit: "GBP",
      conversionRule: `英镑 × ${GBP_TO_CNY} → 人民币（演示汇率）`,
      display: `¥${cny} /㎡`,
      status: "normalized",
    };
  }
  if (/¥|￥|cny|rmb|元|人民币/.test(lower) || /\/\s*m/.test(lower)) {
    return {
      normalizedValue: num,
      normalizedUnit: "CNY/㎡",
      originalUnit: "CNY",
      conversionRule: "已按人民币处理",
      display: `¥${num} /㎡`,
      status: "normalized",
    };
  }
  return {
    normalizedValue: num,
    normalizedUnit: "CNY/㎡",
    display: `¥${num}（币种待确认）`,
    status: "review",
    conversionRule: "未识别币种，暂按人民币展示（待确认）",
  };
}

export function normalizeWeightKgPerRoll(raw: string): NormalizeResult {
  const num = parseNumber(raw);
  if (num == null) {
    return {
      normalizedValue: null,
      display: MISSING_VALUE,
      status: "review",
      conversionRule: "无法识别重量数值",
    };
  }
  const lower = raw.toLowerCase();
  if (/g\b|克/.test(lower) && !/kg|千克/.test(lower)) {
    const kg = Number((num / 1000).toFixed(3));
    return {
      normalizedValue: kg,
      normalizedUnit: "kg/卷",
      originalUnit: "g",
      conversionRule: "克 ÷ 1000 → kg/卷",
      display: `${kg} kg/卷`,
      status: "normalized",
    };
  }
  if (/lb|磅/.test(lower)) {
    const kg = Number((num * 0.453592).toFixed(3));
    return {
      normalizedValue: kg,
      normalizedUnit: "kg/卷",
      originalUnit: "lb",
      conversionRule: "磅 × 0.453592 → kg/卷",
      display: `${kg} kg/卷`,
      status: "normalized",
    };
  }
  if (/kg|千克|公斤/.test(lower) || /卷/.test(raw)) {
    return {
      normalizedValue: num,
      normalizedUnit: "kg/卷",
      originalUnit: "kg",
      conversionRule: "已按 kg/卷 处理",
      display: `${num} kg/卷`,
      status: "normalized",
    };
  }
  return {
    normalizedValue: num,
    normalizedUnit: "kg/卷",
    display: `${num}（单位待确认）`,
    status: "review",
    conversionRule: "未识别重量单位",
  };
}

export function normalizeGenericText(raw: string): NormalizeResult {
  const zh = translateToZh(raw);
  return {
    normalizedValue: zh,
    display: zh,
    status: zh === raw ? "normalized" : "normalized",
    conversionRule: zh === raw ? "无需转换" : "英文关键词已转为中文表述",
  };
}

export function normalizeField(key: string, raw: string): NormalizeResult {
  if (!raw || raw === MISSING_VALUE) {
    return {
      normalizedValue: null,
      display: MISSING_VALUE,
      status: "review",
      conversionRule: "资料中未提供该参数，未做编造",
    };
  }
  switch (key) {
    case "width":
      return normalizeWidth(raw);
    case "unit_price":
      return normalizePriceToCny(raw);
    case "weight":
      return normalizeWeightKgPerRoll(raw);
    default:
      return normalizeGenericText(raw);
  }
}
