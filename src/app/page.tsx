"use client";

import Link from "next/link";
import {
  ArrowRight,
  ClipboardCheck,
  GitCompareArrows,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import { SiteHeader } from "@/components/layout/site-header";
import { DemoBanner } from "@/components/shared/demo-banner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useMounted } from "@/lib/use-mounted";
import { useWorkspaceStore } from "@/store/workspace-store";

const WORKFLOW = [
  "供应商资料",
  "AI 文档解析",
  "参数提取",
  "归一化比选",
  "六维评分",
  "人工确认",
  "合规规范",
  "逐条审核",
  "最终报告",
];

export default function HomePage() {
  const mounted = useMounted();
  const history = useWorkspaceStore((s) => s.history);
  const deleteHistory = useWorkspaceStore((s) => s.deleteHistory);
  const clearHistory = useWorkspaceStore((s) => s.clearHistory);

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6">
        <DemoBanner text="当前为演示模式，内置「软膜天花 / 建筑装饰材料」演示数据，无需配置 API 即可完整体验全流程。" />

        {/* 首屏 */}
        <section className="rounded-lg border bg-card p-6 sm:p-10">
          <div className="max-w-3xl">
            <p className="text-sm font-medium text-primary">
              SpecLens · AI Product Compliance Workspace
            </p>
            <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
              AI 产品比选与合规审核
            </h1>
            <p className="mt-3 text-sm leading-6 text-muted-foreground sm:text-base">
              从供应商产品资料，到产品选型，再到海外项目合规审核，一条工作流完成。
              每一个 AI 判断都可以追溯到来源；AI 无法判断的内容进入「待确认」，不允许自行猜测。
            </p>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <Card className="flex flex-col">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <GitCompareArrows className="h-5 w-5 text-primary" />
                  <CardTitle className="text-base">产品比选</CardTitle>
                  <Badge variant="secondary">阶段一</Badge>
                </div>
                <CardDescription className="leading-6">
                  上传多个供应商产品资料，AI 自动提取参数、统一单位、横向比较并生成六维评分。
                </CardDescription>
              </CardHeader>
              <CardContent className="mt-auto">
                <Button asChild>
                  <Link href="/compare">
                    开始产品比选 <ArrowRight />
                  </Link>
                </Button>
              </CardContent>
            </Card>
            <Card className="flex flex-col">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-primary" />
                  <CardTitle className="text-base">合规审核</CardTitle>
                  <Badge variant="secondary">阶段二</Badge>
                </div>
                <CardDescription className="leading-6">
                  基于已确认的产品和项目规范，AI 自动生成检查清单并逐项进行合规核查。
                </CardDescription>
              </CardHeader>
              <CardContent className="mt-auto">
                <Button asChild variant="outline">
                  <Link href="/compliance">
                    进入合规审核 <ArrowRight />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* 工作流展示 */}
        <section className="rounded-lg border bg-card p-6 sm:p-8">
          <h2 className="text-lg font-semibold">AI Agent 工作流</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            <span className="font-medium text-primary">阶段一输出 = 阶段二输入</span>
            ：确认选型结果后，产品与评分数据自动传入合规审核，无需重复录入。
          </p>
          <div className="mt-5 overflow-x-auto pb-2">
            <div className="flex min-w-max items-center gap-1.5">
              {WORKFLOW.map((step, i) => (
                <div key={step} className="flex items-center gap-1.5">
                  <div
                    className={`rounded-md border px-3 py-2 text-xs font-medium sm:text-sm ${
                      i === 5 || i === 8
                        ? "border-primary/40 bg-accent text-accent-foreground"
                        : "bg-muted/40"
                    }`}
                  >
                    <span className="mr-1.5 text-[10px] text-muted-foreground">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    {step}
                  </div>
                  {i < WORKFLOW.length - 1 && (
                    <ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  )}
                </div>
              ))}
            </div>
          </div>
          <div className="mt-4 grid gap-3 text-xs text-muted-foreground sm:grid-cols-3">
            <div className="rounded-md border bg-muted/30 p-3">
              <p className="font-medium text-foreground">可追溯</p>
              <p className="mt-1 leading-5">每个参数、评分与合规结论都保留来源文件、页码、原文与置信度。</p>
            </div>
            <div className="rounded-md border bg-muted/30 p-3">
              <p className="font-medium text-foreground">不猜测</p>
              <p className="mt-1 leading-5">单位无法判断、参数冲突、缺少证据时进入待确认，缺少证据 ≠ 不合规。</p>
            </div>
            <div className="rounded-md border bg-muted/30 p-3">
              <p className="font-medium text-foreground">人工确认</p>
              <p className="mt-1 leading-5">AI 生成结果仅供审核确认，选型与合规结论都必须经过人工审核。</p>
            </div>
          </div>
        </section>

        {/* 最近项目 */}
        <section className="rounded-lg border bg-card p-6 sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <ClipboardCheck className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold">最近项目</h2>
            </div>
            {mounted && history.length > 0 && (
              <Button variant="ghost" size="sm" onClick={clearHistory}>
                <Trash2 /> 清空历史
              </Button>
            )}
          </div>
          {!mounted || history.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">
              暂无审核记录。完成一次「产品比选 → 合规审核」流程后，记录会显示在这里。
            </p>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[720px] text-sm">
                <thead>
                  <tr className="border-b text-left text-xs text-muted-foreground">
                    <th className="py-2 pr-4 font-medium">项目名称</th>
                    <th className="py-2 pr-4 font-medium">产品 / 供应商</th>
                    <th className="py-2 pr-4 font-medium">审核时间</th>
                    <th className="py-2 pr-4 font-medium">综合评分</th>
                    <th className="py-2 pr-4 font-medium">合规状态</th>
                    <th className="py-2 pr-4 font-medium">FAIL / REVIEW</th>
                    <th className="py-2 font-medium">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((h) => (
                    <tr key={h.id} className="border-b border-muted last:border-0">
                      <td className="py-3 pr-4">{h.projectName}</td>
                      <td className="py-3 pr-4">
                        <div>{h.productName}</div>
                        <div className="text-xs text-muted-foreground">{h.supplierName}</div>
                      </td>
                      <td className="py-3 pr-4 text-muted-foreground">
                        {new Date(h.reviewedAt).toLocaleString("zh-CN", { hour12: false })}
                      </td>
                      <td className="py-3 pr-4 font-medium">{h.overallScore}</td>
                      <td className="py-3 pr-4">
                        <Badge variant={h.failCount > 0 ? "danger" : h.reviewCount > 0 ? "warning" : "success"}>
                          {h.complianceStatus}
                        </Badge>
                      </td>
                      <td className="py-3 pr-4">
                        <span className="text-red-600">{h.failCount}</span>
                        <span className="text-muted-foreground"> / </span>
                        <span className="text-amber-600">{h.reviewCount}</span>
                      </td>
                      <td className="py-3">
                        <div className="flex items-center gap-1">
                          <Button asChild variant="outline" size="sm">
                            <Link href="/compliance">继续审核</Link>
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteHistory(h.id)}
                            aria-label="删除记录"
                          >
                            <Trash2 />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <footer className="pb-8 text-center text-xs text-muted-foreground">
          SpecLens · 海外工程产品合规审查工作台 · Demo Mode（模拟数据，不构成真实合规判断）
        </footer>
      </main>
    </div>
  );
}
