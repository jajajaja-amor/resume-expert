import { Badge } from "@/components/ui/badge";
import { cn, overallStateLabel, riskLabel } from "@/lib/utils";
import type {
  ComplianceStatus,
  OverallComplianceState,
  ParseStatus,
  RiskLevel,
} from "@/types/workspace";

export function ComplianceStatusBadge({ status }: { status: ComplianceStatus }) {
  const styles: Record<ComplianceStatus, string> = {
    PASS: "border-emerald-200 bg-emerald-50 text-emerald-800",
    FAIL: "border-red-200 bg-red-50 text-red-700",
    REVIEW: "border-amber-200 bg-amber-50 text-amber-800",
    MISSING: "border-orange-200 bg-orange-50 text-orange-800",
    NOT_APPLICABLE: "border-neutral-200 bg-neutral-50 text-neutral-600",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-semibold",
        styles[status]
      )}
    >
      {status}
    </span>
  );
}

export function RiskBadge({ risk }: { risk: RiskLevel }) {
  const styles: Record<RiskLevel, string> = {
    high: "border-red-200 bg-red-50 text-red-700",
    medium: "border-orange-200 bg-orange-50 text-orange-700",
    low: "border-emerald-200 bg-emerald-50 text-emerald-700",
    none: "border-neutral-200 bg-neutral-50 text-neutral-600",
  };
  return (
    <span className={cn("inline-flex rounded-md border px-2 py-0.5 text-xs", styles[risk])}>
      {riskLabel(risk)}
    </span>
  );
}

export function ParseStatusBadge({ status }: { status: ParseStatus }) {
  const map: Record<ParseStatus, { label: string; className: string }> = {
    pending: { label: "待解析", className: "border-neutral-200 bg-neutral-50 text-neutral-600" },
    parsing: { label: "正在解析", className: "border-blue-200 bg-blue-50 text-blue-700" },
    done: { label: "解析完成", className: "border-emerald-200 bg-emerald-50 text-emerald-700" },
    failed: { label: "解析失败", className: "border-red-200 bg-red-50 text-red-700" },
  };
  const item = map[status];
  return (
    <span className={cn("inline-flex rounded-md border px-2 py-0.5 text-xs", item.className)}>
      {item.label}
    </span>
  );
}

export function OverallStateBadge({ state }: { state: OverallComplianceState }) {
  const styles: Record<OverallComplianceState, string> = {
    compliant: "success",
    at_risk: "danger",
    pending_review: "warning",
    incomplete: "warning",
  };
  return <Badge variant={styles[state] as "success" | "danger" | "warning"}>{overallStateLabel(state)}</Badge>;
}
