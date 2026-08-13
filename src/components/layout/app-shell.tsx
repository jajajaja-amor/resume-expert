"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { fetchAIStatus } from "@/services/agents/compareAgent";
import { useWorkspaceStore } from "@/store/workspace-store";
import { DemoBanner } from "@/components/shared/demo-banner";

const nav = [
  { href: "/", label: "工作台" },
  { href: "/compare", label: "产品比选" },
  { href: "/compliance", label: "合规审核" },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [aiMode, setAiMode] = useState<"mock" | "llm">("mock");
  const selectionResult = useWorkspaceStore((s) => s.selectionResult);

  useEffect(() => {
    fetchAIStatus().then((s) => setAiMode(s.mode));
  }, []);

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-[var(--line)] bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 md:px-6">
          <Link href="/" className="min-w-0">
            <div className="text-lg font-semibold tracking-tight text-brand md:text-xl">
              SpecLens
            </div>
            <div className="truncate text-xs text-[var(--ink-muted)] md:text-sm">
              海外工程产品合规审查工作台
            </div>
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            {nav.map((item) => {
              const active =
                item.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "rounded-md px-3 py-1.5 text-sm transition-colors",
                    active
                      ? "bg-brand-soft font-medium text-brand-dark"
                      : "text-[var(--ink-muted)] hover:bg-neutral-100 hover:text-[var(--ink)]"
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex shrink-0 flex-col items-end gap-1 text-right">
            <div className="inline-flex items-center gap-2 rounded-md border border-[var(--line)] bg-[var(--surface)] px-2.5 py-1 text-xs text-[var(--ink-muted)]">
              <span className="status-dot bg-brand animate-pulse-soft" />
              AI Agent 工作流 · 已就绪
            </div>
            <div className="text-[11px] text-[var(--ink-muted)]">
              {aiMode === "llm" ? "AI 模式" : "演示模式"}
              {selectionResult ? " · 已有选型结果" : ""}
            </div>
          </div>
        </div>

        <div className="border-t border-[var(--line)] md:hidden">
          <div className="mx-auto flex max-w-6xl gap-1 px-4 py-2">
            {nav.map((item) => {
              const active =
                item.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex-1 rounded-md px-2 py-1.5 text-center text-xs",
                    active
                      ? "bg-brand-soft font-medium text-brand-dark"
                      : "text-[var(--ink-muted)]"
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
      </header>

      <DemoBanner />

      <main className="mx-auto max-w-6xl px-4 py-6 md:px-6 md:py-8">{children}</main>

      <footer className="border-t border-[var(--line)] py-6 text-center text-xs text-[var(--ink-muted)]">
        SpecLens · AI Product Compliance Workspace · 工程产品决策与合规审核工作台
      </footer>
    </div>
  );
}
