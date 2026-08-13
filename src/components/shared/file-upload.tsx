"use client";

import { useCallback, useRef, useState } from "react";
import { FileUp, Trash2, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ParseStatusBadge } from "@/components/shared/status-badge";
import { cn, formatFileSize, uid } from "@/lib/utils";
import type { DocumentFile } from "@/types/workspace";

const ACCEPT =
  ".pdf,.doc,.docx,.xls,.xlsx,.txt,.png,.jpg,.jpeg,.webp,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/plain,image/*";

const MAX_SIZE = 20 * 1024 * 1024;

function fileTypeLabel(type: string, name: string): string {
  const lower = name.toLowerCase();
  if (lower.endsWith(".pdf") || type.includes("pdf")) return "PDF";
  if (lower.endsWith(".doc") || lower.endsWith(".docx") || type.includes("word")) return "Word";
  if (lower.endsWith(".xls") || lower.endsWith(".xlsx") || type.includes("sheet") || type.includes("excel"))
    return "Excel";
  if (lower.endsWith(".txt") || type.includes("text")) return "TXT";
  if (type.startsWith("image/") || /\.(png|jpe?g|webp)$/.test(lower)) return "图片";
  return type || "文件";
}

export function FileUpload({
  files,
  onChange,
  onRetry,
  category,
  acceptImages = true,
  hint = "支持 PDF、Word、Excel、TXT、图片，单个文件不超过 20MB。",
  supplierNames,
}: {
  files: DocumentFile[];
  onChange: (files: DocumentFile[]) => void;
  onRetry?: (id: string) => void;
  category: DocumentFile["category"];
  acceptImages?: boolean;
  hint?: string;
  supplierNames?: string[];
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const ingest = useCallback(
    (list: FileList | File[]) => {
      setError(null);
      const incoming = Array.from(list);
      const next: DocumentFile[] = [];
      for (const file of incoming) {
        if (file.size > MAX_SIZE) {
          setError(`文件 ${file.name} 超过 20MB，已跳过。`);
          continue;
        }
        if (!acceptImages && file.type.startsWith("image/")) {
          setError(`当前区域不支持图片：${file.name}`);
          continue;
        }
        const idx = files.length + next.length;
        next.push({
          id: uid("doc"),
          name: file.name,
          type: file.type || "application/octet-stream",
          size: file.size,
          category,
          parseStatus: "pending",
          supplierName: supplierNames?.[idx] ?? `供应商 ${String.fromCharCode(65 + (idx % 3))}`,
          uploadedAt: new Date().toISOString(),
        });
      }
      if (next.length) onChange([...files, ...next]);
    },
    [acceptImages, category, files, onChange, supplierNames]
  );

  return (
    <div className="space-y-4">
      <div
        className={cn(
          "rounded-lg border border-dashed px-4 py-8 text-center transition-colors",
          dragging ? "border-brand bg-brand-soft" : "border-[var(--line)] bg-white"
        )}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          if (e.dataTransfer.files?.length) ingest(e.dataTransfer.files);
        }}
      >
        <FileUp className="mx-auto h-8 w-8 text-brand" />
        <p className="mt-3 text-sm font-medium">点击上传或拖拽文件到此处</p>
        <p className="mt-1 text-xs text-[var(--ink-muted)]">{hint}</p>
        <Button
          type="button"
          variant="outline"
          className="mt-4"
          onClick={() => inputRef.current?.click()}
        >
          选择文件
        </Button>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={acceptImages ? ACCEPT : ACCEPT.replace(/,image\/\*/g, "")}
          className="hidden"
          onChange={(e) => {
            if (e.target.files?.length) ingest(e.target.files);
            e.target.value = "";
          }}
        />
      </div>

      {error ? (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {files.length > 0 ? (
        <div className="table-scroll panel">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-[var(--line)] bg-[var(--surface)] text-[var(--ink-muted)]">
              <tr>
                <th className="px-3 py-2 font-medium">文件名称</th>
                <th className="px-3 py-2 font-medium">类型</th>
                <th className="px-3 py-2 font-medium">大小</th>
                <th className="px-3 py-2 font-medium">供应商 / 来源</th>
                <th className="px-3 py-2 font-medium">解析状态</th>
                <th className="px-3 py-2 font-medium">操作</th>
              </tr>
            </thead>
            <tbody>
              {files.map((file) => (
                <tr key={file.id} className="border-b border-[var(--line)] last:border-0">
                  <td className="px-3 py-2.5 font-medium">{file.name}</td>
                  <td className="px-3 py-2.5">{fileTypeLabel(file.type, file.name)}</td>
                  <td className="px-3 py-2.5">{formatFileSize(file.size)}</td>
                  <td className="px-3 py-2.5">{file.supplierName || "—"}</td>
                  <td className="px-3 py-2.5">
                    <div className="space-y-1">
                      <ParseStatusBadge status={file.parseStatus} />
                      {file.parseStatus === "failed" ? (
                        <div className="text-xs text-red-600">解析失败，请重新尝试</div>
                      ) : null}
                    </div>
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="flex gap-2">
                      {file.parseStatus === "failed" && onRetry ? (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => onRetry(file.id)}
                        >
                          <RotateCcw className="h-3.5 w-3.5" />
                          重新解析
                        </Button>
                      ) : null}
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => onChange(files.filter((f) => f.id !== file.id))}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        删除
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}
