"use client";

import { CheckCircle2, Loader2, Plus, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useWorkspaceStore } from "@/store/workspace-store";

export function MasSection() {
  const complianceConfirmed = useWorkspaceStore((s) => s.complianceConfirmed);
  const masGenerating = useWorkspaceStore((s) => s.masGenerating);
  const mas = useWorkspaceStore((s) => s.mas);
  const updateSection = useWorkspaceStore((s) => s.updateMasSection);
  const addSection = useWorkspaceStore((s) => s.addMasSection);
  const removeSection = useWorkspaceStore((s) => s.removeMasSection);
  const confirmMas = useWorkspaceStore((s) => s.confirmMas);

  if (!complianceConfirmed) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-center gap-2">
          <CardTitle className="text-base">5. MAS 审核材料</CardTitle>
          {mas &&
            (mas.status === "confirmed" ? (
              <Badge variant="success">已人工确认</Badge>
            ) : (
              <Badge variant="warning">AI 已生成 · 待人工审核</Badge>
            ))}
        </div>
        <CardDescription>
          基于已确认的项目信息、产品信息、六维评分与合规检查结果自动生成。使用可配置模板，不绑定特定国家或法规体系。内容可编辑、添加、删除。
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {masGenerating && (
          <div className="flex items-center gap-2 rounded-md border bg-muted/30 p-4 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
            AI 正在生成 MAS 材料…
          </div>
        )}

        {mas && (
          <>
            <p className="text-xs text-muted-foreground">模板：{mas.templateName}</p>
            <div className="space-y-3">
              {mas.sections.map((s) => (
                <div key={s.id} className="rounded-md border p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium">{s.title}</p>
                    {mas.status !== "confirmed" && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeSection(s.id)}
                        aria-label="删除章节"
                      >
                        <Trash2 className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    )}
                  </div>
                  {mas.status === "confirmed" ? (
                    <p className="mt-2 whitespace-pre-line text-sm leading-6 text-foreground/90">
                      {s.content}
                    </p>
                  ) : (
                    <Textarea
                      value={s.content}
                      onChange={(e) => updateSection(s.id, e.target.value)}
                      rows={Math.min(8, Math.max(3, s.content.split("\n").length + 1))}
                      className="mt-2"
                    />
                  )}
                </div>
              ))}
            </div>

            {mas.status !== "confirmed" && (
              <div className="flex flex-wrap items-center gap-3">
                <Button variant="outline" size="sm" onClick={addSection}>
                  <Plus /> 添加章节
                </Button>
                <Button onClick={confirmMas}>
                  <CheckCircle2 /> 确认 MAS 材料并生成最终报告
                </Button>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
