import { Info } from "lucide-react";

export function DemoBanner({ text }: { text?: string }) {
  return (
    <div className="no-print flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
      <Info className="mt-0.5 h-4 w-4 shrink-0" />
      <span>{text ?? "当前为演示模式，以下数据为模拟数据，不构成真实合规判断。"}</span>
    </div>
  );
}
