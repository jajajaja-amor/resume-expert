/**
 * Agent 服务层。
 *
 * 每个 Agent 都是可独立替换的异步函数，输入输出为结构化对象：
 *   Document Parser → Parameter Extractor → Normalizer → Product Comparator
 *   → Scoring Agent → (Human Review) → Selection Result
 *   → Specification Parser → Checklist Generator → Compliance Checker
 *   → (Human Review) → MAS Generator → Report Generator
 *
 * 当前实现为 Mock Agent（Demo Mode）。接入真实 Agent 时：
 * 1. 在服务端 API Route（src/app/api/agents/...）中调用真实工作流，
 *    API Key 只放在服务端环境变量（AGENT_API_KEY / AGENT_API_URL）。
 * 2. 保持下列函数签名不变，将实现替换为 fetch 服务端路由即可。
 */
import {
  ComparisonMetric,
  ComplianceCheck,
  MasSection,
  NormalizedParameter,
  Parameter,
  SelectionResult,
  Specification,
  Supplier,
  SupplierScore,
  WorkspaceDocument,
} from "@/types/domain";
import {
  buildDemoMasSections,
  DEMO_COMPARISON,
  DEMO_COMPLIANCE_CHECKS,
  DEMO_MAS_TEMPLATE_NAME,
  DEMO_NORMALIZED,
  DEMO_PARAMETERS,
  DEMO_SCORES,
  DEMO_SPECIFICATIONS,
  DEMO_SUPPLIERS,
} from "./demo-data";

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

/* ---------------- Document Parser ---------------- */

export interface DocumentParseResult {
  documentId: string;
  status: "done" | "failed";
}

export async function parseDocument(doc: WorkspaceDocument): Promise<DocumentParseResult> {
  await delay(500 + Math.random() * 600);
  // Demo Mode：内置演示文件总是解析成功；用户自行上传的文件也走同一通道。
  return { documentId: doc.id, status: "done" };
}

/* ---------------- Parameter Extractor ---------------- */

export interface ExtractionResult {
  suppliers: Supplier[];
  parameters: Parameter[];
}

export async function extractParameters(_docs: WorkspaceDocument[]): Promise<ExtractionResult> {
  await delay(900);
  return { suppliers: clone(DEMO_SUPPLIERS), parameters: clone(DEMO_PARAMETERS) };
}

/* ---------------- Normalizer ---------------- */

export async function normalizeParameters(_params: Parameter[]): Promise<NormalizedParameter[]> {
  await delay(800);
  return clone(DEMO_NORMALIZED);
}

/* ---------------- Product Comparator ---------------- */

export async function compareProducts(
  _params: Parameter[],
  _normalized: NormalizedParameter[]
): Promise<ComparisonMetric[]> {
  await delay(800);
  return clone(DEMO_COMPARISON);
}

/* ---------------- Scoring Agent ---------------- */

export async function scoreProducts(_comparison: ComparisonMetric[]): Promise<SupplierScore[]> {
  await delay(900);
  return clone(DEMO_SCORES);
}

/* ---------------- Specification Parser ---------------- */

export async function parseSpecifications(
  _docs: WorkspaceDocument[]
): Promise<Specification[]> {
  await delay(900);
  return clone(DEMO_SPECIFICATIONS);
}

/* ---------------- Checklist Generator + Compliance Checker ---------------- */

export async function runComplianceChecks(
  _selection: SelectionResult,
  _specs: Specification[]
): Promise<ComplianceCheck[]> {
  await delay(1200);
  return clone(DEMO_COMPLIANCE_CHECKS);
}

/* ---------------- MAS Generator ---------------- */

export interface MasGenerationInput {
  projectName: string;
  productName: string;
  supplierName: string;
  model: string;
  overallScore: number;
  passCount: number;
  failCount: number;
  reviewCount: number;
  missingCount: number;
}

export async function generateMas(
  input: MasGenerationInput
): Promise<{ templateName: string; sections: MasSection[] }> {
  await delay(1000);
  return { templateName: DEMO_MAS_TEMPLATE_NAME, sections: buildDemoMasSections(input) };
}

/** 当前运行模式。真实 Agent 接入后由服务端状态接口决定。 */
export const AGENT_MODE: "demo" | "live" = "demo";
