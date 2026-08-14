/** Structured result for Coze product compliance review */

export interface CozeReviewOpinion {
  id: string;
  title: string;
  problem: string;
  analysis: string;
  suggestion: string;
  riskLevel?: "high" | "medium" | "low";
  clause?: string;
}

export interface CozeLegalCitationCheck {
  id: string;
  citation: string;
  status: "valid" | "invalid" | "unverifiable" | "missing";
  detail: string;
}

export interface CozeEnterpriseCheck {
  id: string;
  name: string;
  status: "matched" | "mismatch" | "not_found" | "unverifiable";
  detail: string;
}

export interface CozeReviewResult {
  source: "coze" | "demo";
  demoLabel?: string;
  opinions: CozeReviewOpinion[];
  legalCitations: CozeLegalCitationCheck[];
  enterpriseChecks: CozeEnterpriseCheck[];
  feishuReportUrl?: string;
  summary?: string;
  rawText?: string;
  debugUrl?: string;
  executeId?: string;
}

/** Fields sent to Coze from product selection (阶段一 → 阶段二) */
export interface ProductCompliancePayload {
  /** 产品类型 */
  productType: string;
  /** 公司名称 */
  companyName: string;
  /** 认证报告 */
  certificationReport: string;
  /** 软膜天花技术性资料 */
  technicalMaterials: string;
  /** 单价 */
  unitPrice: string;
  /** 总价 */
  totalPrice: string;
  /** 服务物流 */
  serviceLogistics: string;
  /** 补充要求 */
  additionalRequirements: string;
  /** 原始选型摘要（便于追溯） */
  selectionSummary?: {
    projectName?: string;
    productName?: string;
    model?: string;
    overallScore?: number;
    sourceDocuments?: string[];
  };
}

export interface CozeReviewRequest {
  /** Prefer structured product compliance payload from selection */
  productPayload?: ProductCompliancePayload;
  /** @deprecated legacy contract fields kept for backward compatibility */
  contractText?: string;
  contractFileName?: string;
  contractFileBase64?: string;
  contractFileMime?: string;
  contractType?: string;
  reviewStance?: string;
  focusContent?: string;
  additionalRequirements?: string;
  preferDemo?: boolean;
}

export interface CozeStatusResponse {
  configured: boolean;
  workflowConfigured: boolean;
  mode: "coze" | "demo";
  reason?: string;
  feishu?: {
    configured: boolean;
    docType?: string;
  };
}
