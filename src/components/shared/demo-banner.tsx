"use client";

import { useWorkspaceStore } from "@/store/workspace-store";

export function DemoBanner() {
  const dismissed = useWorkspaceStore((s) => s.demoBannerDismissed);
  const setDismissed = useWorkspaceStore((s) => s.setDemoBannerDismissed);

  if (dismissed) return null;

  return (
    <div className="border-b border-emerald-200 bg-emerald-50">
      <div className="mx-auto flex max-w-6xl items-start justify-between gap-3 px-4 py-2.5 text-sm text-emerald-950 md:px-6">
        <p>
          <span className="font-medium">这是可操作的 SpecLens 智能体工作台。</span>{" "}
          请上传 PDF/DOCX/XLSX/TXT，系统会真实解析原文、提取参数、归一化并六维评分；缺失字段显示「资料中未提供」，不会编造。未配置
          LLM / 扣子密钥时，仍走完整交互链路（规则解析 + 可选演示合规结果）。
        </p>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="shrink-0 text-emerald-900 underline-offset-2 hover:underline"
        >
          知道了
        </button>
      </div>
    </div>
  );
}
