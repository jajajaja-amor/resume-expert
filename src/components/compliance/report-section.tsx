"use client";

import { useMemo, useState } from "react";
import { CheckCircle2, Copy, Download, FileText, Printer, Send } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ComplianceStatusBadge, RiskBadge } from "@/components/shared/status-badge";
import { buildReportHtml, buildReportMarkdown, downloadFile, ReportInput } from "@/lib/export";
import { COMPLIANCE_STATUS_LABEL, effectiveStatus } from "@/types/domain";
import { complianceSummary, useWorkspaceStore } from "@/store/workspace-store";

function fmtTime(t: number) {
  return new Date(t).toLocaleString("zh-CN", { hour12: false });
}

export function ReportSection() {
  const reportReady = useWorkspaceStore((s) => s.reportReady);
  const selection = useWorkspaceStore((s) => s.selection);
  const specifications = useWorkspaceStore((s) => s.specifications);
  const checks = useWorkspaceStore((s) => s.checks);
  const mas = useWorkspaceStore((s) => s.mas);
  const auditLog = useWorkspaceStore((s) => s.auditLog);

  const [copied, setCopied] = useState(false);
  const [feishuMessage, setFeishuMessage] = useState<string | null>(null);

  const summary = useMemo(() => complianceSummary(checks), [checks]);

  if (!reportReady || !selection) return null;

  const reportInput: ReportInput = {
    selection,
    specifications,
    checks,
    mas,
    auditLog,
    overallStatus: summary.overall,
  };

  const exportMarkdown = () =>
    downloadFile("海外工程项目产品合规审核报告.md", buildReportMarkdown(reportInput), "text/markdown");
  const exportHtml = () =>
    downloadFile("海外工程项目产品合规审核报告.html", buildReportHtml(reportInput), "text/html");
  const exportPdf = () => window.print();
  const copyMarkdown = async () => {
    try {
      await navigator.clipboard.writeText(buildReportMarkdown(reportInput));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };
  const exportFeishu = async () => {
    const res = await fetch("/api/agents/status").then((r) => r.json()).catch(() => null);
    if (!res || res.feishu !== "configured") {
      setFeishuMessage("当前为演示模式，飞书文档接口尚未配置。");
    } else {
      setFeishuMessage("飞书接口已配置，导出逻辑待接入。");
    }
  };

  const byStatus = (s: string) => checks.filter((c) => effectiveStatus(c) === s);
  const sourceDocs = Array.from(
    new Set([...selection.sourceDocuments, ...specifications.map((s) => s.documentName)])
  );

  return (
    <Card className="border-primary/40" id="final-report">
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          <CardTitle className="text-base">6. 海外工程项目产品合规审核报告</CardTitle>
          <Badge variant="success">已生成</Badge>
        </div>
        <CardDescription>
          报告内容包含 15 个章节，所有结论均可追溯到来源文件。以下为报告预览。
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5 text-sm">
        {/* 导出操作 */}
        <div className="no-print flex flex-wrap items-center gap-2 rounded-md border bg-muted/30 p-3">
          <Button size="sm" onClick={exportMarkdown}>
            <Download /> 导出 Markdown
          </Button>
          <Button size="sm" variant="outline" onClick={exportHtml}>
            <Download /> 导出 HTML
          </Button>
          <Button size="sm" variant="outline" onClick={exportPdf}>
            <Printer /> 导出 PDF（打印）
          </Button>
          <Button size="sm" variant="outline" onClick={copyMarkdown}>
            <Copy /> {copied ? "已复制" : "复制报告"}
          </Button>
          <Button size="sm" variant="outline" onClick={exportFeishu}>
            <Send /> 导出飞书文档
          </Button>
          {feishuMessage && (
            <span className="text-xs text-amber-700">{feishuMessage}</span>
          )}
        </div>

        {/* 01-03 基本信息 */}
        <section className="grid gap-4 md:grid-cols-3">
          <div className="rounded-md border p-4">
            <h3 className="text-xs font-semibold text-muted-foreground">01 项目基本信息</h3>
            <p className="mt-2 font-medium">{selection.projectName}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              报告生成时间：{fmtTime(Date.now())}
            </p>
            <div className="mt-2">
              <Badge
                variant={
                  summary.overall === "合规"
                    ? "success"
                    : summary.overall === "存在风险"
                      ? "danger"
                      : "warning"
                }
              >
                整体审核状态：{summary.overall}
              </Badge>
            </div>
          </div>
          <div className="rounded-md border p-4">
            <h3 className="text-xs font-semibold text-muted-foreground">02 产品信息</h3>
            <p className="mt-2 font-medium">{selection.productName}</p>
            <p className="text-xs text-muted-foreground">{selection.productCategory}</p>
            <p className="mt-1 text-xs">型号：{selection.model}</p>
          </div>
          <div className="rounded-md border p-4">
            <h3 className="text-xs font-semibold text-muted-foreground">03 供应商信息</h3>
            <p className="mt-2 font-medium">{selection.supplierName}</p>
            <p className="mt-1 text-xs">
              综合评分：<span className="font-semibold text-primary">{selection.overallScore} / 100</span>
            </p>
          </div>
        </section>

        {/* 04-05 参数与评分 */}
        <section className="grid gap-4 md:grid-cols-2">
          <div className="rounded-md border p-4">
            <h3 className="text-xs font-semibold text-muted-foreground">04 产品参数</h3>
            <table className="mt-2 w-full text-sm">
              <tbody>
                {selection.keyParameters.map((p) => (
                  <tr key={p.label} className="border-b last:border-0">
                    <td className="py-1 pr-3 text-muted-foreground">{p.label}</td>
                    <td className="py-1 font-medium">{p.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="rounded-md border p-4">
            <h3 className="text-xs font-semibold text-muted-foreground">05 六维产品评分</h3>
            <div className="mt-2 space-y-2">
              {selection.dimensionScores.map((d) => (
                <div key={d.dimension}>
                  <div className="flex justify-between text-xs">
                    <span>{d.label}</span>
                    <span className="font-semibold">{d.score}</span>
                  </div>
                  <div className="mt-0.5 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full bg-primary" style={{ width: `${d.score}%` }} />
                  </div>
                </div>
              ))}
            </div>
            <h3 className="mt-4 text-xs font-semibold text-muted-foreground">06 适用规范</h3>
            <ul className="mt-2 space-y-1 text-xs">
              {specifications.map((s) => (
                <li key={s.id}>
                  {s.title}（{s.type} · {s.documentName}）
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* 07 检查清单 */}
        <section className="rounded-md border p-4">
          <h3 className="text-xs font-semibold text-muted-foreground">07 合规检查清单</h3>
          <div className="mt-2 overflow-x-auto">
            <table className="w-full min-w-[700px] text-xs">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="py-1.5 pr-3 font-medium">检查项</th>
                  <th className="py-1.5 pr-3 font-medium">规范要求</th>
                  <th className="py-1.5 pr-3 font-medium">产品实际值</th>
                  <th className="py-1.5 pr-3 font-medium">结果</th>
                  <th className="py-1.5 font-medium">风险</th>
                </tr>
              </thead>
              <tbody>
                {checks.map((c) => (
                  <tr key={c.id} className="border-b last:border-0">
                    <td className="py-1.5 pr-3">{c.name}</td>
                    <td className="py-1.5 pr-3 text-muted-foreground">{c.requiredValue}</td>
                    <td className="py-1.5 pr-3">{c.actualValue}</td>
                    <td className="py-1.5 pr-3">
                      <ComplianceStatusBadge status={effectiveStatus(c)} />
                    </td>
                    <td className="py-1.5">
                      <RiskBadge risk={c.risk} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* 08-11 分组结论 */}
        <section className="grid gap-4 md:grid-cols-2">
          {(["PASS", "FAIL", "REVIEW", "MISSING"] as const).map((st, i) => (
            <div key={st} className="rounded-md border p-4">
              <h3 className="text-xs font-semibold text-muted-foreground">
                {String(8 + i).padStart(2, "0")} {COMPLIANCE_STATUS_LABEL[st]} 项（{byStatus(st).length}）
              </h3>
              {byStatus(st).length === 0 ? (
                <p className="mt-2 text-xs text-muted-foreground">无</p>
              ) : (
                <ul className="mt-2 space-y-1.5 text-xs leading-5">
                  {byStatus(st).map((c) => (
                    <li key={c.id}>
                      <span className="font-medium">{c.name}</span>
                      <span className="text-muted-foreground">：{c.aiJudgement}</span>
                      {c.humanNote && (
                        <span className="text-primary">（人工备注：{c.humanNote}）</span>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </section>

        {/* 12-13 风险与待确认 */}
        <section className="grid gap-4 md:grid-cols-2">
          <div className="rounded-md border p-4">
            <h3 className="text-xs font-semibold text-muted-foreground">12 风险与建议</h3>
            <ul className="mt-2 space-y-1.5 text-xs leading-5">
              {checks
                .filter((c) => c.suggestion)
                .map((c) => (
                  <li key={c.id}>
                    <span className="font-medium">{c.name}</span>
                    <span className="text-muted-foreground">：{c.suggestion}</span>
                  </li>
                ))}
              {selection.risks.map((r, i) => (
                <li key={`r-${i}`}>
                  <span className="font-medium">选型阶段风险</span>
                  <span className="text-muted-foreground">：{r}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-md border p-4">
            <h3 className="text-xs font-semibold text-muted-foreground">13 待人工确认事项</h3>
            <ul className="mt-2 list-inside list-disc space-y-1.5 text-xs leading-5">
              {selection.pendingItems.map((p, i) => (
                <li key={i}>{p}</li>
              ))}
            </ul>
          </div>
        </section>

        {/* 14-15 来源与审核记录 */}
        <section className="grid gap-4 md:grid-cols-2">
          <div className="rounded-md border p-4">
            <h3 className="text-xs font-semibold text-muted-foreground">14 来源文件索引</h3>
            <ul className="mt-2 space-y-1 text-xs">
              {sourceDocs.map((d) => (
                <li key={d} className="flex items-center gap-1.5">
                  <FileText className="h-3 w-3 text-muted-foreground" /> {d}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-md border p-4">
            <h3 className="text-xs font-semibold text-muted-foreground">15 审核记录</h3>
            <ul className="mt-2 space-y-1 text-xs">
              {auditLog.map((a, i) => (
                <li key={i} className="flex items-start gap-1.5">
                  <CheckCircle2 className="mt-0.5 h-3 w-3 shrink-0 text-emerald-600" />
                  <span>
                    <span className="text-muted-foreground">{fmtTime(a.time)}</span> ·{" "}
                    <Badge variant={a.actor === "AI" ? "secondary" : "outline"} className="mx-1 px-1 py-0 text-[10px]">
                      {a.actor}
                    </Badge>
                    {a.action}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <p className="text-center text-[11px] text-muted-foreground">
          本报告由 SpecLens 工作台生成（Demo Mode，模拟数据）。所有 AI 结论均已经过人工审核确认。
        </p>
      </CardContent>
    </Card>
  );
}
