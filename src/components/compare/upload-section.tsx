"use client";

import { FileText, Play, RefreshCw, Sparkles, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AgentSteps } from "@/components/shared/agent-steps";
import { ParseStatusBadge } from "@/components/shared/status-badge";
import { UploadZone } from "@/components/shared/upload-zone";
import { useWorkspaceStore } from "@/store/workspace-store";

function fmtSize(kb: number) {
  return kb >= 1024 ? `${(kb / 1024).toFixed(1)} MB` : `${kb} KB`;
}

export function UploadSection() {
  const files = useWorkspaceStore((s) => s.compareFiles);
  const running = useWorkspaceStore((s) => s.compareRunning);
  const done = useWorkspaceStore((s) => s.compareDone);
  const steps = useWorkspaceStore((s) => s.compareSteps);
  const loadDemo = useWorkspaceStore((s) => s.loadDemoSupplierFiles);
  const addFiles = useWorkspaceStore((s) => s.addCompareFiles);
  const removeFile = useWorkspaceStore((s) => s.removeCompareFile);
  const retryParse = useWorkspaceStore((s) => s.retryParseFile);
  const run = useWorkspaceStore((s) => s.runCompareAnalysis);

  const started = running || done;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle className="text-base">1. 上传供应商产品资料</CardTitle>
          <Button variant="outline" size="sm" onClick={loadDemo} disabled={running}>
            <Sparkles /> 载入演示数据（3 个供应商）
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <UploadZone
          hint="支持 PDF、Word、Excel、TXT、图片，单个文件不超过 20MB。"
          accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.txt,.md,.png,.jpg,.jpeg,.webp"
          onFiles={addFiles}
          disabled={running}
        />

        {files.length > 0 && (
          <div className="overflow-x-auto rounded-md border">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b bg-muted/40 text-left text-xs text-muted-foreground">
                  <th className="px-3 py-2 font-medium">文件名称</th>
                  <th className="px-3 py-2 font-medium">类型</th>
                  <th className="px-3 py-2 font-medium">大小</th>
                  <th className="px-3 py-2 font-medium">供应商</th>
                  <th className="px-3 py-2 font-medium">解析状态</th>
                  <th className="px-3 py-2 font-medium">操作</th>
                </tr>
              </thead>
              <tbody>
                {files.map((f) => (
                  <tr key={f.id} className="border-b last:border-0">
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                        <span className="break-all">{f.name}</span>
                      </div>
                    </td>
                    <td className="px-3 py-2 text-muted-foreground">{f.fileType}</td>
                    <td className="px-3 py-2 text-muted-foreground">{fmtSize(f.sizeKB)}</td>
                    <td className="px-3 py-2">{f.supplierName ?? "-"}</td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-2">
                        <ParseStatusBadge status={f.status} />
                        {f.status === "failed" && (
                          <span className="text-xs text-red-600">解析失败，请重新尝试</span>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-1">
                        {f.status === "failed" && (
                          <Button variant="outline" size="sm" onClick={() => retryParse(f.id)}>
                            <RefreshCw /> 重新解析
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeFile(f.id)}
                          disabled={running}
                          aria-label="删除文件"
                        >
                          <Trash2 className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3">
          <Button onClick={run} disabled={running || files.length === 0}>
            <Play />
            {running ? "AI 分析进行中…" : done ? "重新运行 AI 产品比选" : "开始 AI 产品比选"}
          </Button>
          {files.length === 0 && (
            <span className="text-xs text-muted-foreground">
              请先上传供应商资料，或载入演示数据。
            </span>
          )}
        </div>

        {started && (
          <div className="rounded-md border bg-muted/30 p-4">
            <p className="mb-3 text-xs font-medium text-muted-foreground">Agent 工作步骤</p>
            <AgentSteps steps={steps} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
