/** Structured result for Coze contract / compliance review */

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

export interface CozeReviewRequest {
  contractText?: string;
  contractFileName?: string;
  /** base64 of file bytes when uploaded from browser */
  contractFileBase64?: string;
  contractFileMime?: string;
  contractType: string;
  reviewStance: string;
  focusContent: string;
  additionalRequirements: string;
  /** allow client to force demo for presentation */
  preferDemo?: boolean;
}

export interface CozeStatusResponse {
  configured: boolean;
  workflowConfigured: boolean;
  mode: "coze" | "demo";
  reason?: string;
}
