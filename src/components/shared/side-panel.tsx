"use client";

import { X } from "lucide-react";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";

/** 右侧滑出面板，用于展示参数来源 / 评分依据 / 合规 Evidence。 */
export function SidePanel({
  open,
  title,
  onClose,
  children,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (open) window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div
        className="absolute inset-0 bg-black/30"
        onClick={onClose}
        aria-hidden
      />
      <aside className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col border-l bg-white shadow-xl sm:max-w-lg">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h3 className="text-sm font-semibold">{title}</h3>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="关闭">
            <X />
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto p-4">{children}</div>
      </aside>
    </div>
  );
}
