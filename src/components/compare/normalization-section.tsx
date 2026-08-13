"use client";

import { ArrowRight } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AiStatusBadge } from "@/components/shared/status-badge";
import { useWorkspaceStore } from "@/store/workspace-store";

export function NormalizationSection() {
  const normalized = useWorkspaceStore((s) => s.normalized);
  const suppliers = useWorkspaceStore((s) => s.suppliers);

  if (normalized.length === 0) return null;

  const supplierName = (id: string) =>
    suppliers.find((s) => s.id === id)?.shortName ?? id;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">3. 参数归一化分析</CardTitle>
        <CardDescription>
          不同供应商使用不同单位时自动转换（mm/cm/m、g/kg、㎡/sqft、USD/EUR/CNY），
          保留原始值与转换规则。无法确定单位时标记为待确认，不自动猜测。
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {normalized.map((n) => (
          <div key={n.key} className="rounded-md border p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-medium">{n.label}</p>
              <span className="text-xs text-muted-foreground">
                目标单位：{n.targetUnit}
              </span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">转换规则：{n.rule}</p>
            <div className="mt-3 grid gap-2 sm:grid-cols-3">
              {n.entries.map((e) => (
                <div
                  key={e.supplierId}
                  className="rounded-md border bg-muted/30 px-3 py-2.5 text-sm"
                >
                  <p className="text-xs text-muted-foreground">{supplierName(e.supplierId)}</p>
                  <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                    <span className="text-muted-foreground">{e.originalValue}</span>
                    <ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                    {e.status === "ok" ? (
                      <span className="font-semibold text-primary">{e.normalizedValue}</span>
                    ) : (
                      <AiStatusBadge status={e.status} />
                    )}
                  </div>
                  {e.note && (
                    <p className="mt-2 rounded border border-amber-200 bg-amber-50 px-2 py-1.5 text-[11px] leading-4 text-amber-800">
                      {e.note}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
