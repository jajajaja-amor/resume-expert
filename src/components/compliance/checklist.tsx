"use client";

import { AlertTriangle, Eye } from "lucide-react";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EvidenceList } from "@/components/shared/evidence-list";
import { SidePanel } from "@/components/shared/side-panel";
import { ComplianceStatusBadge, RiskBadge } from "@/components/shared/status-badge";
import {
  ComplianceStatus,
  effectiveStatus,
  RiskLevel,
} from "@/types/domain";
import { cn } from "@/lib/utils";
import { complianceSummary, useWorkspaceStore } from "@/store/workspace-store";

const STATUS_FILTERS: { key: "ALL" | ComplianceStatus; label: string }[] = [
  { key: "ALL", label: "全部" },
  { key: "PASS", label: "PASS" },
  { key: "FAIL", label: "FAIL" },
  { key: "REVIEW", label: "REVIEW" },
  { key: "MISSING", label: "MISSING" },
  { key: "NOT_APPLICABLE", label: "N/A" },
];

const RISK_FILTERS: { key: "ALL" | RiskLevel; label: string }[] = [
  { key: "ALL", label: "全部风险" },
  { key: "high", label: "高风险" },
  { key: "medium", label: "中风险" },
  { key: "low", label: "低风险" },
];

const SUMMARY_STYLE: Record<string, string> = {
  PASS: "border-emerald-200 bg-emerald-50 text-emerald-700",
  FAIL: "border-red-200 bg-red-50 text-red-700",
  REVIEW: "border-amber-200 bg-amber-50 text-amber-700",
  MISSING: "border-orange-200 bg-orange-50 text-orange-700",
  NOT_APPLICABLE: "border-border bg-muted text-muted-foreground",
};

export function ChecklistSection() {
  const checks = useWorkspaceStore((s) => s.checks);
  const [statusFilter, setStatusFilter] = useState<"ALL" | ComplianceStatus>("ALL");
  const [riskFilter, setRiskFilter] = useState<"ALL" | RiskLevel>("ALL");
  const [activeId, setActiveId] = useState<string | null>(null);

  const { counts, total, overall } = useMemo(() => complianceSummary(checks), [checks]);

  const filtered = checks.filter((c) => {
    const st = effectiveStatus(c);
    if (statusFilter !== "ALL" && st !== statusFilter) return false;
    if (riskFilter !== "ALL" && c.risk !== riskFilter) return false;
    return true;
  });

  const active = activeId ? checks.find((c) => c.id === activeId) : null;

  if (checks.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">3. 合规审核结果</CardTitle>
        <CardDescription>
          共 {total} 条检查项，每条结论均可查看规范来源与产品资料依据。没有证据 ≠ 不合规：缺少资料判定为 MISSING，不直接判 FAIL。
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 统计 */}
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
          <div className="rounded-md border bg-muted/30 p-3 text-center">
            <p className="text-2xl font-bold">{total}</p>
            <p className="text-xs text-muted-foreground">检查项目</p>
          </div>
          {(["PASS", "FAIL", "REVIEW", "MISSING", "NOT_APPLICABLE"] as const).map((k) => (
            <div key={k} className={cn("rounded-md border p-3 text-center", SUMMARY_STYLE[k])}>
              <p className="text-2xl font-bold">{counts[k]}</p>
              <p className="text-xs">{k === "NOT_APPLICABLE" ? "N/A" : k}</p>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2 rounded-md border p-3">
          <span className="text-xs font-medium text-muted-foreground">整体审核状态：</span>
          <Badge
            variant={
              overall === "合规" ? "success" : overall === "存在风险" ? "danger" : "warning"
            }
          >
            {overall}
          </Badge>
          {counts.FAIL > 0 && (
            <span className="flex items-center gap-1 text-xs text-red-600">
              <AlertTriangle className="h-3.5 w-3.5" />
              存在 {counts.FAIL} 条明确不满足项，请在人工审核区处理。
            </span>
          )}
        </div>

        {/* 筛选 */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex flex-wrap gap-1.5">
            {STATUS_FILTERS.map((f) => (
              <button
                key={f.key}
                type="button"
                onClick={() => setStatusFilter(f.key)}
                className={cn(
                  "rounded-md border px-2.5 py-1 text-xs transition-colors",
                  statusFilter === f.key
                    ? "border-primary bg-primary text-primary-foreground"
                    : "bg-white text-muted-foreground hover:bg-muted"
                )}
              >
                {f.label}
                {f.key !== "ALL" && (
                  <span className="ml-1 opacity-70">{counts[f.key as ComplianceStatus]}</span>
                )}
              </button>
            ))}
          </div>
          <div className="ml-auto flex flex-wrap gap-1.5">
            {RISK_FILTERS.map((f) => (
              <button
                key={f.key}
                type="button"
                onClick={() => setRiskFilter(f.key)}
                className={cn(
                  "rounded-md border px-2.5 py-1 text-xs transition-colors",
                  riskFilter === f.key
                    ? "border-primary bg-primary text-primary-foreground"
                    : "bg-white text-muted-foreground hover:bg-muted"
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* 清单表格 */}
        <div className="overflow-x-auto rounded-md border">
          <table className="w-full min-w-[860px] text-sm">
            <thead>
              <tr className="border-b bg-muted/40 text-left text-xs text-muted-foreground">
                <th className="px-3 py-2.5 font-medium">检查项</th>
                <th className="px-3 py-2.5 font-medium">规范要求</th>
                <th className="px-3 py-2.5 font-medium">产品实际值</th>
                <th className="px-3 py-2.5 font-medium">结果</th>
                <th className="px-3 py-2.5 font-medium">置信度</th>
                <th className="px-3 py-2.5 font-medium">风险</th>
                <th className="px-3 py-2.5 font-medium">依据</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-3 py-6 text-center text-muted-foreground">
                    当前筛选条件下没有检查项。
                  </td>
                </tr>
              )}
              {filtered.map((c) => {
                const st = effectiveStatus(c);
                return (
                  <tr key={c.id} className="border-b align-top last:border-0">
                    <td className="px-3 py-2.5">
                      <p className="font-medium">{c.name}</p>
                      <p className="text-xs text-muted-foreground">{c.category}</p>
                      {c.humanStatus && (
                        <p className="mt-1 text-[10px] text-primary">
                          人工修改（AI 原判 {c.aiStatus === "NOT_APPLICABLE" ? "N/A" : c.aiStatus}）
                        </p>
                      )}
                    </td>
                    <td className="px-3 py-2.5 text-muted-foreground">{c.requiredValue}</td>
                    <td className="px-3 py-2.5">{c.actualValue}</td>
                    <td className="px-3 py-2.5">
                      <ComplianceStatusBadge status={st} />
                    </td>
                    <td className="px-3 py-2.5 text-muted-foreground">{c.confidence}%</td>
                    <td className="px-3 py-2.5">
                      <RiskBadge risk={c.risk} />
                    </td>
                    <td className="px-3 py-2.5">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setActiveId(c.id)}
                      >
                        <Eye /> 查看依据
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>

      {/* Evidence 侧边栏 */}
      <SidePanel open={Boolean(active)} title="合规判断依据" onClose={() => setActiveId(null)}>
        {active && (
          <div className="space-y-4 text-sm">
            <div>
              <p className="font-semibold">{active.name}</p>
              <div className="mt-1.5 flex flex-wrap items-center gap-2">
                <ComplianceStatusBadge status={effectiveStatus(active)} />
                <RiskBadge risk={active.risk} />
                <span className="text-xs text-muted-foreground">
                  AI 置信度：{active.confidence}%
                </span>
              </div>
            </div>

            <div className="rounded-md border p-3">
              <p className="text-xs text-muted-foreground">规范要求</p>
              <p className="mt-0.5 font-medium">{active.requiredValue}</p>
              <p className="mt-2 text-xs text-muted-foreground">产品实际值</p>
              <p className="mt-0.5 font-medium">{active.actualValue}</p>
            </div>

            <div>
              <p className="mb-2 text-xs font-medium text-muted-foreground">规范来源</p>
              <EvidenceList
                evidence={active.specEvidence}
                emptyHint="缺少规范来源，请人工确认。"
              />
            </div>

            <div>
              <p className="mb-2 text-xs font-medium text-muted-foreground">产品来源</p>
              <EvidenceList
                evidence={active.productEvidence}
                emptyHint="⚠️ 缺少证据，请人工确认。供应商资料中未找到对应内容，AI 不会编造来源。"
              />
            </div>

            <div className="rounded-md border bg-muted/30 p-3">
              <p className="text-xs font-medium text-muted-foreground">AI 判断</p>
              <p className="mt-1 leading-6">{active.aiJudgement}</p>
              {active.suggestion && (
                <>
                  <p className="mt-2 text-xs font-medium text-muted-foreground">建议</p>
                  <p className="mt-1 leading-6">{active.suggestion}</p>
                </>
              )}
            </div>

            {active.humanNote && (
              <div className="rounded-md border border-primary/30 bg-accent/40 p-3">
                <p className="text-xs font-medium text-muted-foreground">人工备注</p>
                <p className="mt-1">{active.humanNote}</p>
              </div>
            )}
          </div>
        )}
      </SidePanel>
    </Card>
  );
}
