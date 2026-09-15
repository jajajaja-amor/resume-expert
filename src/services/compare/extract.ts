import { chatCompletion, extractJsonObject } from "@/lib/ai/chat";
import { getAIConfig } from "@/lib/ai/config";
import {
  COMPARE_FIELD_DEFS,
  type CompareFieldKey,
  type ExtractedFieldMap,
} from "@/services/compare/fields";

function cleanValue(raw: string): string {
  return raw.replace(/^[\s:：=\-–—]+/, "").replace(/\s+/g, " ").trim();
}

function isEmptyLike(value: string): boolean {
  return (
    !value ||
    /^(null|未知|未提供|n\/?a|not\s*stated|none|-|—|资料中未提供)$/i.test(value.trim())
  );
}

function pickNearLabel(text: string, aliases: string[]): { value: string; evidence: string } | null {
  for (const alias of aliases) {
    const escaped = alias.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const patterns = [
      new RegExp(`${escaped}\\s*[:：=]\\s*([^\\n；;]{1,120})`, "i"),
      new RegExp(`${escaped}\\s*[为是]\\s*([^\\n；;]{1,120})`, "i"),
    ];
    for (const re of patterns) {
      const m = text.match(re);
      if (m?.[1]) {
        const value = cleanValue(m[1]);
        if (value && value.length >= 1 && !isEmptyLike(value)) {
          return { value, evidence: m[0].slice(0, 160) };
        }
      }
    }
  }
  return null;
}

/** Deterministic regex / keyword extraction — never invents values. */
export function extractFieldsFromText(text: string): ExtractedFieldMap {
  const result: ExtractedFieldMap = {};
  if (!text.trim()) return result;

  for (const field of COMPARE_FIELD_DEFS) {
    const hit = pickNearLabel(text, [...field.aliases, field.label]);
    if (hit) {
      result[field.key] = {
        value: hit.value,
        evidence: hit.evidence,
        confidence: 70,
      };
    }
  }

  // Extra heuristics for common certifications scattered in text
  if (!result.certification) {
    const certs: string[] = [];
    if (/\bCE\b/i.test(text)) certs.push("CE");
    if (/\bREACH\b/i.test(text)) certs.push("REACH");
    if (/\bUL\b/i.test(text)) certs.push("UL");
    if (/\bISO\s*9001\b/i.test(text)) certs.push("ISO 9001");
    if (certs.length) {
      result.certification = {
        value: certs.join(", "),
        evidence: `文本中识别到认证关键词：${certs.join(", ")}`,
        confidence: 60,
      };
    }
  }

  if (!result.fire_rating) {
    const fire = text.match(/\b(A1|A2(?:-s\d(?:,d\d)?)?|B1|B2|Class\s*[ABC]\b)/i);
    if (fire) {
      result.fire_rating = {
        value: fire[1],
        evidence: fire[0],
        confidence: 65,
      };
    }
  }

  return result;
}

async function extractFieldsWithLlm(
  text: string,
  meta: { fileName: string; productLabel?: string }
): Promise<ExtractedFieldMap> {
  const fieldList = COMPARE_FIELD_DEFS.map((f) => `- ${f.key}（${f.label}）`).join("\n");
  const content = await chatCompletion(
    [
      {
        role: "system",
        content: [
          "你是海外工程产品资料解析助手。",
          "只能从用户提供的资料原文中提取信息，禁止编造、补全或猜测未见过的数值。",
          "若资料未明确出现某字段，该字段必须为 null。",
          "输出严格 JSON 对象，键为字段 key，值为 {\"value\": string, \"evidence\": string} 或 null。",
          "evidence 必须是原文片段。语言尽量保留原文，后续会统一归一化。",
        ].join(""),
      },
      {
        role: "user",
        content: [
          `文件名：${meta.fileName}`,
          meta.productLabel ? `产品分组：${meta.productLabel}` : "",
          "待提取字段：",
          fieldList,
          "",
          "资料原文：",
          text.slice(0, 12000),
        ]
          .filter(Boolean)
          .join("\n"),
      },
    ],
    { temperature: 0, maxTokens: 2000 }
  );

  const parsed = extractJsonObject(content) as Record<string, unknown>;
  const result: ExtractedFieldMap = {};
  for (const field of COMPARE_FIELD_DEFS) {
    const raw = parsed[field.key];
    if (raw == null) continue;
    if (typeof raw === "string" && raw.trim() && !isEmptyLike(raw)) {
      result[field.key] = { value: cleanValue(raw), evidence: raw, confidence: 75 };
      continue;
    }
    if (typeof raw === "object") {
      const obj = raw as { value?: unknown; evidence?: unknown };
      const value = typeof obj.value === "string" ? cleanValue(obj.value) : "";
      if (!value || isEmptyLike(value)) continue;
      result[field.key] = {
        value,
        evidence: typeof obj.evidence === "string" ? obj.evidence : value,
        confidence: 80,
      };
    }
  }
  return result;
}

function mergeExtracted(base: ExtractedFieldMap, extra: ExtractedFieldMap): ExtractedFieldMap {
  const out: ExtractedFieldMap = { ...base };
  for (const [key, val] of Object.entries(extra) as Array<
    [CompareFieldKey, ExtractedFieldMap[CompareFieldKey]]
  >) {
    if (!val?.value || isEmptyLike(val.value)) continue;
    const prev = out[key];
    if (!prev || isEmptyLike(prev.value)) {
      out[key] = val;
      continue;
    }
    // Prefer longer / more complete evidence-backed values; avoid LLM truncating规则提取结果
    const preferExtra =
      (val.confidence ?? 0) > (prev.confidence ?? 0) + 15 ||
      (val.value.length > prev.value.length + 2 && (val.confidence ?? 0) >= (prev.confidence ?? 0));
    if (preferExtra) out[key] = val;
  }
  return out;
}

/**
 * Extract product fields from source text.
 * Uses regex first; optionally enriches with LLM. Never fabricates missing fields.
 */
export async function extractProductFields(params: {
  text: string;
  fileName: string;
  productLabel?: string;
  preferLlm?: boolean;
}): Promise<{ fields: ExtractedFieldMap; mode: "rules" | "llm" | "hybrid" | "empty" }> {
  const text = params.text?.trim() || "";
  if (!text) return { fields: {}, mode: "empty" };

  const rules = extractFieldsFromText(text);
  const config = getAIConfig();
  const useLlm = params.preferLlm !== false && config.mode === "llm";

  if (!useLlm) {
    return { fields: rules, mode: Object.keys(rules).length ? "rules" : "empty" };
  }

  try {
    const llm = await extractFieldsWithLlm(text, {
      fileName: params.fileName,
      productLabel: params.productLabel,
    });
    const merged = mergeExtracted(rules, llm);
    return {
      fields: merged,
      mode: Object.keys(rules).length ? "hybrid" : "llm",
    };
  } catch {
    return { fields: rules, mode: Object.keys(rules).length ? "rules" : "empty" };
  }
}
