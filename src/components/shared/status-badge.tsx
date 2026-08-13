import { Badge } from "@/components/ui/badge";
import {
  AiStatus,
  ComplianceStatus,
  COMPLIANCE_STATUS_LABEL,
  ParseStatus,
  RiskLevel,
  RISK_LABEL,
} from "@/types/domain";

export function ParseStatusBadge({ status }: { status: ParseStatus }) {
  switch (status) {
    case "pending":
      return <Badge variant="secondary">待解析</Badge>;
    case "parsing":
      return <Badge variant="info">正在解析</Badge>;
    case "done":
      return <Badge variant="success">解析完成</Badge>;
    case "failed":
      return <Badge variant="danger">解析失败</Badge>;
  }
}

export function AiStatusBadge({ status }: { status: AiStatus }) {
  switch (status) {
    case "ok":
      return <Badge variant="success">已确认</Badge>;
    case "review":
      return <Badge variant="warning">⚠ 待确认</Badge>;
    case "conflict":
      return <Badge variant="warning">⚠ 参数冲突</Badge>;
    case "missing":
      return <Badge variant="danger">缺失</Badge>;
  }
}

export function ComplianceStatusBadge({ status }: { status: ComplianceStatus }) {
  const label = COMPLIANCE_STATUS_LABEL[status];
  switch (status) {
    case "PASS":
      return <Badge variant="success">{label}</Badge>;
    case "FAIL":
      return <Badge variant="danger">{label}</Badge>;
    case "REVIEW":
      return <Badge variant="warning">{label}</Badge>;
    case "MISSING":
      return <Badge variant="info" className="border-orange-200 bg-orange-50 text-orange-700">{label}</Badge>;
    case "NOT_APPLICABLE":
      return <Badge variant="secondary">{label}</Badge>;
  }
}

export function RiskBadge({ risk }: { risk: RiskLevel }) {
  const label = RISK_LABEL[risk];
  switch (risk) {
    case "high":
      return <Badge variant="danger">{label}</Badge>;
    case "medium":
      return <Badge variant="warning" className="border-orange-200 bg-orange-50 text-orange-700">{label}</Badge>;
    case "low":
      return <Badge variant="success">{label}</Badge>;
  }
}
