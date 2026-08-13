/** SpecLens core domain types — structured Agent I/O */

export type ParseStatus = "pending" | "parsing" | "done" | "failed";
export type AgentStepStatus = "pending" | "processing" | "done" | "error";
export type ComplianceStatus = "PASS" | "FAIL" | "REVIEW" | "MISSING" | "NOT_APPLICABLE";
export type RiskLevel = "high" | "medium" | "low" | "none";
export type OverallComplianceState =
  | "compliant"
  | "at_risk"
  | "pending_review"
  | "incomplete";
export type HumanReviewState = "pending" | "accepted" | "modified" | "rejected" | "resolved";
export type ScoreDimension =
  | "price"
  | "compliance"
  | "enterprise"
  | "performance"
  | "weight"
  | "supply";

export interface Evidence {
  sourceDocument: string;
  page?: number;
  section?: string;
  originalText: string;
  extractedValue: string;
  confidence: number; // 0-100
}

export interface AiResult<T> {
  result: T;
  status: "ok" | "review" | "missing" | "conflict" | "error";
  confidence: number;
  evidence: Evidence[];
  notes?: string;
}

export interface Project {
  id: string;
  name: string;
  region?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DocumentFile {
  id: string;
  name: string;
  type: string;
  size: number;
  supplierId?: string;
  supplierName?: string;
  category: "product" | "specification" | "supplement";
  parseStatus: ParseStatus;
  errorMessage?: string;
  uploadedAt: string;
}

export interface Supplier {
  id: string;
  name: string;
  qualifications: string[];
  overseasExperience: boolean;
  scale?: string;
  notes?: string;
}

export interface Parameter {
  id: string;
  key: string;
  label: string;
  rawValue: string;
  unit?: string;
  supplierId: string;
  productId: string;
  evidence: Evidence[];
  confidence: number;
  conflict?: {
    values: Array<{ rawValue: string; evidence: Evidence }>;
    message: string;
  };
  needsReview?: boolean;
  reviewNote?: string;
}

export interface NormalizedParameter {
  id: string;
  parameterKey: string;
  label: string;
  supplierId: string;
  productId: string;
  originalValue: string;
  originalUnit?: string;
  normalizedValue: string | number | null;
  normalizedUnit?: string;
  conversionRule?: string;
  status: "normalized" | "review" | "conflict";
  evidence: Evidence[];
  confidence: number;
}

export interface Product {
  id: string;
  supplierId: string;
  supplierName: string;
  name: string;
  model: string;
  category: string;
  parameters: Parameter[];
  documentIds: string[];
}

export interface DimensionScore {
  dimension: ScoreDimension;
  label: string;
  score: number;
  maxScore: number;
  reasons: Array<{ type: "positive" | "warning" | "negative"; text: string }>;
  evidence: Evidence[];
  confidence: number;
  editable: boolean;
}

export interface ProductScore {
  productId: string;
  supplierId: string;
  supplierName: string;
  productName: string;
  model: string;
  overall: number;
  dimensions: DimensionScore[];
}

export interface ComparisonMetric {
  key: string;
  label: string;
  direction: "lower_better" | "higher_better" | "context";
  values: Array<{
    productId: string;
    supplierName: string;
    raw: string;
    score: number; // 0-100 normalized for bar chart
  }>;
}

export interface SelectionResult {
  id: string;
  projectId: string;
  projectName: string;
  productId: string;
  productName: string;
  supplierId: string;
  supplierName: string;
  model: string;
  overallScore: number;
  dimensions: DimensionScore[];
  coreParameters: Array<{ label: string; value: string }>;
  advantages: string[];
  risks: string[];
  pendingItems: string[];
  sourceDocuments: string[];
  scoreEvidence: Evidence[];
  humanReviewStatus: HumanReviewState;
  humanNotes?: string;
  confirmedAt: string;
  demoMode: boolean;
}

export interface Specification {
  id: string;
  name: string;
  documentIds: string[];
  parseStatus: ParseStatus;
}

export interface Requirement {
  id: string;
  code: string;
  title: string;
  description: string;
  requiredValue: string;
  category: string;
  sourceDocument: string;
  page?: number;
  originalText: string;
  conflictsWith?: string[];
}

export interface ComplianceCheck {
  id: string;
  requirementId: string;
  checkItem: string;
  requirement: string;
  actualValue: string;
  status: ComplianceStatus;
  riskLevel: RiskLevel;
  confidence: number;
  evidence: Evidence[];
  aiJudgment: string;
  humanStatus: HumanReviewState;
  humanNote?: string;
  suggestion?: string;
}

export interface ReviewTask {
  id: string;
  checkId: string;
  checkItem: string;
  status: ComplianceStatus;
  riskLevel: RiskLevel;
  resolved: boolean;
  note?: string;
}

export interface MasMaterial {
  id: string;
  title: string;
  status: "draft" | "pending_review" | "confirmed";
  sections: Array<{ id: string; heading: string; content: string }>;
  generatedAt: string;
}

export interface ComplianceReport {
  id: string;
  projectName: string;
  productName: string;
  supplierName: string;
  model: string;
  overallState: OverallComplianceState;
  summary: {
    total: number;
    pass: number;
    fail: number;
    review: number;
    missing: number;
    notApplicable: number;
  };
  sections: Array<{ id: string; title: string; content: string }>;
  checks: ComplianceCheck[];
  mas?: MasMaterial;
  generatedAt: string;
  confirmedAt?: string;
  demoMode: boolean;
}

export interface HistoryRecord {
  id: string;
  projectName: string;
  productName: string;
  supplierName: string;
  reviewedAt: string;
  overallScore: number;
  complianceState: OverallComplianceState;
  failCount: number;
  reviewCount: number;
  selectionResult?: SelectionResult;
  report?: ComplianceReport;
}

export interface AgentStep {
  id: string;
  label: string;
  status: AgentStepStatus;
}

export interface CompareAnalysisResult {
  products: Product[];
  suppliers: Supplier[];
  parameters: Parameter[];
  normalized: NormalizedParameter[];
  comparisons: ComparisonMetric[];
  scores: ProductScore[];
  pendingItems: string[];
  demoMode: boolean;
}

export interface ComplianceAnalysisResult {
  requirements: Requirement[];
  checks: ComplianceCheck[];
  summary: ComplianceReport["summary"];
  overallState: OverallComplianceState;
  demoMode: boolean;
}
