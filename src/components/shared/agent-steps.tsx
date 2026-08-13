import { Check, Loader2 } from "lucide-react";
import { AgentStep } from "@/types/domain";
import { cn } from "@/lib/utils";

/** Agent 工作步骤进度展示（非单一 Spinner）。 */
export function AgentSteps({ steps }: { steps: AgentStep[] }) {
  return (
    <ol className="space-y-2">
      {steps.map((step) => (
        <li key={step.id} className="flex items-center gap-3 text-sm">
          <span
            className={cn(
              "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border",
              step.status === "done" && "border-emerald-500 bg-emerald-500 text-white",
              step.status === "running" && "border-blue-500 text-blue-600",
              step.status === "pending" && "border-border text-transparent"
            )}
          >
            {step.status === "done" && <Check className="h-3 w-3" />}
            {step.status === "running" && <Loader2 className="h-3 w-3 animate-spin" />}
          </span>
          <span
            className={cn(
              step.status === "done" && "text-foreground",
              step.status === "running" && "font-medium text-blue-700",
              step.status === "pending" && "text-muted-foreground"
            )}
          >
            {step.label}
          </span>
          {step.status === "running" && (
            <span className="text-xs text-blue-600">正在处理</span>
          )}
          {step.status === "done" && (
            <span className="text-xs text-emerald-600">已完成</span>
          )}
        </li>
      ))}
    </ol>
  );
}
