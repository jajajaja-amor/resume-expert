"use client";

import { useWorkspaceStore } from "@/store/workspace-store";

export function DemoBanner() {
  const dismissed = useWorkspaceStore((s) => s.demoBannerDismissed);
  const setDismissed = useWorkspaceStore((s) => s.setDemoBannerDismissed);

  if (dismissed) return null;

  return (
    <div className="border-b border-amber-200 bg-amber-50">
      <div className="mx-auto flex max-w-6xl items-start justify-between gap-3 px-4 py-2.5 text-sm text-amber-900 md:px-6">
        <p>
          <span className="font-medium">当前为演示模式，以下数据为模拟数据。</span>
          {" "}
          未配置真实 Agent API 时，系统使用内置「软膜天花 / 建筑装饰材料」演示数据完整跑通流程。AI 判断仅供审核确认，不能替代正式合规结论。
        </p>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="shrink-0 text-amber-800 underline-offset-2 hover:underline"
        >
          知道了
        </button>
      </div>
    </div>
  );
}
