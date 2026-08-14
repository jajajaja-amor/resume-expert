"use client";

import { useCallback, useRef, useState } from "react";
import { FileUp, Trash2, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ParseStatusBadge } from "@/components/shared/status-badge";
import { cn, formatFileSize, uid } from "@/lib/utils";
import type { DocumentFile } from "@/types/workspace";

const ACCEPT =
  ".pdf,.doc,.docx,.xls,.xlsx,.txt,.csv,.md,.json,.png,.jpg,.jpeg,.webp,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/plain,text/csv,image/*";

const MAX_SIZE = 20 * 1024 * 1024;

function fileTypeLabel(type: string, name: string): string {
  const lower = name.toLowerCase();
  if (lower.endsWith(".pdf") || type.includes("pdf")) return "PDF";
  if (lower.endsWith(".doc") || lower.endsWith(".docx") || type.includes("word")) return "Word";
  if (lower.endsWith(".xls") || lower.endsWith(".xlsx") || type.includes("sheet") || type.includes("excel"))
    return "Excel";
  if (lower.endsWith(".txt") || lower.endsWith(".csv") || lower.endsWith(".md") || type.includes("text"))
    return "TXT";
  if (type.startsWith("image/") || /\.(png|jpe?g|webp)$/.test(lower)) return "图片";
  return type || "文件";
}

function isTextLike(file: File): boolean {
  const name = file.name.toLowerCase();
  return (
    file.type.startsWith("text/") ||
    /\.(txt|csv|md|json|log)$/i.test(name) ||
    file.type === "application/json"
  );
}

async function readFileText(file: File): Promise<{ text: string; note?: string }> {
  if (isTextLike(file)) {
    const text = await file.text();
    return { text };
  }

  // Best-effort decode for office/pdf binaries — may be empty; user can paste text.
  try {
    const buffer = await file.arrayBuffer();
    const bytes = new Uint8Array(buffer.slice(0, Math.min(buffer.byteLength, 512_000)));
    const decoded = new TextDecoder("utf-8", { fatal: false }).decode(bytes);
    const printable = decoded.replace(/[^\x09\x0A\x0D\x20-\x7E\u4e00-\u9fff，。；：、（）【】￥]/g, " ");
    const compact = printable.replace(/\s+/g, " ").trim();
    if (compact.length >= 40) {
      return {
        text: compact.slice(0, 20000),
        note: "已尽力从二进制文件抽取可读文本；若参数缺失请改用 TXT 或粘贴原文。",
      };
    }
  } catch {
    // ignore
  }

  return {
    text: "",
    note: "未能自动读取文本。请在下方粘贴该产品资料原文，系统不会编造参数。",
  };
}

export function FileUpload({
  files,
  onChange,
  onRetry,
  category,
  acceptImages = true,
  hint = "支持 TXT/CSV/PDF/Word/Excel/图片。同一「产品分组」的多份文件会合并为一个产品；不限制产品数量。",
}: {
  files: DocumentFile[];
  onChange: (files: DocumentFile[]) => void;
  onRetry?: (id: string) => void;
  category: DocumentFile["category"];
  acceptImages?: boolean;
  hint?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reading, setReading] = useState(false);

  const ingest = useCallback(
    async (list: FileList | File[]) => {
      setError(null);
      setReading(true);
      const incoming = Array.from(list);
      const next: DocumentFile[] = [];
      try {
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
          const productLabel = `产品 ${idx + 1}`;
          const { text, note } = await readFileText(file);
          next.push({
            id: uid("doc"),
            name: file.name,
            type: file.type || "application/octet-stream",
            size: file.size,
            category,
            parseStatus: text.trim() ? "done" : "pending",
            productLabel,
            supplierName: productLabel,
            textContent: text,
            errorMessage: note,
            uploadedAt: new Date().toISOString(),
          });
        }
        if (next.length) onChange([...files, ...next]);
      } finally {
        setReading(false);
      }
    },
    [acceptImages, category, files, onChange]
  );

  function patchFile(id: string, patch: Partial<DocumentFile>) {
    onChange(files.map((f) => (f.id === id ? { ...f, ...patch } : f)));
  }

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
          if (e.dataTransfer.files?.length) void ingest(e.dataTransfer.files);
        }}
      >
        <FileUp className="mx-auto h-8 w-8 text-brand" />
        <p className="mt-3 text-sm font-medium">
          {reading ? "正在读取文件内容…" : "点击上传或拖拽文件到此处"}
        </p>
        <p className="mt-1 text-xs text-[var(--ink-muted)]">{hint}</p>
        <Button
          type="button"
          variant="outline"
          className="mt-4"
          disabled={reading}
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
            if (e.target.files?.length) void ingest(e.target.files);
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
        <div className="space-y-3">
          {files.map((file, index) => (
            <div key={file.id} className="panel space-y-3 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="font-medium">{file.name}</div>
                  <div className="mt-1 text-xs text-[var(--ink-muted)]">
                    {fileTypeLabel(file.type, file.name)} · {formatFileSize(file.size)} · 文件{" "}
                    {index + 1}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <ParseStatusBadge status={file.parseStatus} />
                  {file.parseStatus === "failed" && onRetry ? (
                    <Button type="button" size="sm" variant="outline" onClick={() => onRetry(file.id)}>
                      <RotateCcw className="h-3.5 w-3.5" />
                      重试
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
              </div>

              <label className="block text-sm">
                <span className="mb-1 block text-[var(--ink-muted)]">
                  产品分组（相同名称会合并为同一产品；不同名称=不同产品，数量不限）
                </span>
                <input
                  className="h-9 w-full max-w-md rounded-md border border-[var(--line)] px-3"
                  value={file.productLabel || file.supplierName || ""}
                  onChange={(e) =>
                    patchFile(file.id, {
                      productLabel: e.target.value,
                      supplierName: e.target.value,
                    })
                  }
                  placeholder={`产品 ${index + 1}`}
                />
              </label>

              <label className="block text-sm">
                <span className="mb-1 block text-[var(--ink-muted)]">
                  资料文本（用于结构化解析；PDF/扫描件若抽不到字请粘贴）
                </span>
                <textarea
                  className="min-h-28 w-full rounded-md border border-[var(--line)] px-3 py-2 font-mono text-xs"
                  value={file.textContent || ""}
                  onChange={(e) =>
                    patchFile(file.id, {
                      textContent: e.target.value,
                      parseStatus: e.target.value.trim() ? "done" : "pending",
                      errorMessage: undefined,
                    })
                  }
                  placeholder="粘贴包含公司名称、单价、幅宽、防火等级、认证、VOC、MOQ 等字段的原文…"
                />
              </label>
              {file.errorMessage ? (
                <p className="text-xs text-amber-700">{file.errorMessage}</p>
              ) : file.textContent?.trim() ? (
                <p className="text-xs text-emerald-700">已载入文本，将仅基于该内容提取参数（不编造）。</p>
              ) : (
                <p className="text-xs text-amber-700">暂无文本，分析时该文件无法提取参数。</p>
              )}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
