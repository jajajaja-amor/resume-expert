import { Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AgentStep } from "@/types/workspace";

export function AgentSteps({ steps, title = "Agent 工作步骤" }: { steps: AgentStep[]; title?: string }) {
  return (
    <div className="panel p-5 animate-fade-up">
      <h3 className="font-display text-base font-semibold">{title}</h3>
      <ul className="mt-4 space-y-3">
        {steps.map((step) => {
          const done = step.status === "done";
          const processing = step.status === "processing";
          return (
            <li key={step.id} className="flex items-center justify-between gap-3 text-sm">
              <div className="flex min-w-0 items-center gap-2">
                <span
                  className={cn(
                    "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border",
                    done && "border-emerald-300 bg-emerald-50 text-emerald-700",
                    processing && "border-blue-300 bg-blue-50 text-blue-700",
                    !done && !processing && "border-[var(--line)] bg-white text-neutral-400"
                  )}
                >
                  {done ? (
                    <Check className="h-3.5 w-3.5" />
                  ) : processing ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <span className="h-1.5 w-1.5 rounded-full bg-neutral-300" />
                  )}
                </span>
                <span className={cn(processing && "font-medium text-blue-700")}>{step.label}</span>
              </div>
              <span
                className={cn(
                  "shrink-0 text-xs",
                  done && "text-emerald-700",
                  processing && "text-blue-700",
                  !done && !processing && "text-neutral-400"
                )}
              >
                {done ? "已完成" : processing ? "正在处理" : "等待中"}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
