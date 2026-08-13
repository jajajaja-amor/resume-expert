"use client";

import { FileText, Play, Sparkles, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AgentSteps } from "@/components/shared/agent-steps";
import { ParseStatusBadge } from "@/components/shared/status-badge";
import { UploadZone } from "@/components/shared/upload-zone";
import { useWorkspaceStore } from "@/store/workspace-store";

function fmtSize(kb: number) {
  return kb >= 1024 ? `${(kb / 1024).toFixed(1)} MB` : `${kb} KB`;
}

export function SpecUploadSection() {
  const specFiles = useWorkspaceStore((s) => s.specFiles);
  const running = useWorkspaceStore((s) => s.complianceRunning);
  const ready = useWorkspaceStore((s) => s.checklistReady);
  const steps = useWorkspaceStore((s) => s.complianceSteps);
  const specifications = useWorkspaceStore((s) => s.specifications);
  const loadDemo = useWorkspaceStore((s) => s.loadDemoSpecFiles);
  const addFiles = useWorkspaceStore((s) => s.addSpecFiles);
  const removeFile = useWorkspaceStore((s) => s.removeSpecFile);
  const run = useWorkspaceStore((s) => s.runComplianceAnalysis);

  const started = running || ready;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <CardTitle className="text-base">2. 上传项目规范</CardTitle>
            <CardDescription className="mt-1">
              项目规范、国家标准、国际标准、招标文件、技术规格书、客户要求、设计规范、合同要求。
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={loadDemo} disabled={running}>
            <Sparkles /> 载入演示规范（4 份）
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <UploadZone
          hint="支持 PDF、Word、Excel、TXT，单个文件不超过 20MB。"
          accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.txt,.md"
          onFiles={addFiles}
          disabled={running}
        />

        {specFiles.length > 0 && (
          <div className="overflow-x-auto rounded-md border">
            <table className="w-full min-w-[560px] text-sm">
              <thead>
                <tr className="border-b bg-muted/40 text-left text-xs text-muted-foreground">
                  <th className="px-3 py-2 font-medium">文件名称</th>
                  <th className="px-3 py-2 font-medium">类型</th>
                  <th className="px-3 py-2 font-medium">大小</th>
                  <th className="px-3 py-2 font-medium">解析状态</th>
                  <th className="px-3 py-2 font-medium">操作</th>
                </tr>
              </thead>
              <tbody>
                {specFiles.map((f) => (
                  <tr key={f.id} className="border-b last:border-0">
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                        <span className="break-all">{f.name}</span>
                      </div>
                    </td>
                    <td className="px-3 py-2 text-muted-foreground">{f.fileType}</td>
                    <td className="px-3 py-2 text-muted-foreground">{fmtSize(f.sizeKB)}</td>
                    <td className="px-3 py-2">
                      <ParseStatusBadge status={f.status} />
                    </td>
                    <td className="px-3 py-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeFile(f.id)}
                        disabled={running}
                        aria-label="删除文件"
                      >
                        <Trash2 className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3">
          <Button onClick={run} disabled={running || specFiles.length === 0}>
            <Play />
            {running ? "正在解析规范…" : ready ? "重新生成检查清单" : "生成合规检查清单"}
          </Button>
          {specFiles.length === 0 && (
            <span className="text-xs text-muted-foreground">
              请先上传规范文件，或载入演示规范。
            </span>
          )}
        </div>

        {started && (
          <div className="rounded-md border bg-muted/30 p-4">
            <p className="mb-3 text-xs font-medium text-muted-foreground">Agent 工作步骤</p>
            <AgentSteps steps={steps} />
          </div>
        )}

        {ready && specifications.length > 0 && (
          <div className="rounded-md border p-4">
            <p className="text-xs font-medium text-muted-foreground">已识别的适用规范</p>
            <ul className="mt-2 grid gap-1.5 text-sm sm:grid-cols-2">
              {specifications.map((sp) => (
                <li key={sp.id} className="flex items-start gap-2">
                  <FileText className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  <span>
                    {sp.title}
                    <span className="ml-1.5 text-xs text-muted-foreground">
                      {sp.type} · {sp.documentName}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
