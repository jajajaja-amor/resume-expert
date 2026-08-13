"use client";

import { UploadCloud } from "lucide-react";
import { useCallback, useRef, useState } from "react";
import { cn } from "@/lib/utils";

const MAX_SIZE_MB = 20;

export function UploadZone({
  hint,
  accept,
  onFiles,
  disabled,
}: {
  hint: string;
  accept?: string;
  onFiles: (files: { name: string; sizeKB: number }[]) => void;
  disabled?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFiles = useCallback(
    (list: FileList | null) => {
      if (!list || list.length === 0) return;
      const accepted: { name: string; sizeKB: number }[] = [];
      let rejected = 0;
      Array.from(list).forEach((f) => {
        if (f.size > MAX_SIZE_MB * 1024 * 1024) rejected += 1;
        else accepted.push({ name: f.name, sizeKB: Math.max(1, Math.round(f.size / 1024)) });
      });
      setError(rejected > 0 ? `${rejected} 个文件超过 ${MAX_SIZE_MB}MB，已被跳过。` : null);
      if (accepted.length > 0) onFiles(accepted);
    },
    [onFiles]
  );

  return (
    <div>
      <div
        role="button"
        tabIndex={0}
        aria-disabled={disabled}
        onClick={() => !disabled && inputRef.current?.click()}
        onKeyDown={(e) => {
          if (!disabled && (e.key === "Enter" || e.key === " ")) inputRef.current?.click();
        }}
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled) setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          if (!disabled) handleFiles(e.dataTransfer.files);
        }}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed px-4 py-8 text-center transition-colors",
          dragging ? "border-primary bg-accent" : "border-border bg-muted/30 hover:bg-muted/60",
          disabled && "cursor-not-allowed opacity-60"
        )}
      >
        <UploadCloud className="h-8 w-8 text-muted-foreground" />
        <p className="text-sm font-medium">点击上传，或将文件拖拽到此处</p>
        <p className="text-xs text-muted-foreground">{hint}</p>
      </div>
      <input
        ref={inputRef}
        type="file"
        multiple
        accept={accept}
        className="hidden"
        onChange={(e) => {
          handleFiles(e.target.files);
          e.target.value = "";
        }}
      />
      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
    </div>
  );
}
