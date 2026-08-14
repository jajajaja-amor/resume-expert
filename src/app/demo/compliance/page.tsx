"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CozeReviewPanel } from "@/components/compliance/coze-review-panel";
import { buildDemoSelectionResult } from "@/data/demo/soft-membrane";
import { fetchDemoCozeReview } from "@/services/coze/reviewClient";
import { selectionToProductPayload } from "@/services/coze/selection-payload";
import { useWorkspaceStore } from "@/store/workspace-store";
import type { CozeReviewResult } from "@/types/coze-review";
import type { SelectionResult } from "@/types/workspace";

/**
 * Standalone preview page for compliance Coze review UI.
 * Auto-loads demo SelectionResult so reviewers can open it without going through /compare.
 */
export default function ComplianceTestPage() {
  const confirmSelection = useWorkspaceStore((s) => s.confirmSelection);
  const selectionResult = useWorkspaceStore((s) => s.selectionResult);
  const [localSelection, setLocalSelection] = useState<SelectionResult | null>(null);
  const [previewResult, setPreviewResult] = useState<CozeReviewResult | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const selection = buildDemoSelectionResult(undefined, {
      humanNotes: "测试页自动导入的演示选型结果，便于预览扣子合规审查界面。",
    });
    setLocalSelection(selection);
    confirmSelection(selection);

    let cancelled = false;
    (async () => {
      try {
        const payload = selectionToProductPayload(selection);
        const result = await fetchDemoCozeReview({
          productPayload: payload,
          additionalRequirements: payload.additionalRequirements,
        });
        if (!cancelled) setPreviewResult(result);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "演示结果加载失败");
        }
      } finally {
        if (!cancelled) setLoadingPreview(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [confirmSelection]);

  const selection = localSelection || selectionResult;

  return (
    <div className="space-y-8">
      <section className="panel p-5 md:p-6 animate-fade-up">
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-brand">
          SpecLens · 测试预览
        </p>
        <h1 className="mt-2 font-display text-3xl font-semibold">合规审查测试页</h1>
        <p className="mt-2 max-w-3xl text-sm text-[var(--ink-muted)]">
          本页自动载入软膜天花演示比选结构化结果，并预拉取一份标注为「当前为演示结果」的审查输出，便于直接查看字段映射与结果展示。
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href="/compliance">打开正式合规页</Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href="/compare">
              返回产品比选 <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>
      </section>

      {selection ? (
        <section className="panel p-5 md:p-6">
          <h2 className="font-display text-xl font-semibold">已载入演示选型</h2>
          <div className="mt-3 grid gap-2 text-sm md:grid-cols-2">
            <div>产品：{selection.productName}</div>
            <div>公司：{selection.supplierName}</div>
            <div>型号：{selection.model}</div>
            <div>综合评分：{selection.overallScore}</div>
          </div>
        </section>
      ) : null}

      <CozeReviewPanel selection={selection} />

      <section className="panel space-y-4 p-5 md:p-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-display text-xl font-semibold">预览区 · 演示审查结果</h2>
          <span className="rounded-md border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs text-amber-900">
            当前为演示结果
          </span>
        </div>
        {loadingPreview ? (
          <div className="flex items-center gap-2 text-sm text-[var(--ink-muted)]">
            <Loader2 className="h-4 w-4 animate-spin" />
            正在生成演示审查结果…
          </div>
        ) : error ? (
          <p className="text-sm text-red-700">{error}</p>
        ) : previewResult ? (
          <div className="space-y-4 text-sm">
            {previewResult.summary ? (
              <p className="text-[var(--ink-muted)]">{previewResult.summary}</p>
            ) : null}
            <div>
              <h3 className="font-semibold">审查意见列表</h3>
              <ul className="mt-2 space-y-3">
                {previewResult.opinions.map((op, idx) => (
                  <li key={op.id} className="rounded-md border border-[var(--line)] p-3">
                    <div className="font-medium">
                      {idx + 1}. {op.title}
                    </div>
                    <dl className="mt-2 space-y-1">
                      <div>
                        <dt className="text-[var(--ink-muted)]">问题</dt>
                        <dd>{op.problem}</dd>
                      </div>
                      <div>
                        <dt className="text-[var(--ink-muted)]">分析</dt>
                        <dd>{op.analysis}</dd>
                      </div>
                      <div>
                        <dt className="text-[var(--ink-muted)]">修改建议</dt>
                        <dd>{op.suggestion}</dd>
                      </div>
                    </dl>
                  </li>
                ))}
              </ul>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-md border border-[var(--line)] p-3">
                <h3 className="font-semibold">法律引用核验</h3>
                <ul className="mt-2 space-y-2">
                  {previewResult.legalCitations.map((item) => (
                    <li key={item.id}>
                      <div className="font-medium">{item.citation}</div>
                      <div className="text-xs text-[var(--ink-muted)]">状态：{item.status}</div>
                      <div>{item.detail}</div>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-md border border-[var(--line)] p-3">
                <h3 className="font-semibold">企业信息核验</h3>
                <ul className="mt-2 space-y-2">
                  {previewResult.enterpriseChecks.map((item) => (
                    <li key={item.id}>
                      <div className="font-medium">{item.name}</div>
                      <div className="text-xs text-[var(--ink-muted)]">状态：{item.status}</div>
                      <div>{item.detail}</div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="rounded-md border border-[var(--line)] p-3">
              <h3 className="font-semibold">飞书完整审查报告地址</h3>
              {previewResult.feishuReportUrl ? (
                <a
                  href={previewResult.feishuReportUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 inline-block text-brand underline-offset-2 hover:underline"
                >
                  {previewResult.feishuReportUrl}
                </a>
              ) : (
                <p className="mt-2 text-[var(--ink-muted)]">当前未返回飞书报告地址。</p>
              )}
            </div>
          </div>
        ) : null}
      </section>
    </div>
  );
}
