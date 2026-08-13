import { AlertTriangle, FileText } from "lucide-react";
import { Evidence } from "@/types/domain";

/** Evidence 展示卡片列表：来源文件 / 页码 / 章节 / 原文 / 提取值 / 置信度。 */
export function EvidenceList({
  evidence,
  emptyHint,
}: {
  evidence: Evidence[];
  emptyHint?: string;
}) {
  if (evidence.length === 0) {
    return (
      <div className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm text-amber-800">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
        <span>{emptyHint ?? "缺少证据，请人工确认。AI 未找到可引用的来源，不会编造来源。"}</span>
      </div>
    );
  }
  return (
    <div className="space-y-3">
      {evidence.map((e, i) => (
        <div key={i} className="rounded-md border bg-muted/40 p-3 text-sm">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
            <FileText className="h-3.5 w-3.5" />
            <span className="font-medium text-foreground">{e.sourceDocument}</span>
            {e.page !== null && <span>第 {e.page} 页</span>}
            {e.section && <span>· {e.section}</span>}
          </div>
          <blockquote className="mt-2 border-l-2 border-primary/40 pl-2 text-[13px] italic text-foreground/80">
            “{e.originalText}”
          </blockquote>
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
            <span>
              AI 提取值：<span className="font-medium">{e.extractedValue}</span>
            </span>
            <span>
              AI 置信度：<span className="font-medium">{e.confidence}%</span>
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
