import {
  AuditLogEntry,
  ComplianceCheck,
  COMPLIANCE_STATUS_LABEL,
  effectiveStatus,
  MasDocument,
  RISK_LABEL,
  SelectionResult,
  Specification,
} from "@/types/domain";

export interface ReportInput {
  selection: SelectionResult;
  specifications: Specification[];
  checks: ComplianceCheck[];
  mas: MasDocument | null;
  auditLog: AuditLogEntry[];
  overallStatus: string;
}

function fmtTime(t: number) {
  return new Date(t).toLocaleString("zh-CN", { hour12: false });
}

function checkLine(c: ComplianceCheck): string {
  const status = COMPLIANCE_STATUS_LABEL[effectiveStatus(c)];
  const human = c.humanStatus ? `（人工修改，AI 原判 ${COMPLIANCE_STATUS_LABEL[c.aiStatus]}）` : "";
  return `| ${c.name} | ${c.requiredValue} | ${c.actualValue} | ${status}${human} | ${c.confidence}% | ${RISK_LABEL[c.risk]} |`;
}

export function buildReportMarkdown(input: ReportInput): string {
  const { selection, specifications, checks, mas, auditLog, overallStatus } = input;
  const byStatus = (s: string) => checks.filter((c) => effectiveStatus(c) === s);
  const sourceDocs = Array.from(
    new Set([
      ...selection.sourceDocuments,
      ...specifications.map((s) => s.documentName),
    ])
  );

  const lines: string[] = [
    `# 海外工程项目产品合规审核报告`,
    ``,
    `> 本报告由 SpecLens 工作台生成（Demo Mode，数据为模拟数据）。所有 AI 结论均已经过人工审核确认。`,
    ``,
    `## 01 项目基本信息`,
    ``,
    `- 项目名称：${selection.projectName}`,
    `- 报告生成时间：${fmtTime(Date.now())}`,
    `- 整体审核状态：**${overallStatus}**`,
    ``,
    `## 02 产品信息`,
    ``,
    `- 产品：${selection.productName}`,
    `- 类别：${selection.productCategory}`,
    `- 型号：${selection.model}`,
    ``,
    `## 03 供应商信息`,
    ``,
    `- 供应商：${selection.supplierName}`,
    ``,
    `## 04 产品参数`,
    ``,
    `| 参数 | 值 |`,
    `| --- | --- |`,
    ...selection.keyParameters.map((p) => `| ${p.label} | ${p.value} |`),
    ``,
    `## 05 六维产品评分`,
    ``,
    `综合评分：**${selection.overallScore} / 100**`,
    ``,
    `| 维度 | 评分 |`,
    `| --- | --- |`,
    ...selection.dimensionScores.map((d) => `| ${d.label} | ${d.score} |`),
    ``,
    `## 06 适用规范`,
    ``,
    ...specifications.map((s) => `- ${s.title}（${s.type}，${s.documentName}）`),
    ``,
    `## 07 合规检查清单`,
    ``,
    `| 检查项 | 规范要求 | 产品实际值 | 结果 | 置信度 | 风险 |`,
    `| --- | --- | --- | --- | --- | --- |`,
    ...checks.map(checkLine),
    ``,
    `## 08 PASS 项（${byStatus("PASS").length}）`,
    ``,
    ...byStatus("PASS").map((c) => `- ${c.name}：${c.aiJudgement}`),
    ``,
    `## 09 FAIL 项（${byStatus("FAIL").length}）`,
    ``,
    ...(byStatus("FAIL").length
      ? byStatus("FAIL").map(
          (c) =>
            `- **${c.name}**：要求 ${c.requiredValue}；实际 ${c.actualValue}。${c.aiJudgement}${c.suggestion ? ` 建议：${c.suggestion}` : ""}`
        )
      : ["- 无"]),
    ``,
    `## 10 REVIEW 项（${byStatus("REVIEW").length}）`,
    ``,
    ...(byStatus("REVIEW").length
      ? byStatus("REVIEW").map((c) => `- **${c.name}**：${c.aiJudgement}${c.humanNote ? `（人工备注：${c.humanNote}）` : ""}`)
      : ["- 无"]),
    ``,
    `## 11 MISSING 项（${byStatus("MISSING").length}）`,
    ``,
    ...(byStatus("MISSING").length
      ? byStatus("MISSING").map((c) => `- **${c.name}**：${c.aiJudgement}${c.supplementDocument ? `（已上传补充资料：${c.supplementDocument}）` : ""}`)
      : ["- 无"]),
    ``,
    `## 12 风险与建议`,
    ``,
    ...checks
      .filter((c) => c.suggestion)
      .map((c) => `- ${c.name}（${RISK_LABEL[c.risk]}）：${c.suggestion}`),
    ...selection.risks.map((r) => `- 选型阶段风险：${r}`),
    ``,
    `## 13 待人工确认事项`,
    ``,
    ...selection.pendingItems.map((p) => `- ${p}`),
    ``,
    `## 14 来源文件索引`,
    ``,
    ...sourceDocs.map((d) => `- ${d}`),
    ``,
    `## 15 审核记录`,
    ``,
    ...(auditLog.length
      ? auditLog.map((a) => `- ${fmtTime(a.time)} · ${a.actor} · ${a.action}`)
      : ["- 无"]),
    ``,
  ];

  if (mas) {
    lines.push(`## 附录：MAS 审核材料（${mas.status === "confirmed" ? "已人工确认" : "草稿"}）`, ``);
    lines.push(`模板：${mas.templateName}`, ``);
    for (const s of mas.sections) {
      lines.push(`### ${s.title}`, ``, s.content.replace(/\n/g, "\n\n"), ``);
    }
  }

  return lines.join("\n");
}

function escapeHtml(s: string) {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

/** 极简 Markdown → HTML（标题 / 表格 / 列表 / 引用 / 加粗），用于 HTML 导出。 */
export function markdownToHtml(md: string): string {
  const lines = md.split("\n");
  const out: string[] = [];
  let inTable = false;
  let inList = false;

  const closeAll = () => {
    if (inTable) {
      out.push("</table>");
      inTable = false;
    }
    if (inList) {
      out.push("</ul>");
      inList = false;
    }
  };

  const inline = (s: string) =>
    escapeHtml(s).replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");

  for (const raw of lines) {
    const line = raw.trimEnd();
    if (line.startsWith("|")) {
      if (/^\|[\s\-|]+\|$/.test(line)) continue; // 分隔行
      if (!inTable) {
        closeAll();
        out.push('<table border="1" cellspacing="0" cellpadding="6">');
        inTable = true;
      }
      const cells = line.slice(1, -1).split("|").map((c) => inline(c.trim()));
      out.push(`<tr>${cells.map((c) => `<td>${c}</td>`).join("")}</tr>`);
      continue;
    }
    if (inTable) {
      out.push("</table>");
      inTable = false;
    }
    if (line.startsWith("- ")) {
      if (!inList) {
        out.push("<ul>");
        inList = true;
      }
      out.push(`<li>${inline(line.slice(2))}</li>`);
      continue;
    }
    if (inList) {
      out.push("</ul>");
      inList = false;
    }
    if (line.startsWith("### ")) out.push(`<h3>${inline(line.slice(4))}</h3>`);
    else if (line.startsWith("## ")) out.push(`<h2>${inline(line.slice(3))}</h2>`);
    else if (line.startsWith("# ")) out.push(`<h1>${inline(line.slice(2))}</h1>`);
    else if (line.startsWith("> ")) out.push(`<blockquote>${inline(line.slice(2))}</blockquote>`);
    else if (line === "") out.push("");
    else out.push(`<p>${inline(line)}</p>`);
  }
  closeAll();
  return out.join("\n");
}

export function buildReportHtml(input: ReportInput): string {
  const body = markdownToHtml(buildReportMarkdown(input));
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="utf-8" />
<title>海外工程项目产品合规审核报告</title>
<style>
  body { font-family: system-ui, -apple-system, "Segoe UI", sans-serif; max-width: 880px; margin: 40px auto; padding: 0 24px; color: #1f2a2e; line-height: 1.65; }
  h1 { border-bottom: 2px solid #1d5c57; padding-bottom: 8px; }
  h2 { color: #1d5c57; margin-top: 32px; }
  table { border-collapse: collapse; width: 100%; font-size: 14px; margin: 12px 0; }
  td { border: 1px solid #d8dee0; }
  blockquote { border-left: 3px solid #1d5c57; margin: 12px 0; padding: 4px 12px; color: #556; background: #f5f7f7; }
</style>
</head>
<body>
${body}
</body>
</html>`;
}

export function downloadFile(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: `${mime};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/** 导出参数对比表（阶段一）为 Markdown。 */
export function buildParameterTableMarkdown(
  supplierNames: string[],
  rows: { label: string; values: string[] }[]
): string {
  const header = `| 参数 | ${supplierNames.join(" | ")} |`;
  const sep = `| --- | ${supplierNames.map(() => "---").join(" | ")} |`;
  const body = rows.map((r) => `| ${r.label} | ${r.values.join(" | ")} |`);
  return ["# 产品参数对比表", "", header, sep, ...body, ""].join("\n");
}
