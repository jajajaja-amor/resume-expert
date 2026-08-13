"use client";

import Link from "next/link";
import { AlertTriangle, ArrowRight, CheckCircle2, Download } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { buildParameterTableMarkdown, downloadFile } from "@/lib/export";
import { useWorkspaceStore } from "@/store/workspace-store";

export function SelectionResultSection() {
  const selection = useWorkspaceStore((s) => s.selection);

  if (!selection) return null;

  const exportParams = () => {
    const md = buildParameterTableMarkdown(
      [`${selection.supplierName}（${selection.model}）`],
      selection.keyParameters.map((p) => ({ label: p.label, values: [p.value] }))
    );
    downloadFile("最终选型参数表.md", md, "text/markdown");
  };

  return (
    <Card className="border-primary/40">
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-center gap-2">
          <CheckCircle2 className="h-5 w-5 text-emerald-600" />
          <CardTitle className="text-base">6. 最终选型结果</CardTitle>
          <Badge variant="success">已人工确认</Badge>
        </div>
        <CardDescription>
          选型结果（SelectionResult）已生成，将作为合规审核阶段的输入自动传递，无需重新录入。
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="rounded-md border bg-muted/30 p-4 lg:col-span-1">
            <p className="text-xs text-muted-foreground">推荐产品</p>
            <p className="mt-1 text-lg font-semibold">{selection.productName}</p>
            <p className="text-sm text-muted-foreground">{selection.productCategory}</p>
            <div className="mt-3 space-y-1 text-sm">
              <p>
                <span className="text-muted-foreground">供应商：</span>
                {selection.supplierName}
              </p>
              <p>
                <span className="text-muted-foreground">型号：</span>
                {selection.model}
              </p>
            </div>
            <div className="mt-4 flex items-end gap-2">
              <span className="text-3xl font-bold text-primary">{selection.overallScore}</span>
              <span className="pb-1 text-xs text-muted-foreground">/ 100 综合评分</span>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
              {selection.dimensionScores.map((d) => (
                <div key={d.dimension} className="flex justify-between">
                  <span className="text-muted-foreground">{d.label}</span>
                  <span className="font-medium">{d.score}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-md border p-4 lg:col-span-2">
            <p className="text-xs font-medium text-muted-foreground">核心参数</p>
            <div className="mt-2 overflow-x-auto">
              <table className="w-full min-w-[420px] text-sm">
                <tbody>
                  {selection.keyParameters.map((p) => (
                    <tr key={p.label} className="border-b last:border-0">
                      <td className="whitespace-nowrap py-1.5 pr-4 text-muted-foreground">
                        {p.label}
                      </td>
                      <td className="py-1.5 font-medium">{p.value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-md border border-emerald-200 bg-emerald-50/50 p-4">
            <p className="text-sm font-medium text-emerald-800">产品优势</p>
            <ul className="mt-2 space-y-1.5 text-sm">
              {selection.advantages.map((a, i) => (
                <li key={i} className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" />
                  <span>{a}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-md border border-red-200 bg-red-50/50 p-4">
            <p className="text-sm font-medium text-red-800">潜在风险</p>
            <ul className="mt-2 space-y-1.5 text-sm">
              {selection.risks.map((r, i) => (
                <li key={i} className="flex items-start gap-2">
                  <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-red-500" />
                  <span>{r}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-md border border-amber-200 bg-amber-50/50 p-4">
            <p className="text-sm font-medium text-amber-800">待确认事项</p>
            <ul className="mt-2 space-y-1.5 text-sm">
              {selection.pendingItems.map((p, i) => (
                <li key={i} className="flex items-start gap-2">
                  <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" />
                  <span>{p}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {selection.reviewerNote && (
          <div className="rounded-md border bg-muted/30 p-3 text-sm">
            <span className="text-xs font-medium text-muted-foreground">审核备注：</span>
            {selection.reviewerNote}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3">
          <Button variant="outline" onClick={exportParams}>
            <Download /> 导出参数表
          </Button>
          <Button asChild>
            <Link href="/compliance">
              进入合规审核 <ArrowRight />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
