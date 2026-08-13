"use client";

import { AlertTriangle, Check, CheckCircle2, Pencil } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { EvidenceList } from "@/components/shared/evidence-list";
import { SidePanel } from "@/components/shared/side-panel";
import { SCORE_DIMENSIONS, ScoreDimensionKey } from "@/types/domain";
import { cn } from "@/lib/utils";
import { overallScoreOf, overriddenScore, useWorkspaceStore } from "@/store/workspace-store";

interface ActiveDim {
  supplierId: string;
  dimension: ScoreDimensionKey;
}

export function ScoreSection() {
  const suppliers = useWorkspaceStore((s) => s.suppliers);
  const scores = useWorkspaceStore((s) => s.scores);
  const scoreOverrides = useWorkspaceStore((s) => s.scoreOverrides);
  const setScoreOverride = useWorkspaceStore((s) => s.setScoreOverride);
  const reviewerNote = useWorkspaceStore((s) => s.reviewerNote);
  const setReviewerNote = useWorkspaceStore((s) => s.setReviewerNote);
  const confirmSelection = useWorkspaceStore((s) => s.confirmSelection);
  const selection = useWorkspaceStore((s) => s.selection);

  const [active, setActive] = useState<ActiveDim | null>(null);
  const [editScore, setEditScore] = useState("");
  const [editingScore, setEditingScore] = useState(false);
  const [chosenSupplier, setChosenSupplier] = useState<string | null>(null);

  if (scores.length === 0) return null;

  const state = { scores, scoreOverrides };
  const ranked = [...suppliers].sort(
    (a, b) => overallScoreOf(state, b.id) - overallScoreOf(state, a.id)
  );
  const recommendedId = ranked[0]?.id;
  const selectedId = chosenSupplier ?? recommendedId;

  const activeScore = active
    ? scores
        .find((s) => s.supplierId === active.supplierId)
        ?.dimensions.find((d) => d.dimension === active.dimension)
    : null;
  const activeSupplier = active ? suppliers.find((s) => s.id === active.supplierId) : null;
  const activeDimLabel = active
    ? SCORE_DIMENSIONS.find((d) => d.key === active.dimension)?.label
    : "";

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">5. 六维综合评分</CardTitle>
        <CardDescription>
          价格 / 合规性 / 企业特性 / 产品性能 / 重量运输 / 供应能力。点击「查看评分依据」可追溯来源，并可人工修改评分。
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 lg:grid-cols-3">
          {ranked.map((sup) => {
            const overall = overallScoreOf(state, sup.id);
            const isRecommended = sup.id === recommendedId;
            return (
              <div
                key={sup.id}
                className={cn(
                  "rounded-lg border p-4",
                  isRecommended && "border-primary/50 bg-accent/40"
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold">{sup.shortName}</p>
                    <p className="text-xs text-muted-foreground">{sup.name}</p>
                    <p className="text-xs text-muted-foreground">{sup.model}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-primary">{overall}</p>
                    <p className="text-[10px] text-muted-foreground">综合评分</p>
                    {isRecommended && <Badge variant="success" className="mt-1">AI 推荐</Badge>}
                  </div>
                </div>
                <div className="mt-4 space-y-3">
                  {SCORE_DIMENSIONS.map((dim) => {
                    const score = overriddenScore(state, sup.id, dim.key);
                    const overridden = `${sup.id}:${dim.key}` in scoreOverrides;
                    return (
                      <div key={dim.key}>
                        <div className="flex items-center justify-between gap-2 text-xs">
                          <span>
                            <span className="mr-1 text-[10px] text-muted-foreground">{dim.index}</span>
                            {dim.label}
                          </span>
                          <span className="flex items-center gap-1.5">
                            {overridden && (
                              <span className="text-[10px] text-primary">人工修改</span>
                            )}
                            <span className="font-semibold">{score} / 100</span>
                          </span>
                        </div>
                        <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-muted">
                          <div
                            className={cn(
                              "h-full rounded-full",
                              score >= 85 ? "bg-emerald-500" : score >= 70 ? "bg-amber-500" : "bg-red-400"
                            )}
                            style={{ width: `${score}%` }}
                          />
                        </div>
                        <button
                          type="button"
                          className="mt-1 text-[11px] text-primary underline-offset-2 hover:underline"
                          onClick={() => {
                            setActive({ supplierId: sup.id, dimension: dim.key });
                            setEditingScore(false);
                          }}
                        >
                          查看评分依据
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* 人工审核 */}
        <div className="rounded-lg border border-amber-200 bg-amber-50/50 p-4 sm:p-5">
          <div className="flex flex-wrap items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <h3 className="font-semibold">AI 分析完成，请确认选型结果</h3>
            <Badge variant="warning">AI 生成结果，仅供审核确认</Badge>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            您可以接受 AI 评分、点击「查看评分依据」修改评分、在参数表中修改参数或标记错误，并添加审核备注。确认后将生成选型结果（SelectionResult），作为合规审核阶段的输入。
          </p>

          <div className="mt-4">
            <p className="mb-2 text-xs font-medium text-muted-foreground">选择最终产品</p>
            <div className="grid gap-2 sm:grid-cols-3">
              {ranked.map((sup) => (
                <button
                  key={sup.id}
                  type="button"
                  onClick={() => setChosenSupplier(sup.id)}
                  className={cn(
                    "flex items-center justify-between gap-2 rounded-md border bg-white px-3 py-2.5 text-left text-sm transition-colors",
                    selectedId === sup.id
                      ? "border-primary ring-1 ring-primary"
                      : "hover:border-muted-foreground/40"
                  )}
                >
                  <span>
                    <span className="font-medium">{sup.shortName}</span>
                    <span className="ml-1.5 text-xs text-muted-foreground">{sup.model}</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="text-sm font-semibold text-primary">
                      {overallScoreOf(state, sup.id)}
                    </span>
                    {selectedId === sup.id && <Check className="h-4 w-4 text-primary" />}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="mt-4">
            <p className="mb-1.5 text-xs font-medium text-muted-foreground">审核备注（可选）</p>
            <Textarea
              value={reviewerNote}
              onChange={(e) => setReviewerNote(e.target.value)}
              placeholder="例如：已与项目经理确认价格差异可接受；供应商 A 声学报告下周补充。"
              rows={2}
              className="bg-white"
            />
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Button onClick={() => selectedId && confirmSelection(selectedId)}>
              <CheckCircle2 /> 确认产品选型
            </Button>
            {selection && (
              <span className="flex items-center gap-1 text-sm text-emerald-700">
                <Check className="h-4 w-4" /> 已确认：{selection.supplierName} {selection.model}
              </span>
            )}
          </div>
        </div>
      </CardContent>

      {/* 评分依据侧边栏 */}
      <SidePanel open={Boolean(active)} title="评分依据" onClose={() => setActive(null)}>
        {active && activeScore && activeSupplier && (
          <div className="space-y-4 text-sm">
            <div>
              <p className="text-xs text-muted-foreground">
                {activeSupplier.shortName} · {activeSupplier.name}
              </p>
              <p className="mt-1 text-lg font-semibold">
                {activeDimLabel}：{overriddenScore(state, active.supplierId, active.dimension)} / 100
              </p>
              <p className="text-xs text-muted-foreground">
                AI 原始评分：{activeScore.score} · AI 置信度：{activeScore.confidence}%
              </p>
            </div>

            <div>
              <p className="mb-2 text-xs font-medium text-muted-foreground">评分理由</p>
              <ul className="space-y-1.5">
                {activeScore.reasons.map((r, i) => (
                  <li key={i} className="flex items-start gap-2">
                    {r.type === "positive" ? (
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                    ) : (
                      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                    )}
                    <span>{r.text}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <p className="mb-2 text-xs font-medium text-muted-foreground">来源</p>
              <EvidenceList evidence={activeScore.evidence} />
            </div>

            <div className="space-y-2 border-t pt-4">
              <p className="text-xs font-medium text-muted-foreground">人工修改评分</p>
              {editingScore ? (
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    value={editScore}
                    onChange={(e) => setEditScore(e.target.value)}
                    className="w-28"
                  />
                  <span className="text-xs text-muted-foreground">/ 100</span>
                  <Button
                    size="sm"
                    onClick={() => {
                      const n = Number(editScore);
                      if (!Number.isNaN(n)) {
                        setScoreOverride(active.supplierId, active.dimension, n);
                      }
                      setEditingScore(false);
                    }}
                  >
                    保存
                  </Button>
                </div>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setEditScore(
                      String(overriddenScore(state, active.supplierId, active.dimension))
                    );
                    setEditingScore(true);
                  }}
                >
                  <Pencil /> 修改评分
                </Button>
              )}
              <p className="text-[11px] text-muted-foreground">
                修改后的评分会重新计算综合评分，并记入选型结果。
              </p>
            </div>
          </div>
        )}
      </SidePanel>
    </Card>
  );
}
