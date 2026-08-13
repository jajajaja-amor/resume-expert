"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  AgentStep,
  CompareAnalysisResult,
  ComplianceAnalysisResult,
  ComplianceCheck,
  ComplianceReport,
  DocumentFile,
  HistoryRecord,
  MasMaterial,
  ProductScore,
  SelectionResult,
} from "@/types/workspace";
import { DEMO_PROJECT } from "@/data/demo/soft-membrane";
import { buildReportSections } from "@/lib/export-report";
import { COMPARE_AGENT_STEPS, COMPLIANCE_AGENT_STEPS } from "@/services/agents/steps";
import { uid } from "@/lib/utils";

type ComparePhase =
  | "upload"
  | "analyzing"
  | "results"
  | "review"
  | "confirmed";

type CompliancePhase =
  | "idle"
  | "import"
  | "spec_upload"
  | "analyzing"
  | "checklist"
  | "human_review"
  | "mas"
  | "report";

interface WorkspaceState {
  demoBannerDismissed: boolean;
  projectName: string;

  // Compare
  comparePhase: ComparePhase;
  productDocs: DocumentFile[];
  compareSteps: AgentStep[];
  compareResult: CompareAnalysisResult | null;
  editedScores: ProductScore[] | null;
  selectedProductId: string | null;
  reviewNotes: string;
  selectionResult: SelectionResult | null;

  // Compliance
  compliancePhase: CompliancePhase;
  specDocs: DocumentFile[];
  complianceSteps: AgentStep[];
  complianceResult: ComplianceAnalysisResult | null;
  checks: ComplianceCheck[];
  statusFilter: "ALL" | ComplianceCheck["status"];
  riskFilter: "ALL" | ComplianceCheck["riskLevel"];
  mas: MasMaterial | null;
  report: ComplianceReport | null;

  // History
  history: HistoryRecord[];

  setDemoBannerDismissed: (v: boolean) => void;
  setProjectName: (name: string) => void;

  setProductDocs: (docs: DocumentFile[]) => void;
  updateProductDoc: (id: string, patch: Partial<DocumentFile>) => void;
  removeProductDoc: (id: string) => void;
  setComparePhase: (phase: ComparePhase) => void;
  setCompareSteps: (steps: AgentStep[]) => void;
  setCompareResult: (result: CompareAnalysisResult | null) => void;
  setEditedScores: (scores: ProductScore[] | null) => void;
  updateDimensionScore: (productId: string, dimension: string, score: number) => void;
  setSelectedProductId: (id: string | null) => void;
  setReviewNotes: (notes: string) => void;
  confirmSelection: (selection: SelectionResult) => void;
  resetCompare: () => void;

  setCompliancePhase: (phase: CompliancePhase) => void;
  setSpecDocs: (docs: DocumentFile[]) => void;
  updateSpecDoc: (id: string, patch: Partial<DocumentFile>) => void;
  removeSpecDoc: (id: string) => void;
  setComplianceSteps: (steps: AgentStep[]) => void;
  setComplianceResult: (result: ComplianceAnalysisResult | null) => void;
  setChecks: (checks: ComplianceCheck[]) => void;
  updateCheck: (id: string, patch: Partial<ComplianceCheck>) => void;
  setStatusFilter: (f: WorkspaceState["statusFilter"]) => void;
  setRiskFilter: (f: WorkspaceState["riskFilter"]) => void;
  setMas: (mas: MasMaterial | null) => void;
  updateMasSection: (sectionId: string, content: string) => void;
  confirmCompliance: () => void;
  resetCompliance: () => void;

  addHistory: (record: HistoryRecord) => void;
  removeHistory: (id: string) => void;
  clearHistory: () => void;
  loadHistory: (id: string) => void;
}

const defaultCompareSteps: AgentStep[] = COMPARE_AGENT_STEPS.map((s) => ({ ...s }));
const defaultComplianceSteps: AgentStep[] = COMPLIANCE_AGENT_STEPS.map((s) => ({ ...s }));

export const useWorkspaceStore = create<WorkspaceState>()(
  persist(
    (set, get) => ({
      demoBannerDismissed: false,
      projectName: DEMO_PROJECT.name,

      comparePhase: "upload",
      productDocs: [],
      compareSteps: defaultCompareSteps,
      compareResult: null,
      editedScores: null,
      selectedProductId: null,
      reviewNotes: "",
      selectionResult: null,

      compliancePhase: "idle",
      specDocs: [],
      complianceSteps: defaultComplianceSteps,
      complianceResult: null,
      checks: [],
      statusFilter: "ALL",
      riskFilter: "ALL",
      mas: null,
      report: null,

      history: [],

      setDemoBannerDismissed: (v) => set({ demoBannerDismissed: v }),
      setProjectName: (name) => set({ projectName: name }),

      setProductDocs: (docs) => set({ productDocs: docs }),
      updateProductDoc: (id, patch) =>
        set({
          productDocs: get().productDocs.map((d) => (d.id === id ? { ...d, ...patch } : d)),
        }),
      removeProductDoc: (id) =>
        set({ productDocs: get().productDocs.filter((d) => d.id !== id) }),
      setComparePhase: (phase) => set({ comparePhase: phase }),
      setCompareSteps: (steps) => set({ compareSteps: steps }),
      setCompareResult: (result) =>
        set({
          compareResult: result,
          editedScores: result?.scores ?? null,
          selectedProductId: result?.scores?.[0]?.productId ?? null,
        }),
      setEditedScores: (scores) => set({ editedScores: scores }),
      updateDimensionScore: (productId, dimension, score) => {
        const scores = get().editedScores;
        if (!scores) return;
        const next = scores.map((s) => {
          if (s.productId !== productId) return s;
          const dimensions = s.dimensions.map((d) =>
            d.dimension === dimension ? { ...d, score } : d
          );
          const overall = Math.round(
            dimensions.reduce((sum, d) => sum + d.score, 0) / dimensions.length
          );
          return { ...s, dimensions, overall };
        });
        set({ editedScores: next });
      },
      setSelectedProductId: (id) => set({ selectedProductId: id }),
      setReviewNotes: (notes) => set({ reviewNotes: notes }),
      confirmSelection: (selection) =>
        set({
          selectionResult: selection,
          comparePhase: "confirmed",
          compliancePhase: "import",
        }),
      resetCompare: () =>
        set({
          comparePhase: "upload",
          productDocs: [],
          compareSteps: defaultCompareSteps,
          compareResult: null,
          editedScores: null,
          selectedProductId: null,
          reviewNotes: "",
        }),

      setCompliancePhase: (phase) => set({ compliancePhase: phase }),
      setSpecDocs: (docs) => set({ specDocs: docs }),
      updateSpecDoc: (id, patch) =>
        set({
          specDocs: get().specDocs.map((d) => (d.id === id ? { ...d, ...patch } : d)),
        }),
      removeSpecDoc: (id) => set({ specDocs: get().specDocs.filter((d) => d.id !== id) }),
      setComplianceSteps: (steps) => set({ complianceSteps: steps }),
      setComplianceResult: (result) =>
        set({
          complianceResult: result,
          checks: result?.checks ?? [],
        }),
      setChecks: (checks) => set({ checks }),
      updateCheck: (id, patch) =>
        set({
          checks: get().checks.map((c) => (c.id === id ? { ...c, ...patch } : c)),
        }),
      setStatusFilter: (f) => set({ statusFilter: f }),
      setRiskFilter: (f) => set({ riskFilter: f }),
      setMas: (mas) => set({ mas }),
      updateMasSection: (sectionId, content) => {
        const mas = get().mas;
        if (!mas) return;
        set({
          mas: {
            ...mas,
            sections: mas.sections.map((s) =>
              s.id === sectionId ? { ...s, content } : s
            ),
          },
        });
      },
      confirmCompliance: () => {
        const selection = get().selectionResult;
        const complianceResult = get().complianceResult;
        const checks = get().checks;
        let mas = get().mas;
        if (!selection || !complianceResult) return;

        if (!mas) {
          mas = {
            id: uid("mas"),
            title: "MAS 审核材料（可配置模板）",
            status: "pending_review",
            generatedAt: new Date().toISOString(),
            sections: [
              {
                id: "mas-1",
                heading: "材料申报摘要",
                content: `${selection.productName}（${selection.model}）拟用于 ${selection.projectName}。供应商：${selection.supplierName}。`,
              },
              {
                id: "mas-2",
                heading: "关键认证与测试",
                content: selection.coreParameters
                  .map((p) => `${p.label}: ${p.value}`)
                  .join("\n"),
              },
              {
                id: "mas-3",
                heading: "合规结论摘要",
                content: `PASS ${checks.filter((c) => c.status === "PASS").length} / FAIL ${checks.filter((c) => c.status === "FAIL").length} / REVIEW ${checks.filter((c) => c.status === "REVIEW").length} / MISSING ${checks.filter((c) => c.status === "MISSING").length}`,
              },
              {
                id: "mas-4",
                heading: "风险与待确认",
                content: [
                  ...selection.risks,
                  ...checks
                    .filter((c) => ["FAIL", "REVIEW", "MISSING"].includes(c.status))
                    .map((c) => `${c.checkItem}: ${c.aiJudgment}`),
                ].join("\n"),
              },
            ],
          };
        } else {
          mas = { ...mas, status: "confirmed" };
        }

        const summary = {
          total: checks.length,
          pass: checks.filter((c) => c.status === "PASS").length,
          fail: checks.filter((c) => c.status === "FAIL").length,
          review: checks.filter((c) => c.status === "REVIEW").length,
          missing: checks.filter((c) => c.status === "MISSING").length,
          notApplicable: checks.filter((c) => c.status === "NOT_APPLICABLE").length,
        };

        let overallState = complianceResult.overallState;
        if (summary.fail > 0) overallState = "at_risk";
        else if (summary.missing > 0) overallState = "incomplete";
        else if (summary.review > 0) overallState = "pending_review";
        else overallState = "compliant";

        const report: ComplianceReport = {
          id: uid("report"),
          projectName: selection.projectName,
          productName: selection.productName,
          supplierName: selection.supplierName,
          model: selection.model,
          overallState,
          summary,
          sections: [],
          checks,
          mas,
          generatedAt: new Date().toISOString(),
          confirmedAt: new Date().toISOString(),
          demoMode: selection.demoMode || complianceResult.demoMode,
        };
        report.sections = buildReportSections(selection, report);

        const historyRecord: HistoryRecord = {
          id: uid("hist"),
          projectName: selection.projectName,
          productName: selection.productName,
          supplierName: selection.supplierName,
          reviewedAt: new Date().toISOString(),
          overallScore: selection.overallScore,
          complianceState: overallState,
          failCount: summary.fail,
          reviewCount: summary.review,
          selectionResult: selection,
          report,
        };

        set({
          mas,
          report,
          compliancePhase: "report",
          history: [historyRecord, ...get().history].slice(0, 20),
        });
      },
      resetCompliance: () =>
        set({
          compliancePhase: get().selectionResult ? "import" : "idle",
          specDocs: [],
          complianceSteps: defaultComplianceSteps,
          complianceResult: null,
          checks: [],
          statusFilter: "ALL",
          riskFilter: "ALL",
          mas: null,
          report: null,
        }),

      addHistory: (record) =>
        set({ history: [record, ...get().history].slice(0, 20) }),
      removeHistory: (id) =>
        set({ history: get().history.filter((h) => h.id !== id) }),
      clearHistory: () => set({ history: [] }),
      loadHistory: (id) => {
        const record = get().history.find((h) => h.id === id);
        if (!record) return;
        set({
          selectionResult: record.selectionResult ?? null,
          report: record.report ?? null,
          checks: record.report?.checks ?? [],
          mas: record.report?.mas ?? null,
          compliancePhase: record.report ? "report" : "import",
          comparePhase: record.selectionResult ? "confirmed" : get().comparePhase,
          projectName: record.projectName,
        });
      },
    }),
    {
      name: "speclens-workspace-v1",
      partialize: (state) => ({
        demoBannerDismissed: state.demoBannerDismissed,
        projectName: state.projectName,
        selectionResult: state.selectionResult,
        compareResult: state.compareResult,
        editedScores: state.editedScores,
        selectedProductId: state.selectedProductId,
        comparePhase: state.comparePhase,
        productDocs: state.productDocs,
        compliancePhase: state.compliancePhase,
        specDocs: state.specDocs,
        complianceResult: state.complianceResult,
        checks: state.checks,
        mas: state.mas,
        report: state.report,
        history: state.history,
        reviewNotes: state.reviewNotes,
      }),
    }
  )
);

