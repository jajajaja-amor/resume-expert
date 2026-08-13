"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

const NAV = [
  { href: "/", label: "工作台" },
  { href: "/compare", label: "产品比选" },
  { href: "/compliance", label: "合规审核" },
];

export function SiteHeader() {
  const pathname = usePathname();
  return (
    <header className="no-print sticky top-0 z-40 border-b bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-3 sm:gap-6">
          <Link href="/" className="flex shrink-0 items-baseline gap-2">
            <span className="text-lg font-bold tracking-tight text-primary">SpecLens</span>
            <span className="hidden text-xs text-muted-foreground md:inline">
              海外工程产品合规审查工作台
            </span>
          </Link>
          <nav className="flex items-center gap-1">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "rounded-md px-2.5 py-1.5 text-sm transition-colors sm:px-3",
                  pathname === item.href
                    ? "bg-accent font-medium text-accent-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="hidden items-center gap-2 sm:flex">
          <Badge variant="outline" className="gap-1.5 font-normal text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            AI Agent 工作流 · 已就绪
          </Badge>
          <Badge variant="warning">Demo Mode</Badge>
        </div>
      </div>
    </header>
  );
}
