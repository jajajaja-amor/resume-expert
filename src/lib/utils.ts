import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { ComplianceStatus, OverallComplianceState, RiskLevel } from "@/types/workspace";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function formatDateTime(iso: string): string {
  try {
    return new Intl.DateTimeFormat("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export function complianceStatusLabel(status: ComplianceStatus): string {
  return status;
}

export function overallStateLabel(state: OverallComplianceState): string {
  const map: Record<OverallComplianceState, string> = {
    compliant: "合规",
    at_risk: "存在风险",
    pending_review: "待人工确认",
    incomplete: "资料不完整",
  };
  return map[state];
}

export function riskLabel(risk: RiskLevel): string {
  const map: Record<RiskLevel, string> = {
    high: "高风险",
    medium: "中风险",
    low: "低风险",
    none: "无风险",
  };
  return map[risk];
}

export function downloadTextFile(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function uid(prefix = "id"): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}
