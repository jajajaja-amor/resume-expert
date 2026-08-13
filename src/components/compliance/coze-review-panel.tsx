"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  ExternalLink,
  FileUp,
  Loader2,
  RefreshCw,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  fetchCozeStatus,
  fetchDemoCozeReview,
  submitCozeReview,
} from "@/services/coze/reviewClient";
import { cn, formatFileSize } from "@/lib/utils";
import type { CozeReviewResult, CozeStatusResponse } from "@/types/coze-review";

const CONTRACT_TYPES = ["采购合同", "供货合同", "服务合同", "框架协议", "其他"];
const STANCES = ["甲方", "乙方", "中立审核"];
const MAX_FILE_SIZE = 20 * 1024 * 1024;

function statusBadgeText(status: CozeStatusResponse | null, loading: boolean): string {
  if (loading || !status) return "正在检测扣子配置…";
  if (status.reason === "status_unavailable") return "状态接口异常 · 请刷新后重试";
  if (status.configured) return "扣子已配置（服务端）";
  if (status.reason === "missing_pat") return "未检测到扣子密钥 · 可先用演示结果";
  if (status.reason === "forced_mock") return "已强制演示模式";
  return "未检测到扣子密钥 · 可先用演示结果";
}

export function CozeReviewPanel({
  defaultFocus,
  defaultExtra,
}: {
  defaultFocus?: string;
  defaultExtra?: string;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<CozeStatusResponse | null>(null);
  const [statusLoading, setStatusLoading] = useState(true);
  const [contractType, setContractType] = useState("采购合同");
  const [reviewStance, setReviewStance] = useState("甲方");
  const [focusContent, setFocusContent] = useState(
    defaultFocus || "付款条款、违约责任、合规认证与交付资料"
  );
  const [additionalRequirements, setAdditionalRequirements] = useState(
    defaultExtra || "请输出审查意见、法律引用核验、企业信息核验，并尽量提供飞书报告链接"
  );
  const [contractText, setContractText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [needsAuth, setNeedsAuth] = useState(false);
  const [debugUrl, setDebugUrl] = useState<string | undefined>();
  const [result, setResult] = useState<CozeReviewResult | null>(null);

  const refreshStatus = useCallback(async () => {
    setStatusLoading(true);
    const next = await fetchCozeStatus();
    setStatus(next);
    setStatusLoading(false);
  }, []);

  useEffect(() => {
    void refreshStatus();
  }, [refreshStatus]);

  function assignFile(next: File | null) {
    setError(null);
    if (!next) {
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }
    if (next.size > MAX_FILE_SIZE) {
      setError(`文件 ${next.name} 超过 20MB，请压缩或更换文件。`);
      return;
    }
    setFile(next);
  }

  async function handleSubmit(preferDemo = false) {
    if (!contractText.trim() && !file) {
      setError("请上传合同文件，或粘贴合同文本。");
      return;
    }

    setLoading(true);
    setError(null);
    setNeedsAuth(false);
    setDebugUrl(undefined);

    try {
      const response = await submitCozeReview({
        contractText,
        contractType,
        reviewStance,
        focusContent,
        additionalRequirements,
        file,
        preferDemo,
      });

      if (!response.ok) {
        setError(response.error);
        setNeedsAuth(Boolean(response.needsAuth));
        setDebugUrl(response.debugUrl);
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
    setLoading(true);
    setError(null);
    try {
      const demo = await fetchDemoCozeReview({
        contractText,
        contractType,
        reviewStance,
        focusContent,
        additionalRequirements,
      });
      setResult(demo);
    } catch (e) {
      setError(e instanceof Error ? e.message : "演示结果生成失败");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="panel space-y-5 p-5 md:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-xl font-semibold">扣子工作流 · 合同合规审查</h2>
          <p className="mt-1 text-sm text-[var(--ink-muted)]">
            提交合同文件/文本及审查要求，由服务端调用扣子工作流并返回结构化审查结果。
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

      <div className="grid gap-4 md:grid-cols-2">
        <label className="block text-sm">
          <span className="mb-1 block text-[var(--ink-muted)]">合同类型</span>
          <select
            className="h-10 w-full rounded-md border border-[var(--line)] bg-white px-3"
            value={contractType}
            onChange={(e) => setContractType(e.target.value)}
          >
            {CONTRACT_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm">
          <span className="mb-1 block text-[var(--ink-muted)]">审查立场</span>
          <select
            className="h-10 w-full rounded-md border border-[var(--line)] bg-white px-3"
            value={reviewStance}
            onChange={(e) => setReviewStance(e.target.value)}
          >
            {STANCES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="block text-sm">
        <span className="mb-1 block text-[var(--ink-muted)]">重点审查内容</span>
        <input
          className="h-10 w-full rounded-md border border-[var(--line)] px-3"
          value={focusContent}
          onChange={(e) => setFocusContent(e.target.value)}
          placeholder="例如：付款条款、违约责任、知识产权、合规认证"
        />
      </label>

      <label className="block text-sm">
        <span className="mb-1 block text-[var(--ink-muted)]">补充要求</span>
        <textarea
          className="min-h-20 w-full rounded-md border border-[var(--line)] px-3 py-2"
          value={additionalRequirements}
          onChange={(e) => setAdditionalRequirements(e.target.value)}
          placeholder="补充说明审查关注点、输出格式等"
        />
      </label>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="text-sm">
          <div className="mb-1 text-[var(--ink-muted)]">上传合同文件</div>
          <div
            className={cn(
              "rounded-lg border border-dashed px-4 py-6 text-center transition-colors",
              dragging ? "border-brand bg-brand-soft" : "border-[var(--line)] bg-white"
            )}
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              const dropped = e.dataTransfer.files?.[0];
              if (dropped) assignFile(dropped);
            }}
          >
            <FileUp className="mx-auto h-7 w-7 text-brand" />
            <p className="mt-2 font-medium">点击选择或拖拽文件到此处</p>
            <p className="mt-1 text-xs text-[var(--ink-muted)]">
              支持 PDF / Word / TXT / MD，单个不超过 20MB
            </p>
            <Button
              type="button"
              variant="outline"
              className="mt-3"
              onClick={() => fileInputRef.current?.click()}
            >
              选择文件
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.doc,.docx,.txt,.md,application/pdf,text/plain,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              className="sr-only"
              onChange={(e) => {
                const next = e.target.files?.[0] ?? null;
                assignFile(next);
              }}
            />
          </div>
          {file ? (
            <div className="mt-3 flex items-center justify-between gap-2 rounded-md border border-[var(--line)] bg-[var(--surface)] px-3 py-2">
              <div className="min-w-0">
                <div className="truncate font-medium">{file.name}</div>
                <div className="text-xs text-[var(--ink-muted)]">{formatFileSize(file.size)}</div>
              </div>
              <Button type="button" size="sm" variant="ghost" onClick={() => assignFile(null)}>
                <Trash2 className="h-3.5 w-3.5" />
                移除
              </Button>
            </div>
          ) : null}
        </div>

        <label className="block text-sm">
          <span className="mb-1 block text-[var(--ink-muted)]">或粘贴合同文本</span>
          <textarea
            className="min-h-40 w-full rounded-md border border-[var(--line)] px-3 py-2"
            value={contractText}
            onChange={(e) => setContractText(e.target.value)}
            placeholder="将合同关键条款粘贴于此…"
          />
        </label>
      </div>

      <div className="flex flex-wrap gap-3">
        <Button onClick={() => void handleSubmit(false)} disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              正在调用扣子工作流…
            </>
          ) : (
            "提交并调用扣子审查"
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
                <p className="text-red-700">
                  提示：当前工作流包含飞书云文档节点，需先在扣子平台完成飞书授权。
                </p>
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
          <a
            href={result.feishuReportUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-2 inline-flex items-center gap-1 text-brand underline-offset-2 hover:underline"
          >
            {result.feishuReportUrl}
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        ) : (
          <p className="mt-2 text-[var(--ink-muted)]">
            当前未返回飞书报告地址
            {result.source === "demo"
              ? "（演示模式不生成真实飞书文档）"
              : "（可能因飞书节点未授权或工作流未输出该字段）"}
            。
          </p>
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
