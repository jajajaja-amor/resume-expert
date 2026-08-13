"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  AgentStep,
  AuditLogEntry,
  ComparisonMetric,
  ComplianceCheck,
  ComplianceStatus,
  effectiveStatus,
  HistoryRecord,
  MasDocument,
  NormalizedParameter,
  Parameter,
  ScoreDimensionKey,
  SCORE_DIMENSIONS,
  SelectionResult,
  Specification,
  Supplier,
  SupplierScore,
  WorkspaceDocument,
} from "@/types/domain";
import {
  compareProducts,
  extractParameters,
  generateMas,
  normalizeParameters,
  parseDocument,
  parseSpecifications,
  runComplianceChecks,
  scoreProducts,
} from "@/services/agents";
import {
  DEMO_PRODUCT_CATEGORY,
  DEMO_PROJECT_NAME,
  DEMO_RECOMMENDED_SUPPLIER_ID,
  DEMO_SELECTION_ADVANTAGES,
  DEMO_SELECTION_PENDING,
  DEMO_SELECTION_RISKS,
  DEMO_SPEC_DOCUMENTS,
  DEMO_SUPPLIER_DOCUMENTS,
} from "@/services/agents/demo-data";

/* ---------------- Agent 步骤定义 ---------------- */

const COMPARE_STEPS: Omit<AgentStep, "status">[] = [
  { id: "upload", label: "文件已上传" },
  { id: "parse", label: "正在解析供应商资料" },
  { id: "extract", label: "正在提取产品参数" },
  { id: "identify", label: "正在识别认证和企业信息" },
  { id: "normalize", label: "正在统一参数单位" },
  { id: "compare", label: "正在进行产品横向比较" },
  { id: "score", label: "正在计算六维评分" },
];

const COMPLIANCE_STEPS: Omit<AgentStep, "status">[] = [
  { id: "spec-parse", label: "正在解析规范文件" },
  { id: "req-extract", label: "正在提取规范要求条款" },
  { id: "checklist", label: "正在生成合规检查清单" },
  { id: "check", label: "正在逐条核查产品合规性" },
];

function initSteps(defs: Omit<AgentStep, "status">[]): AgentStep[] {
  return defs.map((d) => ({ ...d, status: "pending" }));
}

/* ---------------- State ---------------- */

interface WorkspaceState {
  /* 阶段一：产品比选 */
  compareFiles: WorkspaceDocument[];
  compareSteps: AgentStep[];
  compareRunning: boolean;
  compareDone: boolean;
  suppliers: Supplier[];
  parameters: Parameter[];
  normalized: NormalizedParameter[];
  comparison: ComparisonMetric[];
  scores: SupplierScore[];
  /** `${supplierId}:${dimension}` -> 人工修改后的分数 */
  scoreOverrides: Record<string, number>;
  /** `${paramKey}:${supplierId}` -> 人工修改后的参数值 */
  parameterOverrides: Record<string, string>;
  /** `${paramKey}:${supplierId}` -> 标记为错误 */
  flaggedParameters: Record<string, boolean>;
  reviewerNote: string;
  selection: SelectionResult | null;

  /* 阶段二：合规审核 */
  specFiles: WorkspaceDocument[];
  complianceSteps: AgentStep[];
  complianceRunning: boolean;
  specifications: Specification[];
  checks: ComplianceCheck[];
  checklistReady: boolean;
  complianceConfirmed: boolean;
  mas: MasDocument | null;
  masGenerating: boolean;
  reportReady: boolean;
  auditLog: AuditLogEntry[];

  /* 历史记录 */
  history: HistoryRecord[];

  /* 阶段一 actions */
  loadDemoSupplierFiles: () => void;
  addCompareFiles: (files: { name: string; sizeKB: number }[]) => void;
  removeCompareFile: (id: string) => void;
  retryParseFile: (id: string) => void;
  runCompareAnalysis: () => Promise<void>;
  setScoreOverride: (supplierId: string, dimension: ScoreDimensionKey, score: number) => void;
  setParameterOverride: (paramKey: string, supplierId: string, value: string) => void;
  toggleFlagParameter: (paramKey: string, supplierId: string) => void;
  setReviewerNote: (note: string) => void;
  confirmSelection: (supplierId: string) => void;
  resetCompare: () => void;

  /* 阶段二 actions */
  loadDemoSpecFiles: () => void;
  addSpecFiles: (files: { name: string; sizeKB: number }[]) => void;
  removeSpecFile: (id: string) => void;
  runComplianceAnalysis: () => Promise<void>;
  setCheckHumanStatus: (checkId: string, status: ComplianceStatus | undefined) => void;
  setCheckNote: (checkId: string, note: string) => void;
  setCheckResolved: (checkId: string, resolved: boolean) => void;
  attachSupplement: (checkId: string, docName: string) => void;
  confirmCompliance: () => Promise<void>;
  updateMasSection: (sectionId: string, content: string) => void;
  addMasSection: () => void;
  removeMasSection: (sectionId: string) => void;
  confirmMas: () => void;
  resetCompliance: () => void;

  /* 历史 actions */
  deleteHistory: (id: string) => void;
  clearHistory: () => void;

  resetAll: () => void;
}

/* ---------------- helpers ---------------- */

let idSeq = 0;
function uid(prefix: string) {
  idSeq += 1;
  return `${prefix}-${Date.now().toString(36)}-${idSeq}`;
}

function fileTypeOf(name: string): string {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  if (ext === "pdf") return "PDF";
  if (["doc", "docx"].includes(ext)) return "Word";
  if (["xls", "xlsx", "csv"].includes(ext)) return "Excel";
  if (["txt", "md"].includes(ext)) return "TXT";
  if (["png", "jpg", "jpeg", "gif", "webp", "bmp"].includes(ext)) return "图片";
  return ext.toUpperCase() || "文件";
}

export function overriddenScore(
  state: Pick<WorkspaceState, "scores" | "scoreOverrides">,
  supplierId: string,
  dimension: ScoreDimensionKey
): number {
  const key = `${supplierId}:${dimension}`;
  if (key in state.scoreOverrides) return state.scoreOverrides[key];
  const s = state.scores.find((x) => x.supplierId === supplierId);
  return s?.dimensions.find((d) => d.dimension === dimension)?.score ?? 0;
}

export function overallScoreOf(
  state: Pick<WorkspaceState, "scores" | "scoreOverrides">,
  supplierId: string
): number {
  const dims = SCORE_DIMENSIONS.map((d) => overriddenScore(state, supplierId, d.key));
  if (dims.length === 0) return 0;
  return Math.round(dims.reduce((a, b) => a + b, 0) / dims.length);
}

export function complianceSummary(checks: ComplianceCheck[]) {
  const counts: Record<ComplianceStatus, number> = {
    PASS: 0,
    FAIL: 0,
    REVIEW: 0,
    MISSING: 0,
    NOT_APPLICABLE: 0,
  };
  for (const c of checks) counts[effectiveStatus(c)] += 1;
  const total = checks.length;
  let overall = "合规";
  if (counts.FAIL > 0) overall = "存在风险";
  else if (counts.MISSING > 0) overall = "资料不完整";
  else if (counts.REVIEW > 0) overall = "待人工确认";
  return { counts, total, overall };
}

const initialState = {
  compareFiles: [] as WorkspaceDocument[],
  compareSteps: initSteps(COMPARE_STEPS),
  compareRunning: false,
  compareDone: false,
  suppliers: [] as Supplier[],
  parameters: [] as Parameter[],
  normalized: [] as NormalizedParameter[],
  comparison: [] as ComparisonMetric[],
  scores: [] as SupplierScore[],
  scoreOverrides: {} as Record<string, number>,
  parameterOverrides: {} as Record<string, string>,
  flaggedParameters: {} as Record<string, boolean>,
  reviewerNote: "",
  selection: null as SelectionResult | null,

  specFiles: [] as WorkspaceDocument[],
  complianceSteps: initSteps(COMPLIANCE_STEPS),
  complianceRunning: false,
  specifications: [] as Specification[],
  checks: [] as ComplianceCheck[],
  checklistReady: false,
  complianceConfirmed: false,
  mas: null as MasDocument | null,
  masGenerating: false,
  reportReady: false,
  auditLog: [] as AuditLogEntry[],
};

export const useWorkspaceStore = create<WorkspaceState>()(
  persist(
    (set, get) => ({
      ...initialState,
      history: [],

      /* ---------------- 阶段一 ---------------- */

      loadDemoSupplierFiles: () => {
        set({
          compareFiles: DEMO_SUPPLIER_DOCUMENTS.map((d) => ({ ...d, status: "pending" })),
          compareDone: false,
          compareSteps: initSteps(COMPARE_STEPS),
        });
      },

      addCompareFiles: (files) => {
        const docs: WorkspaceDocument[] = files.map((f) => ({
          id: uid("doc"),
          name: f.name,
          fileType: fileTypeOf(f.name),
          sizeKB: f.sizeKB,
          kind: "supplier",
          supplierName: "待识别",
          status: "pending",
          isDemo: false,
        }));
        set({ compareFiles: [...get().compareFiles, ...docs] });
      },

      removeCompareFile: (id) => {
        set({ compareFiles: get().compareFiles.filter((f) => f.id !== id) });
      },

      retryParseFile: (id) => {
        set({
          compareFiles: get().compareFiles.map((f) =>
            f.id === id ? { ...f, status: "pending" } : f
          ),
        });
      },

      runCompareAnalysis: async () => {
        if (get().compareRunning) return;
        const files = get().compareFiles;
        if (files.length === 0) return;

        set({
          compareRunning: true,
          compareDone: false,
          compareSteps: initSteps(COMPARE_STEPS),
          selection: null,
          scoreOverrides: {},
          parameterOverrides: {},
          flaggedParameters: {},
        });

        const setStep = (id: string, status: AgentStep["status"]) =>
          set({
            compareSteps: get().compareSteps.map((s) => (s.id === id ? { ...s, status } : s)),
          });

        try {
          setStep("upload", "done");

          setStep("parse", "running");
          set({
            compareFiles: get().compareFiles.map((f) => ({ ...f, status: "parsing" })),
          });
          for (const f of get().compareFiles) {
            const r = await parseDocument(f);
            set({
              compareFiles: get().compareFiles.map((x) =>
                x.id === f.id ? { ...x, status: r.status } : x
              ),
            });
          }
          setStep("parse", "done");

          setStep("extract", "running");
          const { suppliers, parameters } = await extractParameters(get().compareFiles);
          set({ suppliers, parameters });
          setStep("extract", "done");

          setStep("identify", "running");
          await new Promise((r) => setTimeout(r, 700));
          setStep("identify", "done");

          setStep("normalize", "running");
          const normalized = await normalizeParameters(parameters);
          set({ normalized });
          setStep("normalize", "done");

          setStep("compare", "running");
          const comparison = await compareProducts(parameters, normalized);
          set({ comparison });
          setStep("compare", "done");

          setStep("score", "running");
          const scores = await scoreProducts(comparison);
          set({ scores });
          setStep("score", "done");

          set({ compareDone: true });
        } finally {
          set({ compareRunning: false });
        }
      },

      setScoreOverride: (supplierId, dimension, score) => {
        const key = `${supplierId}:${dimension}`;
        set({
          scoreOverrides: {
            ...get().scoreOverrides,
            [key]: Math.max(0, Math.min(100, Math.round(score))),
          },
        });
      },

      setParameterOverride: (paramKey, supplierId, value) => {
        set({
          parameterOverrides: {
            ...get().parameterOverrides,
            [`${paramKey}:${supplierId}`]: value,
          },
        });
      },

      toggleFlagParameter: (paramKey, supplierId) => {
        const key = `${paramKey}:${supplierId}`;
        const flags = { ...get().flaggedParameters };
        if (flags[key]) delete flags[key];
        else flags[key] = true;
        set({ flaggedParameters: flags });
      },

      setReviewerNote: (note) => set({ reviewerNote: note }),

      confirmSelection: (supplierId) => {
        const state = get();
        const supplier = state.suppliers.find((s) => s.id === supplierId);
        if (!supplier) return;

        const keyParamKeys = [
          "model",
          "price",
          "weight",
          "width",
          "thickness",
          "material",
          "fireRating",
          "certification",
          "warranty",
          "leadTime",
          "moq",
        ];
        const keyParameters = keyParamKeys
          .map((k) => {
            const p = state.parameters.find((x) => x.key === k);
            if (!p) return null;
            const override = state.parameterOverrides[`${k}:${supplierId}`];
            const value = override ?? p.values[supplierId]?.result ?? "-";
            return { label: p.label, value };
          })
          .filter((x): x is { label: string; value: string } => x !== null);

        const dimensionScores = SCORE_DIMENSIONS.map((d) => ({
          dimension: d.key,
          label: d.label,
          score: overriddenScore(state, supplierId, d.key),
        }));

        const pending = [...DEMO_SELECTION_PENDING];
        for (const key of Object.keys(state.flaggedParameters)) {
          const [paramKey, supId] = key.split(":");
          const p = state.parameters.find((x) => x.key === paramKey);
          const sup = state.suppliers.find((x) => x.id === supId);
          if (p && sup) pending.push(`人工标记错误：${sup.shortName} - ${p.label}，待复核`);
        }

        const selection: SelectionResult = {
          id: uid("sel"),
          createdAt: Date.now(),
          projectName: DEMO_PROJECT_NAME,
          productName: `软膜天花 ${supplier.model}`,
          productCategory: DEMO_PRODUCT_CATEGORY,
          supplierId,
          supplierName: supplier.name,
          model: supplier.model,
          overallScore: overallScoreOf(state, supplierId),
          dimensionScores,
          keyParameters,
          advantages:
            supplierId === DEMO_RECOMMENDED_SUPPLIER_ID
              ? DEMO_SELECTION_ADVANTAGES
              : [`人工选定 ${supplier.shortName}（${supplier.name}），依据详见评分与备注`],
          risks: DEMO_SELECTION_RISKS,
          pendingItems: pending,
          sourceDocuments: state.compareFiles.map((f) => f.name),
          reviewerNote: state.reviewerNote,
          humanReviewed: true,
          isDemo: true,
        };

        set({
          selection,
          auditLog: [
            ...get().auditLog,
            { time: Date.now(), actor: "人工", action: `确认产品选型：${supplier.name} ${supplier.model}` },
          ],
        });
      },

      resetCompare: () => {
        set({
          compareFiles: [],
          compareSteps: initSteps(COMPARE_STEPS),
          compareRunning: false,
          compareDone: false,
          suppliers: [],
          parameters: [],
          normalized: [],
          comparison: [],
          scores: [],
          scoreOverrides: {},
          parameterOverrides: {},
          flaggedParameters: {},
          reviewerNote: "",
          selection: null,
        });
      },

      /* ---------------- 阶段二 ---------------- */

      loadDemoSpecFiles: () => {
        set({ specFiles: DEMO_SPEC_DOCUMENTS.map((d) => ({ ...d, status: "pending" })) });
      },

      addSpecFiles: (files) => {
        const docs: WorkspaceDocument[] = files.map((f) => ({
          id: uid("spec"),
          name: f.name,
          fileType: fileTypeOf(f.name),
          sizeKB: f.sizeKB,
          kind: "specification",
          status: "pending",
          isDemo: false,
        }));
        set({ specFiles: [...get().specFiles, ...docs] });
      },

      removeSpecFile: (id) => {
        set({ specFiles: get().specFiles.filter((f) => f.id !== id) });
      },

      runComplianceAnalysis: async () => {
        const state = get();
        if (state.complianceRunning || !state.selection) return;
        if (state.specFiles.length === 0) return;

        set({
          complianceRunning: true,
          checklistReady: false,
          complianceConfirmed: false,
          mas: null,
          reportReady: false,
          complianceSteps: initSteps(COMPLIANCE_STEPS),
        });

        const setStep = (id: string, status: AgentStep["status"]) =>
          set({
            complianceSteps: get().complianceSteps.map((s) =>
              s.id === id ? { ...s, status } : s
            ),
          });

        try {
          setStep("spec-parse", "running");
          set({ specFiles: get().specFiles.map((f) => ({ ...f, status: "parsing" })) });
          for (const f of get().specFiles) {
            await parseDocument(f);
            set({
              specFiles: get().specFiles.map((x) =>
                x.id === f.id ? { ...x, status: "done" } : x
              ),
            });
          }
          const specs = await parseSpecifications(get().specFiles);
          set({ specifications: specs });
          setStep("spec-parse", "done");

          setStep("req-extract", "running");
          await new Promise((r) => setTimeout(r, 700));
          setStep("req-extract", "done");

          setStep("checklist", "running");
          await new Promise((r) => setTimeout(r, 600));
          setStep("checklist", "done");

          setStep("check", "running");
          const checks = await runComplianceChecks(get().selection!, specs);
          set({ checks });
          setStep("check", "done");

          set({
            checklistReady: true,
            auditLog: [
              ...get().auditLog,
              { time: Date.now(), actor: "AI", action: `完成合规检查，共 ${checks.length} 条检查项` },
            ],
          });
        } finally {
          set({ complianceRunning: false });
        }
      },

      setCheckHumanStatus: (checkId, status) => {
        set({
          checks: get().checks.map((c) =>
            c.id === checkId ? { ...c, humanStatus: status } : c
          ),
          auditLog: status
            ? [
                ...get().auditLog,
                {
                  time: Date.now(),
                  actor: "人工" as const,
                  action: `修改检查项结论：${get().checks.find((c) => c.id === checkId)?.name ?? checkId} → ${status}`,
                },
              ]
            : get().auditLog,
        });
      },

      setCheckNote: (checkId, note) => {
        set({
          checks: get().checks.map((c) => (c.id === checkId ? { ...c, humanNote: note } : c)),
        });
      },

      setCheckResolved: (checkId, resolved) => {
        set({
          checks: get().checks.map((c) => (c.id === checkId ? { ...c, resolved } : c)),
          auditLog: resolved
            ? [
                ...get().auditLog,
                {
                  time: Date.now(),
                  actor: "人工" as const,
                  action: `标记已解决：${get().checks.find((c) => c.id === checkId)?.name ?? checkId}`,
                },
              ]
            : get().auditLog,
        });
      },

      attachSupplement: (checkId, docName) => {
        set({
          checks: get().checks.map((c) =>
            c.id === checkId ? { ...c, supplementDocument: docName } : c
          ),
          auditLog: [
            ...get().auditLog,
            { time: Date.now(), actor: "人工", action: `上传补充资料：${docName}` },
          ],
        });
      },

      confirmCompliance: async () => {
        const state = get();
        if (!state.selection || state.masGenerating) return;
        set({
          complianceConfirmed: true,
          masGenerating: true,
          auditLog: [
            ...get().auditLog,
            { time: Date.now(), actor: "人工", action: "确认合规审核结果" },
          ],
        });
        const { counts } = complianceSummary(state.checks);
        const mas = await generateMas({
          projectName: state.selection.projectName,
          productName: state.selection.productName,
          supplierName: state.selection.supplierName,
          model: state.selection.model,
          overallScore: state.selection.overallScore,
          passCount: counts.PASS,
          failCount: counts.FAIL,
          reviewCount: counts.REVIEW,
          missingCount: counts.MISSING,
        });
        set({
          mas: { templateName: mas.templateName, sections: mas.sections, status: "draft" },
          masGenerating: false,
          auditLog: [
            ...get().auditLog,
            { time: Date.now(), actor: "AI", action: "生成 MAS 审核材料（待人工审核）" },
          ],
        });
      },

      updateMasSection: (sectionId, content) => {
        const mas = get().mas;
        if (!mas) return;
        set({
          mas: {
            ...mas,
            sections: mas.sections.map((s) => (s.id === sectionId ? { ...s, content } : s)),
          },
        });
      },

      addMasSection: () => {
        const mas = get().mas;
        if (!mas) return;
        set({
          mas: {
            ...mas,
            sections: [
              ...mas.sections,
              { id: uid("mas"), title: `${mas.sections.length + 1}. 自定义章节`, content: "" },
            ],
          },
        });
      },

      removeMasSection: (sectionId) => {
        const mas = get().mas;
        if (!mas) return;
        set({ mas: { ...mas, sections: mas.sections.filter((s) => s.id !== sectionId) } });
      },

      confirmMas: () => {
        const state = get();
        const mas = state.mas;
        if (!mas || !state.selection) return;
        const { counts, overall } = complianceSummary(state.checks);
        const record: HistoryRecord = {
          id: uid("his"),
          projectName: state.selection.projectName,
          productName: state.selection.productName,
          supplierName: state.selection.supplierName,
          reviewedAt: Date.now(),
          overallScore: state.selection.overallScore,
          complianceStatus: overall,
          failCount: counts.FAIL,
          reviewCount: counts.REVIEW,
        };
        set({
          mas: { ...mas, status: "confirmed" },
          reportReady: true,
          history: [record, ...state.history].slice(0, 20),
          auditLog: [
            ...get().auditLog,
            { time: Date.now(), actor: "人工", action: "确认 MAS 材料，生成最终合规审核报告" },
          ],
        });
      },

      resetCompliance: () => {
        set({
          specFiles: [],
          complianceSteps: initSteps(COMPLIANCE_STEPS),
          complianceRunning: false,
          specifications: [],
          checks: [],
          checklistReady: false,
          complianceConfirmed: false,
          mas: null,
          masGenerating: false,
          reportReady: false,
        });
      },

      /* ---------------- 历史 ---------------- */

      deleteHistory: (id) => set({ history: get().history.filter((h) => h.id !== id) }),
      clearHistory: () => set({ history: [] }),

      resetAll: () => {
        set({ ...initialState, compareSteps: initSteps(COMPARE_STEPS), complianceSteps: initSteps(COMPLIANCE_STEPS) });
      },
    }),
    {
      name: "speclens-workspace",
      partialize: (state) => ({
        compareFiles: state.compareFiles,
        compareDone: state.compareDone,
        suppliers: state.suppliers,
        parameters: state.parameters,
        normalized: state.normalized,
        comparison: state.comparison,
        scores: state.scores,
        scoreOverrides: state.scoreOverrides,
        parameterOverrides: state.parameterOverrides,
        flaggedParameters: state.flaggedParameters,
        reviewerNote: state.reviewerNote,
        selection: state.selection,
        specFiles: state.specFiles,
        specifications: state.specifications,
        checks: state.checks,
        checklistReady: state.checklistReady,
        complianceConfirmed: state.complianceConfirmed,
        mas: state.mas,
        reportReady: state.reportReady,
        auditLog: state.auditLog,
        history: state.history,
      }),
    }
  )
);
