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

function isParseableDoc(file: File): boolean {
  const name = file.name.toLowerCase();
  return /\.(pdf|docx|xlsx|xls)$/i.test(name);
}

async function parseViaServer(file: File): Promise<{ text: string; note?: string; failed?: boolean }> {
  const form = new FormData();
  form.append("file", file, file.name);
  const response = await fetch("/api/documents/parse", {
    method: "POST",
    body: form,
  });
  const data = (await response.json().catch(() => ({}))) as {
    ok?: boolean;
    text?: string;
    warning?: string | null;
    error?: string | null;
    chars?: number;
    engine?: string;
  };

  if (!response.ok || (!data.text?.trim() && data.error)) {
    return {
      text: "",
      failed: true,
      note:
        data.error ||
        data.warning ||
        "服务端文档解析失败。可粘贴原文继续，系统不会编造参数。",
    };
  }

  const notes = [
    data.engine ? `已用真实文档解析引擎（${data.engine}）提取 ${data.chars ?? data.text?.length ?? 0} 字` : null,
    data.warning || null,
  ].filter(Boolean);

  return {
    text: data.text || "",
    note: notes.join("；") || undefined,
  };
}

async function readFileText(file: File): Promise<{ text: string; note?: string; failed?: boolean }> {
  if (isTextLike(file)) {
    const text = await file.text();
    return { text, note: "已读取纯文本内容" };
  }

  if (isParseableDoc(file)) {
    try {
      return await parseViaServer(file);
    } catch {
      return {
        text: "",
        failed: true,
        note: "文档解析服务不可用。请粘贴原文，或稍后重试。",
      };
    }
  }

  return {
    text: "",
    failed: true,
    note: "当前格式暂不支持自动解析。请上传 PDF/DOCX/XLSX/TXT，或粘贴原文。",
  };
}

export function FileUpload({
  files,
  onChange,
  onRetry,
  category,
  acceptImages = true,
  hint = "支持 TXT/PDF/DOCX/XLSX 真实解析（biaoshu-writer-pro）。同一「产品分组」多文件合并为一个产品；数量不限。",
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
          const { text, note, failed } = await readFileText(file);
          next.push({
            id: uid("doc"),
            name: file.name,
            type: file.type || "application/octet-stream",
            size: file.size,
            category,
            parseStatus: failed && !text.trim() ? "failed" : text.trim() ? "done" : "pending",
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

  async function handleRetryParse(id: string) {
    const target = files.find((f) => f.id === id);
    if (!target) return;
    onRetry?.(id);
    // Without original File blob we can only ask user to re-upload or paste
    patchFile(id, {
      parseStatus: "pending",
      errorMessage: "请重新选择文件上传，或在下方粘贴资料原文后继续。",
    });
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
          {reading ? "正在真实解析文档…" : "点击上传或拖拽文件到此处"}
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
                  {file.parseStatus === "failed" ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => void handleRetryParse(file.id)}
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                      重试说明
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
                  产品分组（相同名称合并为同一产品；不同名称=不同产品）
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
                  资料文本（由真实解析引擎填充，可手工校对）
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
                  placeholder="解析结果将显示在这里…"
                />
              </label>
              {file.errorMessage ? (
                <p
                  className={cn(
                    "text-xs",
                    file.parseStatus === "failed" ? "text-red-700" : "text-amber-700"
                  )}
                >
                  {file.errorMessage}
                </p>
              ) : file.textContent?.trim() ? (
                <p className="text-xs text-emerald-700">
                  已载入文本，将仅基于该内容提取参数（不编造）。
                </p>
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
