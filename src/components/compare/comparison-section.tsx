"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useWorkspaceStore } from "@/store/workspace-store";

const BAR_COLORS = ["bg-primary", "bg-teal-500", "bg-cyan-600"];

export function ComparisonSection() {
  const comparison = useWorkspaceStore((s) => s.comparison);
  const suppliers = useWorkspaceStore((s) => s.suppliers);

  if (comparison.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">4. 产品横向比较</CardTitle>
        <CardDescription>
          注意不同指标的评价方向：数值大不代表更好。条形长度表示该维度下的相对表现（已按评价方向换算）。
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 lg:grid-cols-2">
          {comparison.map((m) => (
            <div key={m.key} className="rounded-md border p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-medium">{m.label}</p>
                <Badge
                  variant={m.direction === "project-dependent" ? "warning" : "secondary"}
                  className="font-normal"
                >
                  {m.directionLabel}
                </Badge>
              </div>
              <div className="mt-3 space-y-2.5">
                {suppliers.map((s, i) => {
                  const v = m.values[s.id] ?? 0;
                  return (
                    <div key={s.id}>
                      <div className="flex flex-wrap items-center justify-between gap-x-2 text-xs">
                        <span className="font-medium">{s.shortName}</span>
                        <span className="text-muted-foreground">{m.displayValues[s.id]}</span>
                      </div>
                      <div className="mt-1 h-2.5 w-full overflow-hidden rounded-full bg-muted">
                        <div
                          className={`h-full rounded-full ${BAR_COLORS[i % BAR_COLORS.length]}`}
                          style={{ width: `${v}%`, opacity: 0.55 + (v / 100) * 0.45 }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
