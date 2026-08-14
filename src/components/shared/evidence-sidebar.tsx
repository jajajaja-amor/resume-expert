"use client";

import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Evidence } from "@/types/workspace";

export interface EvidencePanelData {
  title: string;
  subtitle?: string;
  evidence: Evidence[];
  aiJudgment?: string;
  confidence?: number;
  extra?: React.ReactNode;
}

export function EvidenceSidebar({
  open,
  data,
  onClose,
}: {
  open: boolean;
  data: EvidencePanelData | null;
  onClose: () => void;
}) {
  if (!open || !data) return null;

  return (
    <>
      <button
        type="button"
        aria-label="关闭来源面板"
        className="fixed inset-0 z-40 bg-black/20"
        onClick={onClose}
      />
      <aside className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md animate-fade-up flex-col border-l border-[var(--line)] bg-white shadow-xl">
        <div className="flex items-start justify-between gap-3 border-b border-[var(--line)] px-5 py-4">
          <div>
            <div className="text-xs font-medium uppercase tracking-wide text-brand">
              参数来源 / Evidence
            </div>
            <h3 className="mt-1 font-display text-lg font-semibold text-[var(--ink)]">
              {data.title}
            </h3>
            {data.subtitle ? (
              <p className="mt-1 text-sm text-[var(--ink-muted)]">{data.subtitle}</p>
            ) : null}
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="关闭">
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
          {data.evidence.length === 0 ? (
            <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
              ⚠️ 缺少证据，请人工确认
            </div>
          ) : (
            data.evidence.map((ev, idx) => (
              <div key={`${ev.sourceDocument}-${idx}`} className="panel p-4">
                <div className="text-xs font-medium text-brand">来源 {idx + 1}</div>
                <dl className="mt-3 space-y-2 text-sm">
                  <div>
                    <dt className="text-[var(--ink-muted)]">文件名称</dt>
                    <dd className="font-medium">{ev.sourceDocument}</dd>
                  </div>
                  {ev.page != null ? (
                    <div>
                      <dt className="text-[var(--ink-muted)]">页码</dt>
                      <dd>第 {ev.page} 页</dd>
                    </div>
                  ) : null}
                  {ev.section ? (
                    <div>
                      <dt className="text-[var(--ink-muted)]">章节</dt>
                      <dd>{ev.section}</dd>
                    </div>
                  ) : null}
                  <div>
                    <dt className="text-[var(--ink-muted)]">原文</dt>
                    <dd className="rounded-md bg-[var(--surface)] p-2 text-[var(--ink)]">
                      “{ev.originalText}”
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[var(--ink-muted)]">AI 提取值</dt>
                    <dd className="font-medium">{ev.extractedValue}</dd>
                  </div>
                  <div>
                    <dt className="text-[var(--ink-muted)]">AI 置信度</dt>
                    <dd>{ev.confidence}%</dd>
                  </div>
                </dl>
              </div>
            ))
          )}

          {data.aiJudgment ? (
            <div className="panel p-4">
              <div className="text-xs font-medium text-brand">AI 判断</div>
              <p className="mt-2 text-sm leading-relaxed">{data.aiJudgment}</p>
              {data.confidence != null ? (
                <p className="mt-2 text-sm text-[var(--ink-muted)]">
                  AI 置信度：{data.confidence}%
                </p>
              ) : null}
            </div>
          ) : null}

          {data.extra}
        </div>
      </aside>
    </>
  );
}
