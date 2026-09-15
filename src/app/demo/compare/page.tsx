"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ComparisonBars, ScoreBar } from "@/components/shared/score-bar";
import { getDemoProductDocuments, runCompareAnalysis } from "@/services/agents/compareAgent";
import type { CompareAnalysisResult } from "@/types/workspace";

/**
 * Standalone preview: auto-run product compare on demo dossier texts.
 */
export default function CompareTestPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CompareAnalysisResult | null>(null);

  async function runDemo() {
    setLoading(true);
    setError(null);
    try {
      const docs = getDemoProductDocuments();
      const next = await runCompareAnalysis(docs);
      setResult(next);
    } catch (e) {
      setError(e instanceof Error ? e.message : "演示分析失败");
      setResult(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void runDemo();
  }, []);

  const ranked = useMemo(
    () => [...(result?.scores ?? [])].sort((a, b) => b.overall - a.overall),
    [result]
  );

  const paramKeys = useMemo(() => {
    if (!result) return [];
    const map = new Map<string, string>();
    result.parameters.forEach((p) => map.set(p.key, p.label));
    return Array.from(map.entries()).map(([key, label]) => ({ key, label }));
  }, [result]);

  return (
    <div className="space-y-8">
      <section className="panel p-5 md:p-6 animate-fade-up">
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-brand">
          SpecLens · 测试预览
        </p>
        <h1 className="mt-2 font-display text-3xl font-semibold">产品比选测试页</h1>
        <p className="mt-2 max-w-3xl text-sm text-[var(--ink-muted)]">
          自动载入 3 份演示产品原文，走完整流水线：结构化提取 → 归一化（米 / 人民币 / kg/卷）→
          六维评分。缺失字段会显示「资料中未提供」，不会编造。
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button onClick={() => void runDemo()} disabled={loading} variant="outline" size="sm">
            <RefreshCw className="h-3.5 w-3.5" />
            重新跑一遍
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href="/compare">打开正式比选页</Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href="/demo/compliance">
              合规测试页 <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>
      </section>

      {loading ? (
        <section className="panel flex min-h-40 items-center justify-center gap-2 p-6 text-sm text-[var(--ink-muted)]">
          <Loader2 className="h-4 w-4 animate-spin" />
          正在解析演示资料并计算六维评分…
        </section>
      ) : null}

      {error ? (
        <section className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          {error}
          <div className="mt-3">
            <Button size="sm" variant="outline" onClick={() => void runDemo()}>
              重试
            </Button>
          </div>
        </section>
      ) : null}

      {result && !loading ? (
        <>
          <section className="panel p-5 md:p-6">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-display text-xl font-semibold">提取参数对比</h2>
              <span className="rounded-md border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs text-amber-900">
                当前为演示结果 · {result.products.length} 个产品
              </span>
            </div>
            <div className="mt-4 table-scroll">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="border-b border-[var(--line)] bg-[var(--surface)] text-[var(--ink-muted)]">
                  <tr>
                    <th className="px-3 py-2 font-medium">参数</th>
                    {result.suppliers.map((s) => (
                      <th key={s.id} className="px-3 py-2 font-medium">
                        {s.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {paramKeys.map((pk) => (
                    <tr key={pk.key} className="border-b border-[var(--line)]">
                      <td className="px-3 py-2.5 font-medium">{pk.label}</td>
                      {result.suppliers.map((s) => {
                        const param = result.parameters.find(
                          (p) => p.key === pk.key && p.supplierId === s.id
                        );
                        return (
                          <td key={s.id} className="px-3 py-2.5">
                            {param?.rawValue || "—"}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="panel p-5 md:p-6">
            <h2 className="font-display text-xl font-semibold">归一化示例（幅宽 / 单价 / 重量）</h2>
            <div className="mt-4 table-scroll">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead className="border-b border-[var(--line)] bg-[var(--surface)] text-[var(--ink-muted)]">
                  <tr>
                    <th className="px-3 py-2 font-medium">参数</th>
                    <th className="px-3 py-2 font-medium">供应商</th>
                    <th className="px-3 py-2 font-medium">原始值</th>
                    <th className="px-3 py-2 font-medium">标准化</th>
                    <th className="px-3 py-2 font-medium">规则</th>
                  </tr>
                </thead>
                <tbody>
                  {result.normalized
                    .filter((n) => ["width", "unit_price", "weight"].includes(n.parameterKey))
                    .map((n) => (
                      <tr key={n.id} className="border-b border-[var(--line)]">
                        <td className="px-3 py-2.5">{n.label}</td>
                        <td className="px-3 py-2.5">
                          {result.suppliers.find((s) => s.id === n.supplierId)?.name}
                        </td>
                        <td className="px-3 py-2.5">{n.originalValue}</td>
                        <td className="px-3 py-2.5">
                          {n.normalizedValue == null
                            ? "—"
                            : `${n.normalizedValue}${n.normalizedUnit ? ` ${n.normalizedUnit}` : ""}`}
                        </td>
                        <td className="px-3 py-2.5 text-[var(--ink-muted)]">
                          {n.conversionRule || "—"}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="panel p-5 md:p-6">
            <h2 className="font-display text-xl font-semibold">六维综合评分（默认最高分靠前）</h2>
            <div className="mt-5 space-y-5">
              {ranked.map((score, idx) => (
                <div key={score.productId} className="rounded-lg border border-[var(--line)] p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <div className="font-semibold">
                        {idx === 0 ? "最高分 · " : ""}
                        {score.supplierName} · {score.productName}
                      </div>
                      <div className="text-sm text-[var(--ink-muted)]">
                        综合 {score.overall} / 100
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    {score.dimensions.map((dim) => (
                      <div key={dim.dimension} className="rounded-md bg-[var(--surface)] p-3">
                        <div className="flex justify-between text-sm">
                          <span className="font-medium">{dim.label}</span>
                          <span>
                            {dim.score}/{dim.maxScore}
                          </span>
                        </div>
                        <ScoreBar score={dim.score} className="mt-2" />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="panel p-5 md:p-6">
            <h2 className="font-display text-xl font-semibold">横向比较条</h2>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              {result.comparisons.map((metric) => (
                <div key={metric.key} className="rounded-md border border-[var(--line)] p-4">
                  <div className="mb-3 text-sm font-semibold">{metric.label}</div>
                  <ComparisonBars
                    values={metric.values.map((v) => ({
                      label: v.supplierName,
                      raw: v.raw,
                      score: v.score,
                    }))}
                  />
                </div>
              ))}
            </div>
          </section>
        </>
      ) : null}
    </div>
  );
}
