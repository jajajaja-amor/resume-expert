"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  ExternalLink,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  fetchCozeStatus,
  fetchDemoCozeReview,
  submitCozeReview,
} from "@/services/coze/reviewClient";
import { selectionToProductPayload } from "@/services/coze/selection-payload";
import { cn } from "@/lib/utils";
import type { CozeReviewResult, CozeStatusResponse } from "@/types/coze-review";
import type { SelectionResult } from "@/types/workspace";

function statusBadgeText(status: CozeStatusResponse | null, loading: boolean): string {
  if (loading || !status) return "正在检测扣子配置…";
  if (status.reason === "status_unavailable") return "状态接口异常 · 请刷新后重试";
  const feishu = status.feishu?.configured ? " · 飞书已配置" : "";
  if (status.configured) return `扣子已配置（服务端）${feishu}`;
  if (status.reason === "missing_pat") return `未检测到扣子密钥 · 可先用演示结果${feishu}`;
  if (status.reason === "forced_mock") return `已强制演示模式${feishu}`;
  return `未检测到扣子密钥 · 可先用演示结果${feishu}`;
}

export function CozeReviewPanel({
  selection,
}: {
  selection: SelectionResult | null;
}) {
  const [status, setStatus] = useState<CozeStatusResponse | null>(null);
  const [statusLoading, setStatusLoading] = useState(true);
  const [additionalRequirements, setAdditionalRequirements] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [needsAuth, setNeedsAuth] = useState(false);
  const [debugUrl, setDebugUrl] = useState<string | undefined>();
  const [authUrl, setAuthUrl] = useState<string | undefined>();
  const [result, setResult] = useState<CozeReviewResult | null>(null);

  const payload = useMemo(() => {
    if (!selection) return null;
    return selectionToProductPayload(selection, additionalRequirements);
  }, [selection, additionalRequirements]);

  const refreshStatus = useCallback(async () => {
    setStatusLoading(true);
    const next = await fetchCozeStatus();
    setStatus(next);
    setStatusLoading(false);
  }, []);

  useEffect(() => {
    void refreshStatus();
  }, [refreshStatus]);

  useEffect(() => {
    if (!selection) return;
    if (additionalRequirements) return;
    const preset = [
      ...selection.pendingItems,
      selection.humanNotes || "",
      "请结合海外工程项目规范完成合规审查，并输出审查意见、法律引用核验、企业信息核验与飞书报告。",
    ]
      .filter(Boolean)
      .join("\n");
    setAdditionalRequirements(preset);
  }, [selection]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleSubmit(preferDemo = false) {
    if (!payload) {
      setError("当前暂无已确认的产品选型结果，请先完成产品比选。");
      return;
    }

    setLoading(true);
    setError(null);
    setNeedsAuth(false);
    setDebugUrl(undefined);
    setAuthUrl(undefined);

    try {
      const response = await submitCozeReview({
        productPayload: {
          ...payload,
          additionalRequirements:
            additionalRequirements.trim() || payload.additionalRequirements,
        },
        additionalRequirements,
        preferDemo,
      });

      if (!response.ok) {
        setError(response.error);
        setNeedsAuth(Boolean(response.needsAuth));
        setDebugUrl(response.debugUrl);
        setAuthUrl(response.authUrl);
        return;
      }

      setResult(response.result);
      void refreshStatus();
    } catch (e) {
      setError(e instanceof Error ? e.message : "提交失败，请重试");
    } finally {
      setLoading(false);
    }
  }

  async function handleUseDemo() {
    if (!payload) {
      setError("当前暂无已确认的产品选型结果，请先完成产品比选。");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const demo = await fetchDemoCozeReview({
        productPayload: {
          ...payload,
          additionalRequirements:
            additionalRequirements.trim() || payload.additionalRequirements,
        },
        additionalRequirements,
      });
      setResult(demo);
    } catch (e) {
      setError(e instanceof Error ? e.message : "演示结果生成失败");
    } finally {
      setLoading(false);
    }
  }

  if (!selection || !payload) {
    return (
      <section className="panel space-y-4 p-5 md:p-6">
        <h2 className="font-display text-xl font-semibold">扣子工作流 · 产品合规审查</h2>
        <p className="text-sm text-[var(--ink-muted)]">
          当前暂无已确认的产品选型结构化结果。请先完成产品比选并确认选型，系统会自动带入产品类型、公司名称、认证报告、技术资料、价格与物流等信息。
        </p>
        <Button asChild>
          <Link href="/compare">
            前往产品比选 <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </section>
    );
  }

  return (
    <section className="panel space-y-5 p-5 md:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-xl font-semibold">扣子工作流 · 产品合规审查</h2>
          <p className="mt-1 text-sm text-[var(--ink-muted)]">
            已导入阶段一选型结构化结果。提交后将把产品类型、公司名称、认证报告、软膜天花技术性资料、单价、总价、服务物流与补充要求发送给扣子工作流。
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div
            className={cn(
              "rounded-md border px-2.5 py-1 text-xs",
              status?.configured
                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                : status?.reason === "status_unavailable"
                  ? "border-red-200 bg-red-50 text-red-700"
                  : "border-[var(--line)] bg-[var(--surface)] text-[var(--ink-muted)]"
            )}
          >
            {statusBadgeText(status, statusLoading)}
          </div>
          <Button type="button" size="sm" variant="ghost" onClick={() => void refreshStatus()}>
            <RefreshCw className="h-3.5 w-3.5" />
            刷新状态
          </Button>
        </div>
      </div>

      <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
        ✓ 已从产品比选阶段导入结构化文件（SelectionResult）
      </div>

      <div className="table-scroll">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-b border-[var(--line)] bg-[var(--surface)] text-[var(--ink-muted)]">
            <tr>
              <th className="px-3 py-2 font-medium">字段</th>
              <th className="px-3 py-2 font-medium">将发送给扣子的值</th>
            </tr>
          </thead>
          <tbody>
            {[
              ["产品类型", payload.productType],
              ["公司名称", payload.companyName],
              ["认证报告", payload.certificationReport],
              ["单价", payload.unitPrice],
              ["总价", payload.totalPrice],
            ].map(([label, value]) => (
              <tr key={label} className="border-b border-[var(--line)]">
                <td className="px-3 py-2.5 font-medium">{label}</td>
                <td className="px-3 py-2.5 whitespace-pre-wrap">{value}</td>
              </tr>
            ))}
            <tr className="border-b border-[var(--line)]">
              <td className="px-3 py-2.5 font-medium">软膜天花技术性资料</td>
              <td className="px-3 py-2.5 whitespace-pre-wrap">{payload.technicalMaterials}</td>
            </tr>
            <tr className="border-b border-[var(--line)]">
              <td className="px-3 py-2.5 font-medium">服务物流</td>
              <td className="px-3 py-2.5 whitespace-pre-wrap">{payload.serviceLogistics}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <label className="block text-sm">
        <span className="mb-1 block text-[var(--ink-muted)]">补充要求（可编辑）</span>
        <textarea
          className="min-h-28 w-full rounded-md border border-[var(--line)] px-3 py-2"
          value={additionalRequirements}
          onChange={(e) => setAdditionalRequirements(e.target.value)}
          placeholder="补充项目规范关注点、交付与合规要求等"
        />
      </label>

      <div className="flex flex-wrap gap-3">
        <Button onClick={() => void handleSubmit(false)} disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              正在调用扣子工作流…
            </>
          ) : (
            "提交结构化结果并调用扣子审查"
          )}
        </Button>
        <Button variant="outline" onClick={() => void handleUseDemo()} disabled={loading}>
          使用演示结果
        </Button>
      </div>

      {error ? (
        <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          <div className="flex items-start gap-2">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <div className="space-y-2">
              <p>{error}</p>
              {needsAuth ? (
                <div className="space-y-1 text-red-700">
                  <p>提示：扣子内部「飞书云文档」插件仍可能中断 API。</p>
                  <p>
                    可到扣子飞书节点使用<strong>共享授权</strong>后重试；或点「查看演示结果」，系统会用已配置的飞书应用生成报告链接。
                  </p>
                </div>
              ) : null}
              <div className="flex flex-col gap-1">
                {authUrl ? (
                  <a
                    href={authUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 font-medium text-brand underline-offset-2 hover:underline"
                  >
                    打开飞书授权页 <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                ) : null}
                {debugUrl ? (
                  <a
                    href={debugUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-brand underline-offset-2 hover:underline"
                  >
                    打开扣子调试页 <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                ) : null}
              </div>
              <div className="flex flex-wrap gap-2 pt-1">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => void handleSubmit(false)}
                  disabled={loading}
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  重新尝试
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => void handleUseDemo()}
                  disabled={loading}
                >
                  查看演示结果
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {result ? <CozeResultView result={result} /> : null}
    </section>
  );
}

function CozeResultView({ result }: { result: CozeReviewResult }) {
  return (
    <div className="space-y-4 animate-fade-up">
      {result.source === "demo" || result.demoLabel ? (
        <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          {result.demoLabel || "当前为演示结果"}
        </div>
      ) : (
        <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          已从扣子工作流返回审查结果
        </div>
      )}

      {result.summary ? (
        <p className="text-sm text-[var(--ink-muted)]">{result.summary}</p>
      ) : null}

      <div>
        <h3 className="font-semibold">审查意见列表</h3>
        <div className="mt-3 space-y-3">
          {result.opinions.length === 0 ? (
            <p className="text-sm text-[var(--ink-muted)]">暂无审查意见</p>
          ) : (
            result.opinions.map((op, idx) => (
              <div key={op.id} className="rounded-md border border-[var(--line)] p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="font-medium">
                    {idx + 1}. {op.title}
                  </div>
                  {op.riskLevel ? (
                    <span className="text-xs text-[var(--ink-muted)]">风险：{op.riskLevel}</span>
                  ) : null}
                </div>
                {op.clause ? (
                  <div className="mt-1 text-xs text-[var(--ink-muted)]">相关条款：{op.clause}</div>
                ) : null}
                <dl className="mt-3 space-y-2 text-sm">
                  <div>
                    <dt className="text-[var(--ink-muted)]">问题</dt>
                    <dd>{op.problem || "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-[var(--ink-muted)]">分析</dt>
                    <dd>{op.analysis || "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-[var(--ink-muted)]">修改建议</dt>
                    <dd>{op.suggestion || "—"}</dd>
                  </div>
                </dl>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-md border border-[var(--line)] p-4">
          <h3 className="font-semibold">法律引用核验结果</h3>
          <ul className="mt-3 space-y-3 text-sm">
            {result.legalCitations.length === 0 ? (
              <li className="text-[var(--ink-muted)]">暂无法律引用核验结果</li>
            ) : (
              result.legalCitations.map((item) => (
                <li key={item.id}>
                  <div className="font-medium">{item.citation}</div>
                  <div className="text-xs text-[var(--ink-muted)]">状态：{item.status}</div>
                  {item.detail ? <div className="mt-1">{item.detail}</div> : null}
                </li>
              ))
            )}
          </ul>
        </div>

        <div className="rounded-md border border-[var(--line)] p-4">
          <h3 className="font-semibold">企业信息核验结果</h3>
          <ul className="mt-3 space-y-3 text-sm">
            {result.enterpriseChecks.length === 0 ? (
              <li className="text-[var(--ink-muted)]">暂无企业信息核验结果</li>
            ) : (
              result.enterpriseChecks.map((item) => (
                <li key={item.id}>
                  <div className="font-medium">{item.name}</div>
                  <div className="text-xs text-[var(--ink-muted)]">状态：{item.status}</div>
                  {item.detail ? <div className="mt-1">{item.detail}</div> : null}
                </li>
              ))
            )}
          </ul>
        </div>
      </div>

      <div className="rounded-md border border-[var(--line)] p-4 text-sm">
        <h3 className="font-semibold">飞书完整审查报告地址</h3>
        {result.feishuReportUrl ? (
          <div className="mt-2 space-y-1">
            <a
              href={result.feishuReportUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-brand underline-offset-2 hover:underline"
            >
              {result.feishuReportUrl}
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
            <p className="text-xs text-[var(--ink-muted)]">
              由服务端飞书应用生成（当前为电子表格报告）。
            </p>
          </div>
        ) : (
          <p className="mt-2 text-[var(--ink-muted)]">当前未返回飞书报告地址。</p>
        )}
        {result.debugUrl ? (
          <a
            href={result.debugUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-2 block text-xs text-[var(--ink-muted)] underline-offset-2 hover:underline"
          >
            扣子调试链接
          </a>
        ) : null}
      </div>
    </div>
  );
}
