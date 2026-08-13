"use client";

import Link from "next/link";
import { ArrowRight, GitBranch, ShieldCheck, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { OverallStateBadge } from "@/components/shared/status-badge";
import { useWorkspaceStore } from "@/store/workspace-store";
import { formatDateTime } from "@/lib/utils";

const workflow = [
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
  const history = useWorkspaceStore((s) => s.history);
  const removeHistory = useWorkspaceStore((s) => s.removeHistory);
  const clearHistory = useWorkspaceStore((s) => s.clearHistory);
  const loadHistory = useWorkspaceStore((s) => s.loadHistory);

  return (
    <div className="space-y-10">
      <section className="animate-fade-up panel overflow-hidden">
        <div className="grid gap-0 md:grid-cols-[1.2fr_0.8fr]">
          <div className="p-6 md:p-8">
            <p className="text-sm font-medium text-brand">SpecLens · AI Product Compliance Workspace</p>
            <h1 className="mt-3 max-w-xl font-display text-3xl font-semibold leading-tight text-[var(--ink)] md:text-4xl">
              AI 产品比选与合规审核
            </h1>
            <p className="mt-4 max-w-xl text-sm leading-relaxed text-[var(--ink-muted)] md:text-base">
              从供应商产品资料，到产品选型，再到海外项目合规审核，一条工作流完成。
            </p>
            <p className="mt-3 max-w-xl text-sm text-[var(--ink-muted)]">
              面向海外工程项目采购与合规审核场景的 AI Agent 工作流，将「产品比选」与「合规审核」两段流程串联。
            </p>
          </div>
          <div className="border-t border-[var(--line)] bg-[linear-gradient(160deg,#0f5c4c_0%,#164e63_55%,#1c1c1c_100%)] p-6 text-white md:border-l md:border-t-0 md:p-8">
            <div className="text-sm text-white/80">工作台原则</div>
            <ul className="mt-4 space-y-3 text-sm leading-relaxed">
              <li>每一个 AI 判断都可以追溯到来源</li>
              <li>AI 无法判断的内容进入「待确认」</li>
              <li>缺少证据不能直接判定 FAIL</li>
              <li>阶段一输出 = 阶段二输入</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="panel animate-fade-up p-6" style={{ animationDelay: "60ms" }}>
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-brand-soft text-brand">
            <GitBranch className="h-5 w-5" />
          </div>
          <h2 className="mt-4 font-display text-xl font-semibold">产品比选</h2>
          <p className="mt-2 text-sm leading-relaxed text-[var(--ink-muted)]">
            上传多个供应商产品资料，AI 自动提取参数、统一单位、横向比较并生成六维评分。
          </p>
          <Button asChild className="mt-5">
            <Link href="/compare">
              开始产品比选 <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>

        <div className="panel animate-fade-up p-6" style={{ animationDelay: "120ms" }}>
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-brand-soft text-brand">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <h2 className="mt-4 font-display text-xl font-semibold">合规审核</h2>
          <p className="mt-2 text-sm leading-relaxed text-[var(--ink-muted)]">
            基于已确认的产品和项目规范，AI 自动生成检查清单并逐项进行合规核查。
          </p>
          <Button asChild className="mt-5">
            <Link href="/compliance">
              进入合规审核 <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>

      <section className="panel p-6">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="font-display text-xl font-semibold">端到端工作流</h2>
            <p className="mt-1 text-sm text-[var(--ink-muted)]">
              重点强调：阶段一输出 = 阶段二输入
            </p>
          </div>
        </div>
        <div className="mt-6 overflow-x-auto pb-2">
          <ol className="flex min-w-max items-stretch gap-2">
            {workflow.map((step, idx) => (
              <li key={step} className="flex items-center gap-2">
                <div className="rounded-md border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-sm font-medium">
                  {step}
                </div>
                {idx < workflow.length - 1 ? (
                  <span className="text-[var(--ink-muted)]">→</span>
                ) : null}
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="panel p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-xl font-semibold">最近项目</h2>
            <p className="mt-1 text-sm text-[var(--ink-muted)]">本地保存最近几次演示记录</p>
          </div>
          {history.length > 0 ? (
            <Button variant="outline" size="sm" onClick={clearHistory}>
              清空历史
            </Button>
          ) : null}
        </div>

        {history.length === 0 ? (
          <p className="mt-4 text-sm text-[var(--ink-muted)]">
            暂无历史记录。完成一次「产品比选 → 合规审核」后将自动出现在这里。
          </p>
        ) : (
          <div className="mt-4 table-scroll">
            <table className="w-full min-w-[860px] text-left text-sm">
              <thead className="border-b border-[var(--line)] text-[var(--ink-muted)]">
                <tr>
                  <th className="py-2 pr-3 font-medium">项目名称</th>
                  <th className="py-2 pr-3 font-medium">产品</th>
                  <th className="py-2 pr-3 font-medium">供应商</th>
                  <th className="py-2 pr-3 font-medium">审核时间</th>
                  <th className="py-2 pr-3 font-medium">综合评分</th>
                  <th className="py-2 pr-3 font-medium">合规状态</th>
                  <th className="py-2 pr-3 font-medium">FAIL</th>
                  <th className="py-2 pr-3 font-medium">REVIEW</th>
                  <th className="py-2 font-medium">操作</th>
                </tr>
              </thead>
              <tbody>
                {history.map((item) => (
                  <tr key={item.id} className="border-b border-[var(--line)] last:border-0">
                    <td className="py-3 pr-3 font-medium">{item.projectName}</td>
                    <td className="py-3 pr-3">{item.productName}</td>
                    <td className="py-3 pr-3">{item.supplierName}</td>
                    <td className="py-3 pr-3">{formatDateTime(item.reviewedAt)}</td>
                    <td className="py-3 pr-3">{item.overallScore}</td>
                    <td className="py-3 pr-3">
                      <OverallStateBadge state={item.complianceState} />
                    </td>
                    <td className="py-3 pr-3 text-red-700">{item.failCount}</td>
                    <td className="py-3 pr-3 text-amber-700">{item.reviewCount}</td>
                    <td className="py-3">
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" asChild>
                          <Link
                            href="/compliance"
                            onClick={() => loadHistory(item.id)}
                          >
                            继续审核
                          </Link>
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => removeHistory(item.id)}
                          aria-label="删除记录"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
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
    </div>
  );
}
