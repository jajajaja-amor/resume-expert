"use client";

import { Flag, Pencil } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { EvidenceList } from "@/components/shared/evidence-list";
import { SidePanel } from "@/components/shared/side-panel";
import { AiStatusBadge } from "@/components/shared/status-badge";
import { buildParameterTableMarkdown, downloadFile } from "@/lib/export";
import { cn } from "@/lib/utils";
import { useWorkspaceStore } from "@/store/workspace-store";

interface CellRef {
  paramKey: string;
  supplierId: string;
}

export function ParameterTable() {
  const suppliers = useWorkspaceStore((s) => s.suppliers);
  const parameters = useWorkspaceStore((s) => s.parameters);
  const overrides = useWorkspaceStore((s) => s.parameterOverrides);
  const flagged = useWorkspaceStore((s) => s.flaggedParameters);
  const setOverride = useWorkspaceStore((s) => s.setParameterOverride);
  const toggleFlag = useWorkspaceStore((s) => s.toggleFlagParameter);

  const [active, setActive] = useState<CellRef | null>(null);
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState("");

  if (parameters.length === 0) return null;

  const activeParam = active ? parameters.find((p) => p.key === active.paramKey) : null;
  const activeValue = active && activeParam ? activeParam.values[active.supplierId] : null;
  const activeSupplier = active ? suppliers.find((s) => s.id === active.supplierId) : null;
  const activeOverride = active ? overrides[`${active.paramKey}:${active.supplierId}`] : undefined;
  const activeFlagged = active ? Boolean(flagged[`${active.paramKey}:${active.supplierId}`]) : false;

  const exportTable = () => {
    const md = buildParameterTableMarkdown(
      suppliers.map((s) => `${s.shortName}（${s.name}）`),
      parameters.map((p) => ({
        label: p.label,
        values: suppliers.map(
          (s) => overrides[`${p.key}:${s.id}`] ?? p.values[s.id]?.result ?? "-"
        ),
      }))
    );
    downloadFile("产品参数对比表.md", md, "text/markdown");
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <CardTitle className="text-base">2. 产品参数对比</CardTitle>
            <CardDescription className="mt-1">
              点击任意参数值可查看来源原文、AI 置信度，并可人工修改或标记错误。
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={exportTable}>
            导出参数表
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto rounded-md border">
          <table className="w-full min-w-[760px] text-sm">
            <thead>
              <tr className="border-b bg-muted/40 text-left text-xs text-muted-foreground">
                <th className="px-3 py-2.5 font-medium">参数</th>
                {suppliers.map((s) => (
                  <th key={s.id} className="px-3 py-2.5 font-medium">
                    <div className="text-foreground">{s.shortName}</div>
                    <div className="mt-0.5 font-normal">{s.name}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {parameters.map((p) => (
                <tr key={p.key} className="border-b last:border-0">
                  <td className="whitespace-nowrap px-3 py-2.5 font-medium">
                    {p.label}
                    <span className="ml-2 rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                      {p.group}
                    </span>
                  </td>
                  {suppliers.map((s) => {
                    const v = p.values[s.id];
                    const key = `${p.key}:${s.id}`;
                    const overrideValue = overrides[key];
                    const isFlagged = Boolean(flagged[key]);
                    return (
                      <td key={s.id} className="px-3 py-2.5">
                        <button
                          type="button"
                          onClick={() => {
                            setActive({ paramKey: p.key, supplierId: s.id });
                            setEditing(false);
                          }}
                          className={cn(
                            "group w-full rounded-md border border-transparent px-2 py-1.5 text-left transition-colors hover:border-border hover:bg-muted/60",
                            isFlagged && "border-red-200 bg-red-50/60"
                          )}
                        >
                          <span className={cn(overrideValue !== undefined && "text-primary")}>
                            {overrideValue ?? v?.result ?? "-"}
                          </span>
                          <div className="mt-1 flex flex-wrap items-center gap-1.5">
                            {v && v.status !== "ok" && <AiStatusBadge status={v.status} />}
                            {overrideValue !== undefined && (
                              <span className="text-[10px] text-primary">人工修改</span>
                            )}
                            {isFlagged && (
                              <span className="text-[10px] text-red-600">已标记错误</span>
                            )}
                          </div>
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>

      <SidePanel
        open={Boolean(active)}
        title="参数来源"
        onClose={() => setActive(null)}
      >
        {active && activeParam && activeSupplier && (
          <div className="space-y-4 text-sm">
            <div>
              <p className="text-xs text-muted-foreground">参数</p>
              <p className="mt-0.5 font-semibold">
                {activeParam.label}：{activeOverride ?? activeValue?.result ?? "-"}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {activeSupplier.shortName} · {activeSupplier.name}
              </p>
              {activeValue && (
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <AiStatusBadge status={activeValue.status} />
                  <span className="text-xs text-muted-foreground">
                    AI 置信度：{activeValue.confidence}%
                  </span>
                </div>
              )}
              {activeValue?.note && (
                <p className="mt-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                  {activeValue.note}
                </p>
              )}
            </div>

            <div>
              <p className="mb-2 text-xs font-medium text-muted-foreground">来源</p>
              <EvidenceList evidence={activeValue?.evidence ?? []} />
            </div>

            <div className="space-y-2 border-t pt-4">
              <p className="text-xs font-medium text-muted-foreground">人工审核操作</p>
              {editing ? (
                <div className="flex items-center gap-2">
                  <Input
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    placeholder="输入修正后的参数值"
                  />
                  <Button
                    size="sm"
                    onClick={() => {
                      if (editValue.trim()) {
                        setOverride(active.paramKey, active.supplierId, editValue.trim());
                      }
                      setEditing(false);
                    }}
                  >
                    保存
                  </Button>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEditValue(activeOverride ?? activeValue?.result ?? "");
                      setEditing(true);
                    }}
                  >
                    <Pencil /> 修改参数值
                  </Button>
                  <Button
                    variant={activeFlagged ? "secondary" : "outline"}
                    size="sm"
                    onClick={() => toggleFlag(active.paramKey, active.supplierId)}
                  >
                    <Flag className={activeFlagged ? "text-red-600" : ""} />
                    {activeFlagged ? "取消标记错误" : "标记错误"}
                  </Button>
                </div>
              )}
              <p className="text-[11px] text-muted-foreground">
                AI 生成结果，仅供审核确认。人工修改会记录在选型结果中。
              </p>
            </div>
          </div>
        )}
      </SidePanel>
    </Card>
  );
}
