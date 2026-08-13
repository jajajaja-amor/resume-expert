/**
 * SpecLens 核心领域模型。
 * 所有 AI 输出都必须是结构化对象，且携带 Evidence 以保证可追溯。
 */

/* ---------------- 基础 ---------------- */

export type ParseStatus = "pending" | "parsing" | "done" | "failed";

export type AiStatus = "ok" | "review" | "conflict" | "missing";

export interface Evidence {
  sourceDocument: string;
  page: number | null;
  section: string;
  originalText: string;
  extractedValue: string;
  confidence: number; // 0-100
}

/** 每一个 AI 结果的统一包装：result + status + confidence + evidence */
export interface AiResult<T = string> {
  result: T;
  status: AiStatus;
  confidence: number; // 0-100
  evidence: Evidence[];
  note?: string;
}

/* ---------------- 文档与供应商 ---------------- */

export type DocumentKind = "supplier" | "specification";

export interface WorkspaceDocument {
  id: string;
  name: string;
  fileType: string; // PDF / Word / Excel / TXT / 图片
  sizeKB: number;
  kind: DocumentKind;
  supplierId?: string;
  supplierName?: string;
  status: ParseStatus;
  isDemo: boolean;
}

export interface Supplier {
  id: string;
  name: string;
  shortName: string; // 供应商 A / B / C
  country: string;
  model: string;
}

export interface Product {
  supplierId: string;
  name: string;
  model: string;
  category: string;
}

/* ---------------- 参数提取与归一化 ---------------- */

export interface Parameter {
  key: string;
  label: string;
  group: "基础" | "性能" | "合规" | "企业" | "供应";
  /** supplierId -> 提取结果 */
  values: Record<string, AiResult<string>>;
}

export interface NormalizedParameter {
  key: string;
  label: string;
  rule: string; // 转换规则说明
  targetUnit: string;
  entries: {
    supplierId: string;
    originalValue: string;
    normalizedValue: string;
    status: AiStatus;
    note?: string;
  }[];
}

/* ---------------- 比较与评分 ---------------- */

export type ScoreDirection = "higher-better" | "lower-better" | "project-dependent";

export interface ComparisonMetric {
  key: ScoreDimensionKey;
  label: string;
  direction: ScoreDirection;
  directionLabel: string;
  /** supplierId -> 0-100 相对表现值（仅用于图形） */
  values: Record<string, number>;
  /** supplierId -> 展示用原始值 */
  displayValues: Record<string, string>;
}

export type ScoreDimensionKey =
  | "price"
  | "compliance"
  | "company"
  | "performance"
  | "logistics"
  | "supply";

export const SCORE_DIMENSIONS: { key: ScoreDimensionKey; index: string; label: string }[] = [
  { key: "price", index: "01", label: "价格" },
  { key: "compliance", index: "02", label: "合规性" },
  { key: "company", index: "03", label: "企业特性" },
  { key: "performance", index: "04", label: "产品性能" },
  { key: "logistics", index: "05", label: "重量 / 运输" },
  { key: "supply", index: "06", label: "供应能力" },
];

export interface ScoreReason {
  type: "positive" | "warning";
  text: string;
}

export interface DimensionScore {
  dimension: ScoreDimensionKey;
  score: number; // 0-100，AI 原始分
  reasons: ScoreReason[];
  evidence: Evidence[];
  confidence: number;
}

export interface SupplierScore {
  supplierId: string;
  dimensions: DimensionScore[];
  overall: number;
}

/* ---------------- 人工审核 ---------------- */

export interface ScoreOverride {
  supplierId: string;
  dimension: ScoreDimensionKey;
  score: number;
  note?: string;
}

export interface ReviewTask {
  id: string;
  target: string; // 描述审核对象
  reason: string;
  status: "open" | "resolved";
}

/* ---------------- 选型结果（阶段一输出 = 阶段二输入） ---------------- */

export interface SelectionResult {
  id: string;
  createdAt: number;
  projectName: string;
  productName: string;
  productCategory: string;
  supplierId: string;
  supplierName: string;
  model: string;
  overallScore: number;
  dimensionScores: { dimension: ScoreDimensionKey; label: string; score: number }[];
  keyParameters: { label: string; value: string }[];
  advantages: string[];
  risks: string[];
  pendingItems: string[];
  sourceDocuments: string[];
  reviewerNote: string;
  humanReviewed: boolean;
  isDemo: boolean;
}

/* ---------------- 合规审核 ---------------- */

export interface Specification {
  id: string;
  documentName: string;
  title: string;
  type: string; // 项目规范 / 国家标准 / 客户要求...
}

export type ComplianceStatus = "PASS" | "FAIL" | "REVIEW" | "MISSING" | "NOT_APPLICABLE";

export type RiskLevel = "high" | "medium" | "low";

export interface Requirement {
  id: string;
  specificationId: string;
  clause: string; // 条款号 / 章节
  category: string;
  name: string;
  requiredValue: string;
}

export interface ComplianceCheck {
  id: string;
  requirementId: string;
  name: string;
  category: string;
  requiredValue: string;
  actualValue: string;
  aiStatus: ComplianceStatus;
  confidence: number;
  risk: RiskLevel;
  aiJudgement: string;
  specEvidence: Evidence[];
  productEvidence: Evidence[];
  suggestion?: string;
  /* 人工审核字段 */
  humanStatus?: ComplianceStatus;
  humanNote?: string;
  resolved: boolean;
  supplementDocument?: string;
}

/* ---------------- MAS 与报告 ---------------- */

export interface MasSection {
  id: string;
  title: string;
  content: string;
}

export interface MasDocument {
  templateName: string;
  sections: MasSection[];
  status: "draft" | "confirmed";
}

export interface AuditLogEntry {
  time: number;
  actor: "AI" | "人工";
  action: string;
}

export interface ComplianceReport {
  id: string;
  createdAt: number;
  projectName: string;
  selection: SelectionResult;
  specifications: Specification[];
  checks: ComplianceCheck[];
  mas: MasDocument;
  auditLog: AuditLogEntry[];
  overallStatus: string;
}

/* ---------------- 历史记录 ---------------- */

export interface HistoryRecord {
  id: string;
  projectName: string;
  productName: string;
  supplierName: string;
  reviewedAt: number;
  overallScore: number;
  complianceStatus: string;
  failCount: number;
  reviewCount: number;
}

/* ---------------- Agent 流程 ---------------- */

export interface AgentStep {
  id: string;
  label: string;
  status: "pending" | "running" | "done";
}

export function effectiveStatus(check: ComplianceCheck): ComplianceStatus {
  return check.humanStatus ?? check.aiStatus;
}

export const COMPLIANCE_STATUS_LABEL: Record<ComplianceStatus, string> = {
  PASS: "PASS",
  FAIL: "FAIL",
  REVIEW: "REVIEW",
  MISSING: "MISSING",
  NOT_APPLICABLE: "N/A",
};

export const RISK_LABEL: Record<RiskLevel, string> = {
  high: "高风险",
  medium: "中风险",
  low: "低风险",
};
