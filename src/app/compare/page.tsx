"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FileUpload } from "@/components/shared/file-upload";
import { AgentSteps } from "@/components/shared/agent-steps";
import { EvidenceSidebar, type EvidencePanelData } from "@/components/shared/evidence-sidebar";
import { ComparisonBars, ScoreBar } from "@/components/shared/score-bar";
import { getDemoProductDocuments, runCompareAnalysis } from "@/services/agents/compareAgent";
import { buildSelectionFromCompare } from "@/services/compare/pipeline";
import { useWorkspaceStore } from "@/store/workspace-store";
import { selectionToCsv } from "@/lib/export-report";
import type { Parameter, ProductScore } from "@/types/workspace";
import { downloadTextFile } from "@/lib/utils";

export default function ComparePage() {
  const productDocs = useWorkspaceStore((s) => s.productDocs);
  const setProductDocs = useWorkspaceStore((s) => s.setProductDocs);
  const updateProductDoc = useWorkspaceStore((s) => s.updateProductDoc);
  const comparePhase = useWorkspaceStore((s) => s.comparePhase);
  const setComparePhase = useWorkspaceStore((s) => s.setComparePhase);
  const compareSteps = useWorkspaceStore((s) => s.compareSteps);
  const setCompareSteps = useWorkspaceStore((s) => s.setCompareSteps);
  const compareResult = useWorkspaceStore((s) => s.compareResult);
  const setCompareResult = useWorkspaceStore((s) => s.setCompareResult);
  const editedScores = useWorkspaceStore((s) => s.editedScores);
  const updateDimensionScore = useWorkspaceStore((s) => s.updateDimensionScore);
  const selectedProductId = useWorkspaceStore((s) => s.selectedProductId);
  const setSelectedProductId = useWorkspaceStore((s) => s.setSelectedProductId);
  const reviewNotes = useWorkspaceStore((s) => s.reviewNotes);
  const setReviewNotes = useWorkspaceStore((s) => s.setReviewNotes);
  const confirmSelection = useWorkspaceStore((s) => s.confirmSelection);
  const selectionResult = useWorkspaceStore((s) => s.selectionResult);
  const projectName = useWorkspaceStore((s) => s.projectName);
  const resetCompare = useWorkspaceStore((s) => s.resetCompare);

  const [analyzing, setAnalyzing] = useState(false);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);
  const [evidence, setEvidence] = useState<EvidencePanelData | null>(null);
  const [markedErrors, setMarkedErrors] = useState<string[]>([]);

  const suppliers = useMemo(() => compareResult?.suppliers ?? [], [compareResult]);

  const paramKeys = useMemo(() => {
    if (!compareResult) return [];
    const map = new Map<string, string>();
    compareResult.parameters.forEach((p) => map.set(p.key, p.label));
    return Array.from(map.entries()).map(([key, label]) => ({ key, label }));
  }, [compareResult]);

  const selectedScore =
    editedScores?.find((s) => s.productId === selectedProductId) ?? null;

  const rankedScores = useMemo(() => {
    return [...(editedScores ?? [])].sort((a, b) => b.overall - a.overall);
  }, [editedScores]);

  function handleLoadDemo() {
    const docs = getDemoProductDocuments();
    setProductDocs(docs);
    setAnalyzeError(null);
  }

  function handleRetry(id: string) {
    updateProductDoc(id, { parseStatus: "pending", errorMessage: undefined });
  }

  async function handleAnalyze() {
    if (analyzing) return;
    setAnalyzeError(null);

    const docs = useWorkspaceStore.getState().productDocs;
    if (docs.length === 0) {
      setAnalyzeError("请先上传产品资料，或点击「载入 Demo 资料」进行演示。");
      return;
    }
    if (!docs.some((d) => d.textContent?.trim())) {
      setAnalyzeError(
        "上传文件中没有可读文本。请粘贴产品资料原文，或改用 TXT/CSV。系统不会编造参数。"
      );
      return;
    }

    setAnalyzing(true);
    setComparePhase("analyzing");
    try {
      const result = await runCompareAnalysis(docs, setCompareSteps);
      setCompareResult(result);
      const top = [...result.scores].sort((a, b) => b.overall - a.overall)[0];
      setSelectedProductId(top?.productId ?? null);
      setComparePhase("results");
    } catch (e) {
      setAnalyzeError(e instanceof Error ? e.message : "分析失败，请重试");
      setComparePhase("upload");
    } finally {
      setAnalyzing(false);
    }
  }

  function openParamEvidence(param: Parameter) {
    setEvidence({
      title: `${param.label}：${param.rawValue}`,
      subtitle: param.conflict?.message,
      evidence: param.conflict
        ? param.conflict.values.map((v) => v.evidence)
        : param.evidence,
      confidence: param.confidence,
      extra: param.conflict ? (
        <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          ⚠️ 参数冲突，需要人工确认。请对比来源后手工裁定，系统不会自动选择。
        </div>
      ) : param.needsReview ? (
        <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          ⚠️ 待确认 — 资料未提供、置信度较低或单位待确认。系统未编造该值。
        </div>
      ) : null,
    });
  }

  function openScoreEvidence(score: ProductScore, dimension: string) {
    const dim = score.dimensions.find((d) => d.dimension === dimension);
    if (!dim) return;
    setEvidence({
      title: `${dim.label}评分依据`,
      subtitle: `${score.supplierName} · ${dim.score} / ${dim.maxScore}`,
      evidence: dim.evidence,
      aiJudgment: dim.reasons.map((r) => r.text).join("；"),
      confidence: dim.confidence,
      extra: (
        <div className="panel p-4 text-sm">
          <div className="font-medium">评分理由（仅基于已提取字段）</div>
          <ul className="mt-2 space-y-1">
            {dim.reasons.map((r) => (
              <li key={r.text}>
                {r.type === "positive" ? "✓" : r.type === "warning" ? "⚠" : "✕"} {r.text}
              </li>
            ))}
          </ul>
        </div>
      ),
    });
  }

  function handleConfirm() {
    if (!selectedScore || !compareResult) return;
    const selection = buildSelectionFromCompare({
      result: compareResult,
      selected: selectedScore,
      projectName,
      humanNotes: reviewNotes,
      markedErrors,
    });
    confirmSelection(selection);
    setComparePhase("confirmed");
  }

  function handleExportParams() {
    if (!selectionResult) return;
    downloadTextFile(
      `selection-params-${selectionResult.model}.csv`,
      selectionToCsv(selectionResult),
      "text/csv;charset=utf-8"
    );
  }

  return (
    <div className="space-y-8">
      <section className="animate-fade-up">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="font-display text-3xl font-semibold">AI 产品比选</h1>
            <p className="mt-2 max-w-3xl text-sm text-[var(--ink-muted)] md:text-base">
              上传资料 → 结构化提取（公司/产品/单价/数量/厚度/幅宽/材质/防火/认证/VOC/资质/海外经验/交期/MOQ）→
              归一化（幅宽米、单价人民币、重量 kg/卷、中文）→ 六维评分 → 人工审核 → 合规审查。
              产品数量不限；只根据资料原文分析，不编造。
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={resetCompare}>
            <RotateCcw className="h-3.5 w-3.5" />
            重置流程
          </Button>
        </div>
      </section>

      {(comparePhase === "upload" || comparePhase === "analyzing") && (
        <section className="panel space-y-5 p-5 md:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-xl font-semibold">产品资料上传</h2>
              <p className="mt-1 text-sm text-[var(--ink-muted)]">
                上传几个产品就分析几个。可用「产品分组」区分；相同分组多文件会合并。
              </p>
            </div>
            <Button variant="outline" onClick={handleLoadDemo} disabled={analyzing}>
              载入 Demo 资料（含原文）
            </Button>
          </div>

          <FileUpload
            files={productDocs}
            onChange={setProductDocs}
            onRetry={handleRetry}
            category="product"
          />

          {analyzeError ? (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {analyzeError}
            </div>
          ) : null}

          <div className="flex flex-wrap gap-3">
            <Button onClick={() => void handleAnalyze()} disabled={analyzing}>
              {analyzing ? "AI 正在分析…" : "开始 AI 产品比选"}
            </Button>
            {productDocs.length > 0 ? (
              <Button variant="outline" onClick={() => setProductDocs([])} disabled={analyzing}>
                清空上传
              </Button>
            ) : null}
          </div>
        </section>
      )}

      {comparePhase === "analyzing" ? <AgentSteps steps={compareSteps} /> : null}

      {compareResult &&
      (comparePhase === "results" ||
        comparePhase === "review" ||
        comparePhase === "confirmed") ? (
        <>
          <section className="panel p-5 md:p-6">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-display text-xl font-semibold">产品参数对比</h2>
              <span className="text-sm text-[var(--ink-muted)]">
                共 {compareResult.products.length} 个产品
                {compareResult.demoMode ? " · 演示资料" : " · 用户上传资料"}
              </span>
            </div>
            <p className="mt-1 text-sm text-[var(--ink-muted)]">
              点击单元格查看来源。显示「资料中未提供」表示原文没有该字段，系统未编造。
            </p>
            <div className="mt-4 table-scroll">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="border-b border-[var(--line)] bg-[var(--surface)] text-[var(--ink-muted)]">
                  <tr>
                    <th className="px-3 py-2 font-medium">参数</th>
                    {suppliers.map((s) => (
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
                      {suppliers.map((s) => {
                        const param = compareResult.parameters.find(
                          (p) => p.key === pk.key && p.supplierId === s.id
                        );
                        if (!param) return <td key={s.id} className="px-3 py-2.5">—</td>;
                        return (
                          <td key={s.id} className="px-3 py-2.5">
                            <button
                              type="button"
                              className="text-left hover:text-brand hover:underline"
                              onClick={() => openParamEvidence(param)}
                            >
                              {param.rawValue}
                              {param.needsReview ? (
                                <span className="mt-1 block text-xs text-amber-700">⚠️ 待确认</span>
                              ) : null}
                            </button>
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
            <h2 className="font-display text-xl font-semibold">参数归一化分析</h2>
            <p className="mt-1 text-sm text-[var(--ink-muted)]">
              幅宽 → 米；单价 → 人民币；重量 → kg/卷；常见英文关键词 → 中文。无法确定时进入待确认。
            </p>
            <div className="mt-4 table-scroll">
              <table className="w-full min-w-[880px] text-left text-sm">
                <thead className="border-b border-[var(--line)] bg-[var(--surface)] text-[var(--ink-muted)]">
                  <tr>
                    <th className="px-3 py-2 font-medium">参数</th>
                    <th className="px-3 py-2 font-medium">供应商</th>
                    <th className="px-3 py-2 font-medium">原始值</th>
                    <th className="px-3 py-2 font-medium">标准化值</th>
                    <th className="px-3 py-2 font-medium">转换单位</th>
                    <th className="px-3 py-2 font-medium">转换规则</th>
                    <th className="px-3 py-2 font-medium">状态</th>
                  </tr>
                </thead>
                <tbody>
                  {compareResult.normalized.map((n) => {
                    const supplier =
                      suppliers.find((s) => s.id === n.supplierId)?.name ?? n.supplierId;
                    return (
                      <tr key={n.id} className="border-b border-[var(--line)]">
                        <td className="px-3 py-2.5">{n.label}</td>
                        <td className="px-3 py-2.5">{supplier}</td>
                        <td className="px-3 py-2.5">{n.originalValue}</td>
                        <td className="px-3 py-2.5">
                          {n.normalizedValue == null ? "—" : `${n.normalizedValue}`}
                        </td>
                        <td className="px-3 py-2.5">{n.normalizedUnit || "—"}</td>
                        <td className="px-3 py-2.5">{n.conversionRule || "—"}</td>
                        <td className="px-3 py-2.5">
                          {n.status === "normalized" ? (
                            <span className="text-emerald-700">已归一化</span>
                          ) : (
                            <span className="text-amber-700">⚠️ 待确认</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>

          <section className="panel p-5 md:p-6">
            <h2 className="font-display text-xl font-semibold">产品横向比较</h2>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              {compareResult.comparisons.map((metric) => (
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

          <section className="panel p-5 md:p-6">
            <h2 className="font-display text-xl font-semibold">六维综合评分</h2>
            <p className="mt-1 text-sm text-[var(--ink-muted)]">
              01 价格 · 02 合规性 · 03 企业特性 · 04 产品性能 · 05 重量/运输 · 06 供应能力。默认选中最高分。
            </p>

            <div className="mt-5 space-y-6">
              {rankedScores.map((score, idx) => (
                <div
                  key={score.productId}
                  className={`rounded-lg border p-4 ${
                    selectedProductId === score.productId
                      ? "border-brand bg-brand-soft/40"
                      : "border-[var(--line)]"
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="font-semibold">
                        {idx === 0 ? "最高分 · " : ""}
                        {score.supplierName} · {score.productName}
                      </div>
                      <div className="text-sm text-[var(--ink-muted)]">
                        综合评分 {score.overall} / 100
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant={selectedProductId === score.productId ? "default" : "outline"}
                      onClick={() => setSelectedProductId(score.productId)}
                    >
                      {selectedProductId === score.productId ? "当前推荐" : "选为推荐"}
                    </Button>
                  </div>

                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                    {score.dimensions.map((dim) => (
                      <div
                        key={dim.dimension}
                        className="rounded-md border border-[var(--line)] bg-white p-3"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="font-medium">{dim.label}</div>
                          <div className="text-sm">
                            {dim.score} / {dim.maxScore}
                          </div>
                        </div>
                        <ScoreBar score={dim.score} className="mt-2" />
                        <ul className="mt-2 space-y-1 text-xs text-[var(--ink-muted)]">
                          {dim.reasons.slice(0, 3).map((r) => (
                            <li key={r.text}>
                              {r.type === "positive" ? "✓" : r.type === "warning" ? "⚠" : "✕"}{" "}
                              {r.text}
                            </li>
                          ))}
                        </ul>
                        <div className="mt-3 flex flex-wrap items-center gap-2">
                          <label className="text-xs text-[var(--ink-muted)]">修改评分</label>
                          <input
                            type="number"
                            min={0}
                            max={100}
                            value={dim.score}
                            className="h-8 w-20 rounded-md border border-[var(--line)] px-2 text-sm"
                            onChange={(e) =>
                              updateDimensionScore(
                                score.productId,
                                dim.dimension,
                                Math.max(0, Math.min(100, Number(e.target.value) || 0))
                              )
                            }
                          />
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => openScoreEvidence(score, dim.dimension)}
                          >
                            查看评分依据
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {comparePhase !== "confirmed" ? (
            <section className="panel space-y-4 border-brand/30 p-5 md:p-6">
              <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                AI 生成结果仅供审核确认。人工审核通过后，才可进入合规审核模块。
              </div>
              <h2 className="font-display text-xl font-semibold">人工审核兜底</h2>
              <p className="text-sm text-[var(--ink-muted)]">
                请核对提取参数与六维评分，确认推荐产品后再进入下一步。
              </p>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="block text-sm">
                  <span className="mb-1 block text-[var(--ink-muted)]">人工备注</span>
                  <textarea
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                    className="min-h-28 w-full rounded-md border border-[var(--line)] px-3 py-2"
                    placeholder="例如：认可最高分方案的合规溢价；缺失 VOC 需供应商补件。"
                  />
                </label>
                <div className="text-sm">
                  <div className="mb-2 text-[var(--ink-muted)]">标记待确认项（点击添加）</div>
                  <div className="flex max-h-40 flex-wrap gap-2 overflow-y-auto">
                    {(compareResult.pendingItems ?? []).slice(0, 30).map((item) => {
                      const active = markedErrors.includes(item);
                      return (
                        <button
                          key={item}
                          type="button"
                          className={`rounded-md border px-2 py-1 text-left text-xs ${
                            active
                              ? "border-red-300 bg-red-50 text-red-700"
                              : "border-[var(--line)] bg-white"
                          }`}
                          onClick={() =>
                            setMarkedErrors((prev) =>
                              prev.includes(item)
                                ? prev.filter((x) => x !== item)
                                : [...prev, item]
                            )
                          }
                        >
                          {active ? "已标记 · " : ""}
                          {item}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <Button onClick={handleConfirm} disabled={!selectedScore}>
                人工审核通过并确认选型
              </Button>
            </section>
          ) : null}

          {comparePhase === "confirmed" && selectionResult ? (
            <section className="panel space-y-4 p-5 md:p-6 animate-fade-up">
              <h2 className="font-display text-xl font-semibold">最终选型结果</h2>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-md border border-[var(--line)] p-4 text-sm">
                  <div>推荐产品：{selectionResult.productName}</div>
                  <div className="mt-1">供应商：{selectionResult.supplierName}</div>
                  <div className="mt-1">型号：{selectionResult.model}</div>
                  <div className="mt-1">综合评分：{selectionResult.overallScore}</div>
                </div>
                <div className="rounded-md border border-[var(--line)] p-4 text-sm">
                  <div className="font-medium">六维评分</div>
                  <ul className="mt-2 space-y-1">
                    {selectionResult.dimensions.map((d) => (
                      <li key={d.dimension}>
                        {d.label} {d.score}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="rounded-md border border-[var(--line)] p-4 text-sm">
                <div className="font-medium">核心参数（来自资料提取）</div>
                <ul className="mt-2 grid gap-1 text-[var(--ink-muted)] md:grid-cols-2">
                  {selectionResult.coreParameters.map((p) => (
                    <li key={p.label}>
                      {p.label}：{p.value}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex flex-wrap gap-3">
                <Button variant="outline" onClick={handleExportParams}>
                  导出参数表
                </Button>
                <Button asChild>
                  <Link href="/compliance">
                    进入合规审核 <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </section>
          ) : null}
        </>
      ) : null}

      <EvidenceSidebar open={!!evidence} data={evidence} onClose={() => setEvidence(null)} />
    </div>
  );
}
