"use client";

import { RotateCcw } from "lucide-react";
import { SiteHeader } from "@/components/layout/site-header";
import { DemoBanner } from "@/components/shared/demo-banner";
import { Button } from "@/components/ui/button";
import { UploadSection } from "@/components/compare/upload-section";
import { ParameterTable } from "@/components/compare/parameter-table";
import { NormalizationSection } from "@/components/compare/normalization-section";
import { ComparisonSection } from "@/components/compare/comparison-section";
import { ScoreSection } from "@/components/compare/score-section";
import { SelectionResultSection } from "@/components/compare/selection-result";
import { useMounted } from "@/lib/use-mounted";
import { useWorkspaceStore } from "@/store/workspace-store";

export default function ComparePage() {
  const mounted = useMounted();
  const done = useWorkspaceStore((s) => s.compareDone);
  const resetCompare = useWorkspaceStore((s) => s.resetCompare);

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold tracking-tight sm:text-2xl">AI 产品比选</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              上传多个供应商产品资料，自动完成参数提取、归一化比较和六维评分。
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={resetCompare}>
            <RotateCcw /> 重置本阶段
          </Button>
        </div>

        <DemoBanner />

        {mounted && (
          <>
            <UploadSection />
            {done && (
              <>
                <ParameterTable />
                <NormalizationSection />
                <ComparisonSection />
                <ScoreSection />
                <SelectionResultSection />
              </>
            )}
          </>
        )}
      </main>
    </div>
  );
}
