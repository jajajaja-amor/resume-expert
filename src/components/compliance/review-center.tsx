"use client";

import { CheckCircle2, CheckSquare, FileUp, Loader2 } from "lucide-react";
import { useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ComplianceStatusBadge, RiskBadge } from "@/components/shared/status-badge";
import { ComplianceStatus, effectiveStatus } from "@/types/domain";
import { cn } from "@/lib/utils";
import { useWorkspaceStore } from "@/store/workspace-store";

const STATUS_OPTIONS: { value: ComplianceStatus; label: string }[] = [
  { value: "PASS", label: "PASS - 明确满足要求" },
  { value: "FAIL", label: "FAIL - 明确不满足要求" },
  { value: "REVIEW", label: "REVIEW - 需人工审核" },
  { value: "MISSING", label: "MISSING - 缺少必要资料" },
  { value: "NOT_APPLICABLE", label: "N/A - 不适用于当前产品" },
];

export function ReviewCenter() {
  const checks = useWorkspaceStore((s) => s.checks);
  const setHumanStatus = useWorkspaceStore((s) => s.setCheckHumanStatus);
  const setNote = useWorkspaceStore((s) => s.setCheckNote);
  const setResolved = useWorkspaceStore((s) => s.setCheckResolved);
  const attachSupplement = useWorkspaceStore((s) => s.attachSupplement);
  const confirmCompliance = useWorkspaceStore((s) => s.confirmCompliance);
  const complianceConfirmed = useWorkspaceStore((s) => s.complianceConfirmed);
  const masGenerating = useWorkspaceStore((s) => s.masGenerating);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadTarget, setUploadTarget] = useState<string | null>(null);

  const reviewItems = checks.filter((c) =>
    ["FAIL", "REVIEW", "MISSING"].includes(c.aiStatus)
  );

  if (checks.length === 0) return null;

  const unresolved = reviewItems.filter((c) => !c.resolved).length;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-center gap-2">
          <CardTitle className="text-base">4. 人工审核区</CardTitle>
          <Badge variant="warning">AI 生成结果，仅供审核确认</Badge>
        </div>
        <CardDescription>
          所有 FAIL / REVIEW / MISSING 项需要人工处理：确认或修改 AI 结论、添加备注、上传补充资料、标记已解决。
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {reviewItems.map((c) => (
          <div
            key={c.id}
            className={cn(
              "rounded-md border p-4",
              c.resolved ? "border-emerald-200 bg-emerald-50/40" : "bg-muted/20"
            )}
          >
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-medium">{c.name}</p>
              <ComplianceStatusBadge status={effectiveStatus(c)} />
              <RiskBadge risk={c.risk} />
              {c.resolved && <Badge variant="success">已解决</Badge>}
              {c.supplementDocument && (
                <Badge variant="secondary" className="max-w-full truncate font-normal">
                  补充资料：{c.supplementDocument}
                </Badge>
              )}
            </div>
            <p className="mt-2 text-sm text-muted-foreground">{c.aiJudgement}</p>
            {c.suggestion && (
              <p className="mt-1 text-sm">
                <span className="text-xs font-medium text-muted-foreground">建议：</span>
                {c.suggestion}
              </p>
            )}

            <div className="mt-3 grid gap-3 lg:grid-cols-2">
              <div>
                <p className="mb-1.5 text-xs font-medium text-muted-foreground">
                  审核结论（默认为 AI 结论，可修改）
                </p>
                <Select
                  value={effectiveStatus(c)}
                  onValueChange={(v) =>
                    setHumanStatus(c.id, v === c.aiStatus ? undefined : (v as ComplianceStatus))
                  }
                >
                  <SelectTrigger className="bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <p className="mb-1.5 text-xs font-medium text-muted-foreground">人工备注</p>
                <Textarea
                  value={c.humanNote ?? ""}
                  onChange={(e) => setNote(c.id, e.target.value)}
                  placeholder="例如：已与工程师确认按项目规范执行 A1 要求。"
                  rows={2}
                  className="bg-white"
                />
              </div>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setUploadTarget(c.id);
                  fileInputRef.current?.click();
                }}
              >
                <FileUp /> 上传补充资料
              </Button>
              <Button
                variant={c.resolved ? "secondary" : "outline"}
                size="sm"
                onClick={() => setResolved(c.id, !c.resolved)}
              >
                <CheckSquare className={c.resolved ? "text-emerald-600" : ""} />
                {c.resolved ? "取消已解决标记" : "标记已解决"}
              </Button>
            </div>
          </div>
        ))}

        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f && uploadTarget) attachSupplement(uploadTarget, f.name);
            e.target.value = "";
          }}
        />

        <div className="flex flex-wrap items-center gap-3 rounded-md border border-amber-200 bg-amber-50/50 p-4">
          <Button onClick={confirmCompliance} disabled={complianceConfirmed || masGenerating}>
            {masGenerating ? <Loader2 className="animate-spin" /> : <CheckCircle2 />}
            {complianceConfirmed ? "已确认合规审核结果" : "确认合规审核结果"}
          </Button>
          {unresolved > 0 && !complianceConfirmed && (
            <span className="text-xs text-amber-700">
              仍有 {unresolved} 条待处理项未标记解决。确认后这些事项将记入报告的「待人工确认事项」。
            </span>
          )}
          {complianceConfirmed && (
            <span className="text-sm text-emerald-700">
              合规审核结果已确认，AI 正在生成 MAS 审核材料。
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
