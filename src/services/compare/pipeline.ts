import { uid } from "@/lib/utils";
import {
  COMPARE_FIELD_DEFS,
  MISSING_VALUE,
  type CompareFieldKey,
} from "@/services/compare/fields";
import { extractProductFields } from "@/services/compare/extract";
import { normalizeField } from "@/services/compare/normalize";
import { scoreProducts, type ProductScoreInput } from "@/services/compare/score";
import type {
  AgentStep,
  CompareAnalysisResult,
  DocumentFile,
  Evidence,
  NormalizedParameter,
  Parameter,
  Product,
  ProductScore,
  SelectionResult,
  Supplier,
} from "@/types/workspace";
import { COMPARE_AGENT_STEPS } from "@/services/agents/steps";

export interface AnalyzeDocumentInput extends DocumentFile {
  textContent?: string;
}

function evidenceOf(
  sourceDocument: string,
  originalText: string,
  extractedValue: string,
  confidence: number
): Evidence {
  return {
    sourceDocument,
    originalText: originalText || extractedValue,
    extractedValue,
    confidence,
  };
}

function groupDocuments(docs: AnalyzeDocumentInput[]): Array<{
  label: string;
  docs: AnalyzeDocumentInput[];
}> {
  const map = new Map<string, AnalyzeDocumentInput[]>();
  docs.forEach((doc, idx) => {
    const label =
      doc.productLabel?.trim() ||
      doc.supplierName?.trim() ||
      `产品 ${idx + 1}`;
    const list = map.get(label) ?? [];
    list.push(doc);
    map.set(label, list);
  });
  return Array.from(map.entries()).map(([label, groupDocs]) => ({
    label,
    docs: groupDocs,
  }));
}

async function bumpSteps(
  steps: AgentStep[],
  index: number,
  onStep?: (steps: AgentStep[]) => void
) {
  steps.forEach((s, i) => {
    if (i < index) s.status = "done";
    else if (i === index) s.status = "processing";
    else s.status = "pending";
  });
  onStep?.(steps.map((s) => ({ ...s })));
}

/**
 * Real compare pipeline: upload groups → extract → normalize → score.
 * Never fabricates missing fields from outside the provided document text.
 */
export async function runComparePipeline(
  docs: AnalyzeDocumentInput[],
  options?: {
    onStep?: (steps: AgentStep[]) => void;
    demoMode?: boolean;
    projectName?: string;
  }
): Promise<CompareAnalysisResult> {
  const steps: AgentStep[] = COMPARE_AGENT_STEPS.map((s) => ({ ...s }));
  const onStep = options?.onStep;

  if (!docs.length) {
    throw new Error("请先上传至少一份产品资料。");
  }

  await bumpSteps(steps, 0, onStep);
  await bumpSteps(steps, 1, onStep);

  const groups = groupDocuments(docs);
  const suppliers: Supplier[] = [];
  const products: Product[] = [];
  const parameters: Parameter[] = [];
  const normalized: NormalizedParameter[] = [];
  const scoreInputs: ProductScoreInput[] = [];
  const pendingItems: string[] = [];

  await bumpSteps(steps, 2, onStep);
  await bumpSteps(steps, 3, onStep);

  for (let i = 0; i < groups.length; i++) {
    const group = groups[i];
    const supplierId = uid("sup");
    const productId = uid("prod");
    const mergedText = group.docs
      .map((d) => {
        const body = d.textContent?.trim();
        return [`【文件：${d.name}】`, body || "（未能读取到文本内容）"].join("\n");
      })
      .join("\n\n");

    const sourceNames = group.docs.map((d) => d.name);
    const primaryName = sourceNames[0] || group.label;

    const extraction = await extractProductFields({
      text: mergedText,
      fileName: primaryName,
      productLabel: group.label,
    });

    if (!group.docs.some((d) => d.textContent?.trim())) {
      pendingItems.push(
        `${group.label}：未能从上传文件读取文本，请改用 TXT/粘贴资料文本后重试（未编造参数）`
      );
    }

    const company =
      extraction.fields.company_name?.value ||
      group.label;
    const productName =
      extraction.fields.product_name?.value ||
      group.label;
    const model =
      extraction.fields.product_name?.value ||
      group.docs[0]?.name.replace(/\.[^.]+$/, "") ||
      productName;

    suppliers.push({
      id: supplierId,
      name: company,
      qualifications: extraction.fields.enterprise_qual?.value
        ? [extraction.fields.enterprise_qual.value]
        : [],
      overseasExperience: Boolean(extraction.fields.overseas_exp?.value),
      notes: extraction.fields.overseas_exp?.value,
    });

    const productParams: Parameter[] = [];
    const valueMap: ProductScoreInput["values"] = {};

    for (const field of COMPARE_FIELD_DEFS) {
      const extracted = extraction.fields[field.key as CompareFieldKey];
      const raw = extracted?.value?.trim() || MISSING_VALUE;
      const conf = extracted?.confidence ?? (raw === MISSING_VALUE ? 0 : 60);
      const ev = evidenceOf(
        primaryName,
        extracted?.evidence || (raw === MISSING_VALUE ? "原文中未找到该字段" : raw),
        raw,
        conf
      );
      const norm = normalizeField(field.key, raw === MISSING_VALUE ? "" : raw);

      const param: Parameter = {
        id: uid("param"),
        key: field.key,
        label: field.label,
        rawValue: raw,
        supplierId,
        productId,
        evidence: [ev],
        confidence: conf,
        needsReview: raw === MISSING_VALUE || norm.status === "review" || conf < 60,
      };
      productParams.push(param);
      parameters.push(param);

      normalized.push({
        id: uid("norm"),
        parameterKey: field.key,
        label: field.label,
        supplierId,
        productId,
        originalValue: raw,
        normalizedValue: norm.normalizedValue,
        normalizedUnit: norm.normalizedUnit,
        conversionRule: norm.conversionRule,
        status: raw === MISSING_VALUE ? "review" : norm.status,
        evidence: [ev],
        confidence: conf,
      });

      valueMap[field.key as CompareFieldKey] = {
        raw,
        normalized: norm,
        evidence: [ev],
      };

      if (raw === MISSING_VALUE) {
        pendingItems.push(`${company} · ${field.label}：资料中未提供`);
      } else if (norm.status === "review") {
        pendingItems.push(`${company} · ${field.label}：已提取但单位/含义待确认（${raw}）`);
      }
    }

    products.push({
      id: productId,
      supplierId,
      supplierName: company,
      name: productName,
      model,
      category: "软膜天花 / 建筑装饰材料",
      parameters: productParams,
      documentIds: group.docs.map((d) => d.id),
    });

    scoreInputs.push({
      productId,
      supplierId,
      supplierName: company,
      productName,
      model,
      values: valueMap,
    });
  }

  await bumpSteps(steps, 4, onStep);
  await bumpSteps(steps, 5, onStep);
  await bumpSteps(steps, 6, onStep);

  const { scores, comparisons } = scoreProducts(scoreInputs);

  steps.forEach((s) => {
    s.status = "done";
  });
  onStep?.(steps.map((s) => ({ ...s })));

  return {
    products,
    suppliers,
    parameters,
    normalized,
    comparisons,
    scores,
    pendingItems: Array.from(new Set(pendingItems)).slice(0, 80),
    demoMode: Boolean(options?.demoMode),
  };
}

export function buildSelectionFromCompare(params: {
  result: CompareAnalysisResult;
  selected: ProductScore;
  projectName: string;
  humanNotes?: string;
  markedErrors?: string[];
}): SelectionResult {
  const { result, selected, projectName, humanNotes, markedErrors = [] } = params;
  const productEntity =
    result.products.find((p) => p.id === selected.productId) ?? result.products[0];

  const coreKeys: CompareFieldKey[] = [
    "company_name",
    "product_name",
    "unit_price",
    "quantity",
    "thickness",
    "width",
    "material",
    "fire_rating",
    "certification",
    "voc",
    "enterprise_qual",
    "overseas_exp",
    "lead_time",
    "moq",
    "weight",
  ];

  const coreParameters = coreKeys.map((key) => {
    const param = result.parameters.find(
      (p) => p.key === key && p.productId === selected.productId
    );
    const norm = result.normalized.find(
      (n) => n.parameterKey === key && n.productId === selected.productId
    );
    const label = COMPARE_FIELD_DEFS.find((f) => f.key === key)?.label || key;
    const value =
      norm && norm.normalizedValue != null
        ? `${norm.normalizedValue}${norm.normalizedUnit ? ` ${norm.normalizedUnit}` : ""}`
        : param?.rawValue || MISSING_VALUE;
    return { label, value };
  });

  const advantages = selected.dimensions
    .flatMap((d) => d.reasons.filter((r) => r.type === "positive").map((r) => r.text))
    .slice(0, 8);

  const risks = selected.dimensions
    .flatMap((d) =>
      d.reasons.filter((r) => r.type === "warning" || r.type === "negative").map((r) => r.text)
    )
    .slice(0, 8);

  const missing = coreParameters
    .filter((p) => p.value === MISSING_VALUE || p.value.includes(MISSING_VALUE))
    .map((p) => `${p.label}未在资料中提供`);

  const sourceDocuments = Array.from(
    new Set(
      result.parameters
        .filter((p) => p.productId === selected.productId)
        .flatMap((p) => p.evidence.map((e) => e.sourceDocument))
    )
  );

  return {
    id: uid("sel"),
    projectId: "project-live",
    projectName,
    productId: selected.productId,
    productName: selected.productName || productEntity?.name || MISSING_VALUE,
    supplierId: selected.supplierId,
    supplierName: selected.supplierName,
    model: selected.model || productEntity?.model || MISSING_VALUE,
    overallScore: selected.overall,
    dimensions: selected.dimensions,
    coreParameters,
    advantages: advantages.length ? advantages : ["（资料有限，未总结出额外优势）"],
    risks: risks.length ? risks : missing.slice(0, 3),
    pendingItems: [
      ...result.pendingItems.filter((x) => x.includes(selected.supplierName)).slice(0, 12),
      ...missing,
      ...markedErrors.map((e) => `已标记错误：${e}`),
    ],
    sourceDocuments,
    scoreEvidence: selected.dimensions.flatMap((d) => d.evidence),
    humanReviewStatus: humanNotes || markedErrors.length ? "modified" : "accepted",
    humanNotes,
    confirmedAt: new Date().toISOString(),
    demoMode: result.demoMode,
  };
}
