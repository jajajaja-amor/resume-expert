"use client";

import { RotateCcw } from "lucide-react";
import { SiteHeader } from "@/components/layout/site-header";
import { DemoBanner } from "@/components/shared/demo-banner";
import { Button } from "@/components/ui/button";
import { ImportCard } from "@/components/compliance/import-card";
import { SpecUploadSection } from "@/components/compliance/spec-upload";
import { ChecklistSection } from "@/components/compliance/checklist";
import { ReviewCenter } from "@/components/compliance/review-center";
import { MasSection } from "@/components/compliance/mas-section";
import { ReportSection } from "@/components/compliance/report-section";
import { useMounted } from "@/lib/use-mounted";
import { useWorkspaceStore } from "@/store/workspace-store";

export default function CompliancePage() {
  const mounted = useMounted();
  const selection = useWorkspaceStore((s) => s.selection);
  const checklistReady = useWorkspaceStore((s) => s.checklistReady);
  const resetCompliance = useWorkspaceStore((s) => s.resetCompliance);

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6">
        <div className="no-print flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold tracking-tight sm:text-2xl">AI 产品合规审核</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              基于已确认产品和项目规范，逐项检查产品是否满足海外工程项目要求。
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={resetCompliance}>
            <RotateCcw /> 重置本阶段
          </Button>
        </div>

        <div className="no-print">
          <DemoBanner />
        </div>

        {mounted && (
          <>
            <ImportCard />
            {selection && (
              <>
                <SpecUploadSection />
                {checklistReady && (
                  <>
                    <ChecklistSection />
                    <ReviewCenter />
                    <MasSection />
                    <ReportSection />
                  </>
                )}
              </>
            )}
          </>
        )}
      </main>
    </div>
  );
}
