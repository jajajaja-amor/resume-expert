"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FileUpload } from "@/components/shared/file-upload";
import { AgentSteps } from "@/components/shared/agent-steps";
import { EvidenceSidebar, type EvidencePanelData } from "@/components/shared/evidence-sidebar";
import {
  ComplianceStatusBadge,
  OverallStateBadge,
  RiskBadge,
} from "@/components/shared/status-badge";
import {
  getDemoSpecDocuments,
  runComplianceAnalysis,
} from "@/services/agents/complianceAgent";
import { useWorkspaceStore } from "@/store/workspace-store";
import {
  reportToHtml,
  reportToMarkdown,
} from "@/lib/export-report";
import { delay, downloadTextFile, uid } from "@/lib/utils";
import type { ComplianceCheck, ComplianceStatus, RiskLevel } from "@/types/workspace";

export default function CompliancePage() {
  const selectionResult = useWorkspaceStore((s) => s.selectionResult);
  const compliancePhase = useWorkspaceStore((s) => s.compliancePhase);
  const setCompliancePhase = useWorkspaceStore((s) => s.setCompliancePhase);
  const specDocs = useWorkspaceStore((s) => s.specDocs);
  const setSpecDocs = useWorkspaceStore((s) => s.setSpecDocs);
  const updateSpecDoc = useWorkspaceStore((s) => s.updateSpecDoc);
  const complianceSteps = useWorkspaceStore((s) => s.complianceSteps);
  const setComplianceSteps = useWorkspaceStore((s) => s.setComplianceSteps);
  const setComplianceResult = useWorkspaceStore((s) => s.setComplianceResult);
  const complianceResult = useWorkspaceStore((s) => s.complianceResult);
  const checks = useWorkspaceStore((s) => s.checks);
  const updateCheck = useWorkspaceStore((s) => s.updateCheck);
  const statusFilter = useWorkspaceStore((s) => s.statusFilter);
  const setStatusFilter = useWorkspaceStore((s) => s.setStatusFilter);
  const riskFilter = useWorkspaceStore((s) => s.riskFilter);
  const setRiskFilter = useWorkspaceStore((s) => s.setRiskFilter);
  const mas = useWorkspaceStore((s) => s.mas);
  const setMas = useWorkspaceStore((s) => s.setMas);
  const updateMasSection = useWorkspaceStore((s) => s.updateMasSection);
  const confirmCompliance = useWorkspaceStore((s) => s.confirmCompliance);
  const report = useWorkspaceStore((s) => s.report);
  const resetCompliance = useWorkspaceStore((s) => s.resetCompliance);

  const [analyzing, setAnalyzing] = useState(false);
  const [evidence, setEvidence] = useState<EvidencePanelData | null>(null);
  const [feishuMsg, setFeishuMsg] = useState<string | null>(null);
  const [supplementNote, setSupplementNote] = useState("");

  const summary = useMemo(() => {
    return {
      total: checks.length,
      pass: checks.filter((c) => c.status === "PASS").length,
      fail: checks.filter((c) => c.status === "FAIL").length,
      review: checks.filter((c) => c.status === "REVIEW").length,
      missing: checks.filter((c) => c.status === "MISSING").length,
      notApplicable: checks.filter((c) => c.status === "NOT_APPLICABLE").length,
    };
  }, [checks]);

  const overallState =
    summary.fail > 0
      ? "at_risk"
      : summary.missing > 0
        ? "incomplete"
        : summary.review > 0
          ? "pending_review"
          : checks.length
            ? "compliant"
            : complianceResult?.overallState ?? "pending_review";

  const filteredChecks = checks.filter((c) => {
    if (statusFilter !== "ALL" && c.status !== statusFilter) return false;
    if (riskFilter !== "ALL" && c.riskLevel !== riskFilter) return false;
    return true;
  });

  const reviewTasks = checks.filter((c) =>
    ["FAIL", "REVIEW", "MISSING"].includes(c.status)
  );

  async function simulateSpecParse(docs = specDocs) {
    for (const doc of docs) {
      updateSpecDoc(doc.id, { parseStatus: "parsing" });
      await delay(300);
      updateSpecDoc(doc.id, { parseStatus: "done" });
    }
  }

  async function handleLoadDemoSpecs() {
    const docs = getDemoSpecDocuments();
    setSpecDocs(docs);
    await simulateSpecParse(docs);
  }

  async function handleAnalyze() {
    if (!selectionResult || analyzing) return;
    if (specDocs.length === 0) {
      await handleLoadDemoSpecs();
    }
    const docs = useWorkspaceStore.getState().specDocs;
    if (docs.some((d) => d.parseStatus !== "done")) {
      await simulateSpecParse(docs);
    }

    setAnalyzing(true);
    setCompliancePhase("analyzing");
    try {
      const result = await runComplianceAnalysis(
        selectionResult,
        docs,
        setComplianceSteps
      );
      setComplianceResult(result);
      setCompliancePhase("checklist");
    } finally {
      setAnalyzing(false);
    }
  }

  function openEvidence(check: ComplianceCheck) {
    const specEv = check.evidence.filter((e) =>
      /spec|requirement|client|project/i.test(e.sourceDocument)
    );
    const productEv = check.evidence.filter(
      (e) => !/spec|requirement|client|project/i.test(e.sourceDocument)
    );
    setEvidence({
      title: check.checkItem,
      subtitle: `${check.status} · 置信度 ${check.confidence}%`,
      evidence: check.evidence,
      aiJudgment: check.aiJudgment,
      confidence: check.confidence,
      extra: (
        <div className="space-y-3 text-sm">
          <div className="panel p-3">
            <div className="text-xs font-medium text-brand">规范来源优先展示</div>
            {(specEv.length ? specEv : check.evidence.slice(0, 1)).map((e) => (
              <div key={`spec-${e.sourceDocument}-${e.page}`} className="mt-2">
                <div>{e.sourceDocument}</div>
                {e.page != null ? <div>第 {e.page} 页</div> : null}
                <div className="mt-1 rounded bg-[var(--surface)] p-2">“{e.originalText}”</div>
              </div>
            ))}
          </div>
          <div className="panel p-3">
            <div className="text-xs font-medium text-brand">产品来源</div>
            {productEv.length === 0 ? (
              <div className="mt-2 text-amber-800">⚠️ 缺少证据，请人工确认</div>
            ) : (
              productEv.map((e) => (
                <div key={`prod-${e.sourceDocument}-${e.page}`} className="mt-2">
                  <div>{e.sourceDocument}</div>
                  {e.page != null ? <div>第 {e.page} 页</div> : null}
                  <div className="mt-1 rounded bg-[var(--surface)] p-2">“{e.originalText}”</div>
                </div>
              ))
            )}
          </div>
          {check.suggestion ? (
            <div className="rounded-md border border-[var(--line)] p-3">
              建议：{check.suggestion}
            </div>
          ) : null}
        </div>
      ),
    });
  }

  function generateMas() {
    if (!selectionResult) return;
    setMas({
      id: uid("mas"),
      title: "MAS 审核材料（可配置模板）",
      status: "pending_review",
      generatedAt: new Date().toISOString(),
      sections: [
        {
          id: "mas-1",
          heading: "项目与产品摘要",
          content: `项目：${selectionResult.projectName}\n产品：${selectionResult.productName}\n型号：${selectionResult.model}\n供应商：${selectionResult.supplierName}`,
        },
        {
          id: "mas-2",
          heading: "六维评分摘要",
          content: selectionResult.dimensions
            .map((d) => `${d.label}: ${d.score}/100`)
            .join("\n"),
        },
        {
          id: "mas-3",
          heading: "合规检查结果",
          content: `PASS ${summary.pass} / FAIL ${summary.fail} / REVIEW ${summary.review} / MISSING ${summary.missing}`,
        },
        {
          id: "mas-4",
          heading: "风险项与待确认",
          content: reviewTasks.map((c) => `${c.status} · ${c.checkItem}: ${c.aiJudgment}`).join("\n"),
        },
        {
          id: "mas-5",
          heading: "认证与测试材料索引",
          content: selectionResult.sourceDocuments.join("\n"),
        },
      ],
    });
    setCompliancePhase("mas");
  }

  function handleConfirmResults() {
    if (!mas) generateMas();
    confirmCompliance();
  }

  function exportReport(format: "md" | "html" | "pdf") {
    if (!report) return;
    if (format === "md") {
      downloadTextFile(
        `compliance-report-${report.model}.md`,
        reportToMarkdown(report),
        "text/markdown;charset=utf-8"
      );
      return;
    }
    if (format === "html" || format === "pdf") {
      // PDF: provide print-ready HTML; browser print can save as PDF
      downloadTextFile(
        `compliance-report-${report.model}.html`,
        reportToHtml(report),
        "text/html;charset=utf-8"
      );
    }
  }

  if (!selectionResult) {
    return (
      <div className="panel max-w-2xl p-6 animate-fade-up">
        <h1 className="font-display text-3xl font-semibold">AI 产品合规审核</h1>
        <p className="mt-3 text-sm text-[var(--ink-muted)]">
          当前暂无已确认的产品选型结果，请先完成产品比选。
        </p>
        <Button asChild className="mt-5">
          <Link href="/compare">
            前往产品比选 <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <section className="animate-fade-up">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="font-display text-3xl font-semibold">AI 产品合规审核</h1>
            <p className="mt-2 max-w-2xl text-sm text-[var(--ink-muted)] md:text-base">
              基于已确认产品和项目规范，逐项检查产品是否满足海外工程项目要求。
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={resetCompliance}>
            <RotateCcw className="h-3.5 w-3.5" />
            重置审核
          </Button>
        </div>
      </section>

      <section className="panel p-5 md:p-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-display text-xl font-semibold">当前审核产品</h2>
          <span className="text-sm text-emerald-700">✓ 已从产品比选阶段导入</span>
        </div>
        <div className="mt-4 grid gap-3 text-sm md:grid-cols-2">
          <div>产品：{selectionResult.productName}</div>
          <div>供应商：{selectionResult.supplierName}</div>
          <div>型号：{selectionResult.model}</div>
          <div>综合评分：{selectionResult.overallScore}</div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2 text-sm">
          {selectionResult.dimensions.map((d) => (
            <span
              key={d.dimension}
              className="rounded-md border border-[var(--line)] bg-[var(--surface)] px-2 py-1"
            >
              {d.label} {d.score}
            </span>
          ))}
        </div>
      </section>

      {checks.length > 0 ? (
        <section className="panel p-5 md:p-6 animate-fade-up">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="font-display text-xl font-semibold">合规审核结果</h2>
              <p className="mt-1 text-sm text-[var(--ink-muted)]">检查项目：{summary.total}</p>
            </div>
            <OverallStateBadge state={overallState} />
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-5">
            {[
              { label: "PASS", value: summary.pass, className: "text-emerald-700 bg-emerald-50 border-emerald-200" },
              { label: "FAIL", value: summary.fail, className: "text-red-700 bg-red-50 border-red-200" },
              { label: "REVIEW", value: summary.review, className: "text-amber-800 bg-amber-50 border-amber-200" },
              { label: "MISSING", value: summary.missing, className: "text-orange-700 bg-orange-50 border-orange-200" },
              { label: "N/A", value: summary.notApplicable, className: "text-neutral-600 bg-neutral-50 border-neutral-200" },
            ].map((item) => (
              <div
                key={item.label}
                className={`rounded-md border px-3 py-3 ${item.className}`}
              >
                <div className="text-xs">{item.label}</div>
                <div className="mt-1 text-2xl font-semibold">{item.value}</div>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {(compliancePhase === "import" ||
        compliancePhase === "spec_upload" ||
        compliancePhase === "idle" ||
        compliancePhase === "analyzing" ||
        checks.length === 0) && (
        <section className="panel space-y-5 p-5 md:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-xl font-semibold">项目规范上传</h2>
              <p className="mt-1 text-sm text-[var(--ink-muted)]">
                支持项目规范、国家标准、国际标准、招标文件、技术规格书、客户要求、设计规范、合同要求。
              </p>
            </div>
            <Button variant="outline" onClick={handleLoadDemoSpecs} disabled={analyzing}>
              使用 Demo 项目规范
            </Button>
          </div>
          <FileUpload
            files={specDocs}
            onChange={setSpecDocs}
            category="specification"
            acceptImages={false}
            hint="支持 PDF、Word、Excel、TXT，单个文件不超过 20MB。"
          />
          {specDocs.some((d) => d.parseStatus === "parsing") ? (
            <div className="text-sm text-blue-700">正在解析规范…</div>
          ) : null}
          <Button onClick={handleAnalyze} disabled={analyzing}>
            {analyzing ? "正在生成检查清单…" : "开始合规核查"}
          </Button>
        </section>
      )}

      {compliancePhase === "analyzing" ? (
        <AgentSteps steps={complianceSteps} title="合规 Agent 工作步骤" />
      ) : null}

      {checks.length > 0 ? (
        <>
          <section className="panel p-5 md:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-display text-xl font-semibold">合规检查清单</h2>
              <div className="flex flex-wrap gap-2 text-sm">
                {(["ALL", "PASS", "FAIL", "REVIEW", "MISSING", "NOT_APPLICABLE"] as const).map(
                  (s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setStatusFilter(s)}
                      className={`rounded-md border px-2 py-1 ${
                        statusFilter === s
                          ? "border-brand bg-brand-soft text-brand-dark"
                          : "border-[var(--line)]"
                      }`}
                    >
                      {s === "ALL" ? "全部" : s}
                    </button>
                  )
                )}
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-2 text-sm">
              {(["ALL", "high", "medium", "low"] as const).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRiskFilter(r as "ALL" | RiskLevel)}
                  className={`rounded-md border px-2 py-1 ${
                    riskFilter === r
                      ? "border-brand bg-brand-soft text-brand-dark"
                      : "border-[var(--line)]"
                  }`}
                >
                  {r === "ALL" ? "全部风险" : r === "high" ? "高风险" : r === "medium" ? "中风险" : "低风险"}
                </button>
              ))}
            </div>

            <div className="mt-4 table-scroll">
              <table className="w-full min-w-[900px] text-left text-sm">
                <thead className="border-b border-[var(--line)] bg-[var(--surface)] text-[var(--ink-muted)]">
                  <tr>
                    <th className="px-3 py-2 font-medium">检查项</th>
                    <th className="px-3 py-2 font-medium">规范要求</th>
                    <th className="px-3 py-2 font-medium">产品实际值</th>
                    <th className="px-3 py-2 font-medium">结果</th>
                    <th className="px-3 py-2 font-medium">风险</th>
                    <th className="px-3 py-2 font-medium">置信度</th>
                    <th className="px-3 py-2 font-medium">依据</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredChecks.map((check) => (
                    <tr key={check.id} className="border-b border-[var(--line)]">
                      <td className="px-3 py-2.5 font-medium">{check.checkItem}</td>
                      <td className="px-3 py-2.5">{check.requirement}</td>
                      <td className="px-3 py-2.5">{check.actualValue}</td>
                      <td className="px-3 py-2.5">
                        <ComplianceStatusBadge status={check.status} />
                      </td>
                      <td className="px-3 py-2.5">
                        <RiskBadge risk={check.riskLevel} />
                      </td>
                      <td className="px-3 py-2.5">{check.confidence}%</td>
                      <td className="px-3 py-2.5">
                        <Button size="sm" variant="ghost" onClick={() => openEvidence(check)}>
                          查看依据
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="panel space-y-4 p-5 md:p-6">
            <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
              AI 生成结果，仅供审核确认 · 没有证据 ≠ 不合规（应标为 MISSING）
            </div>
            <h2 className="font-display text-xl font-semibold">人工审核区</h2>
            <p className="text-sm text-[var(--ink-muted)]">
              FAIL / REVIEW / MISSING 均需人工处理。可确认、修改结论、添加备注、上传补充说明并标记已解决。
            </p>

            <div className="space-y-3">
              {reviewTasks.length === 0 ? (
                <p className="text-sm text-emerald-700">当前没有需要人工处理的风险项。</p>
              ) : (
                reviewTasks.map((task) => (
                  <div key={task.id} className="rounded-md border border-[var(--line)] p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="font-medium">
                        {task.checkItem}{" "}
                        <ComplianceStatusBadge status={task.status} />
                      </div>
                      <span className="text-xs text-[var(--ink-muted)]">
                        {task.humanStatus === "resolved" ? "已解决" : "待处理"}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-[var(--ink-muted)]">{task.aiJudgment}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {(["PASS", "FAIL", "REVIEW", "MISSING", "NOT_APPLICABLE"] as ComplianceStatus[]).map(
                        (status) => (
                          <Button
                            key={status}
                            size="sm"
                            variant={task.status === status ? "default" : "outline"}
                            onClick={() =>
                              updateCheck(task.id, {
                                status,
                                humanStatus: "modified",
                              })
                            }
                          >
                            {status}
                          </Button>
                        )
                      )}
                    </div>
                    <textarea
                      className="mt-3 min-h-20 w-full rounded-md border border-[var(--line)] px-3 py-2 text-sm"
                      placeholder="添加备注…"
                      value={task.humanNote ?? ""}
                      onChange={(e) =>
                        updateCheck(task.id, {
                          humanNote: e.target.value,
                          humanStatus: "modified",
                        })
                      }
                    />
                    <div className="mt-2 flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          updateCheck(task.id, {
                            humanStatus: "accepted",
                            humanNote:
                              (task.humanNote ? `${task.humanNote}\n` : "") +
                              "已确认 AI 结论",
                          })
                        }
                      >
                        确认 AI 结论
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          updateCheck(task.id, {
                            humanStatus: "resolved",
                            humanNote:
                              (task.humanNote ? `${task.humanNote}\n` : "") +
                              (supplementNote
                                ? `补充资料说明：${supplementNote}`
                                : "已标记解决"),
                          })
                        }
                      >
                        标记已解决
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => openEvidence(task)}>
                        查看来源
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <label className="block text-sm">
              <span className="mb-1 block text-[var(--ink-muted)]">补充资料说明（演示）</span>
              <input
                value={supplementNote}
                onChange={(e) => setSupplementNote(e.target.value)}
                className="h-9 w-full max-w-xl rounded-md border border-[var(--line)] px-3"
                placeholder="例如：已收到第三方 VOC 测试报告，编号 TR-2025-088"
              />
            </label>

            <div className="flex flex-wrap gap-3">
              <Button variant="outline" onClick={generateMas}>
                生成 MAS 材料
              </Button>
              <Button onClick={handleConfirmResults}>确认合规审核结果</Button>
            </div>
          </section>
        </>
      ) : null}

      {mas ? (
        <section className="panel space-y-4 p-5 md:p-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-display text-xl font-semibold">MAS 审核材料</h2>
            <span className="text-sm text-amber-800">
              AI 已生成 MAS 材料 · {mas.status === "confirmed" ? "已确认" : "待人工审核"}
            </span>
          </div>
          <p className="text-sm text-[var(--ink-muted)]">
            使用可配置模板，不绑定固定国家或法规体系。可编辑、修改、添加或删除内容后确认。
          </p>
          <div className="space-y-3">
            {mas.sections.map((section) => (
              <div key={section.id} className="rounded-md border border-[var(--line)] p-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="font-medium">{section.heading}</div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() =>
                      setMas({
                        ...mas,
                        sections: mas.sections.filter((s) => s.id !== section.id),
                      })
                    }
                  >
                    删除
                  </Button>
                </div>
                <textarea
                  className="mt-2 min-h-24 w-full rounded-md border border-[var(--line)] px-3 py-2 text-sm"
                  value={section.content}
                  onChange={(e) => updateMasSection(section.id, e.target.value)}
                />
              </div>
            ))}
          </div>
          <Button
            variant="outline"
            onClick={() =>
              setMas({
                ...mas,
                sections: [
                  ...mas.sections,
                  {
                    id: uid("mas-sec"),
                    heading: "补充说明",
                    content: "",
                  },
                ],
              })
            }
          >
            添加内容
          </Button>
        </section>
      ) : null}

      {report && compliancePhase === "report" ? (
        <section className="panel space-y-5 p-5 md:p-6 animate-fade-up">
          <div>
            <h2 className="font-display text-xl font-semibold">
              海外工程项目产品合规审核报告
            </h2>
            <p className="mt-1 text-sm text-[var(--ink-muted)]">
              生成时间 {report.generatedAt}
              {report.demoMode ? " · 演示数据" : ""}
            </p>
          </div>

          <div className="space-y-4">
            {report.sections.map((section, idx) => (
              <div key={section.id} className="rounded-md border border-[var(--line)] p-4">
                <h3 className="font-semibold">
                  {String(idx + 1).padStart(2, "0")} {section.title}
                </h3>
                <pre className="mt-2 whitespace-pre-wrap font-sans text-sm text-[var(--ink-muted)]">
                  {section.content}
                </pre>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap gap-3">
            <Button onClick={() => exportReport("md")}>导出审核报告（Markdown）</Button>
            <Button variant="outline" onClick={() => exportReport("html")}>
              导出 HTML / 可打印 PDF
            </Button>
            <Button
              variant="outline"
              onClick={() =>
                setFeishuMsg("当前为演示模式，飞书文档接口尚未配置。")
              }
            >
              导出飞书文档
            </Button>
          </div>
          {feishuMsg ? (
            <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
              {feishuMsg}
            </div>
          ) : null}
        </section>
      ) : null}

      <EvidenceSidebar
        open={!!evidence}
        data={evidence}
        onClose={() => setEvidence(null)}
      />
    </div>
  );
}
