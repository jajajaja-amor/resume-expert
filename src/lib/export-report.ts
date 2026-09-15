import type { ComplianceReport, SelectionResult } from "@/types/workspace";
import { overallStateLabel } from "@/lib/utils";

export function selectionToCsv(selection: SelectionResult): string {
  const rows = [
    ["字段", "值"],
    ["项目", selection.projectName],
    ["产品", selection.productName],
    ["供应商", selection.supplierName],
    ["型号", selection.model],
    ["综合评分", String(selection.overallScore)],
    ...selection.dimensions.map((d) => [`维度-${d.label}`, String(d.score)]),
    ...selection.coreParameters.map((p) => [`参数-${p.label}`, p.value]),
  ];
  return rows.map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(",")).join("\n");
}

export function reportToMarkdown(report: ComplianceReport): string {
  const lines: string[] = [];
  lines.push(`# 海外工程项目产品合规审核报告`);
  lines.push("");
  lines.push(`> 生成时间：${report.generatedAt}`);
  if (report.demoMode) {
    lines.push(`> 当前为演示模式，以下数据为模拟数据。`);
  }
  lines.push("");
  lines.push(`**整体审核状态：** ${overallStateLabel(report.overallState)}`);
  lines.push("");
  lines.push(`检查项目：${report.summary.total}｜PASS ${report.summary.pass}｜FAIL ${report.summary.fail}｜REVIEW ${report.summary.review}｜MISSING ${report.summary.missing}`);
  lines.push("");

  report.sections.forEach((section, idx) => {
    lines.push(`## ${String(idx + 1).padStart(2, "0")} ${section.title}`);
    lines.push("");
    lines.push(section.content);
    lines.push("");
  });

  lines.push(`## 合规检查清单`);
  lines.push("");
  lines.push(`| 检查项 | 规范要求 | 产品实际值 | 结果 | 置信度 |`);
  lines.push(`| --- | --- | --- | --- | --- |`);
  report.checks.forEach((c) => {
    lines.push(
      `| ${c.checkItem} | ${c.requirement} | ${c.actualValue} | ${c.status} | ${c.confidence}% |`
    );
  });
  lines.push("");

  (["PASS", "FAIL", "REVIEW", "MISSING"] as const).forEach((status) => {
    const items = report.checks.filter((c) => c.status === status);
    lines.push(`## ${status} 项`);
    lines.push("");
    if (items.length === 0) {
      lines.push("无");
    } else {
      items.forEach((c) => {
        lines.push(`- **${c.checkItem}**：${c.aiJudgment}`);
      });
    }
    lines.push("");
  });

  return lines.join("\n");
}

export function reportToHtml(report: ComplianceReport): string {
  const mdish = reportToMarkdown(report)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <title>海外工程项目产品合规审核报告</title>
  <style>
    body { font-family: "Source Sans 3", "Segoe UI", sans-serif; max-width: 900px; margin: 40px auto; color: #1c1c1c; line-height: 1.6; padding: 0 20px; }
    h1 { color: #0f5c4c; }
    pre { white-space: pre-wrap; background: #f7f7f5; padding: 16px; border: 1px solid #e5e5e2; border-radius: 8px; }
  </style>
</head>
<body>
  <pre>${mdish}</pre>
</body>
</html>`;
}

export function buildReportSections(
  selection: SelectionResult,
  report: Pick<ComplianceReport, "summary" | "overallState" | "checks" | "mas">
): ComplianceReport["sections"] {
  const dimText = selection.dimensions
    .map((d) => `- ${d.label}：${d.score}/100`)
    .join("\n");
  const paramText = selection.coreParameters
    .map((p) => `- ${p.label}：${p.value}`)
    .join("\n");
  const pass = report.checks.filter((c) => c.status === "PASS");
  const fail = report.checks.filter((c) => c.status === "FAIL");
  const review = report.checks.filter((c) => c.status === "REVIEW");
  const missing = report.checks.filter((c) => c.status === "MISSING");

  return [
    {
      id: "s01",
      title: "项目基本信息",
      content: `项目名称：${selection.projectName}\n审核状态：${overallStateLabel(report.overallState)}`,
    },
    {
      id: "s02",
      title: "产品信息",
      content: `产品：${selection.productName}\n型号：${selection.model}\n综合评分：${selection.overallScore}`,
    },
    {
      id: "s03",
      title: "供应商信息",
      content: `供应商：${selection.supplierName}`,
    },
    {
      id: "s04",
      title: "产品参数",
      content: paramText,
    },
    {
      id: "s05",
      title: "六维产品评分",
      content: dimText,
    },
    {
      id: "s06",
      title: "适用规范",
      content:
        "- Project_Specification_Interior_Finishes.pdf\n- Client_Technical_Requirements.docx",
    },
    {
      id: "s07",
      title: "合规检查清单",
      content: `共 ${report.summary.total} 项：PASS ${report.summary.pass} / FAIL ${report.summary.fail} / REVIEW ${report.summary.review} / MISSING ${report.summary.missing}`,
    },
    {
      id: "s08",
      title: "PASS 项",
      content: pass.map((c) => `- ${c.checkItem}：${c.actualValue}`).join("\n") || "无",
    },
    {
      id: "s09",
      title: "FAIL 项",
      content: fail.map((c) => `- ${c.checkItem}：${c.aiJudgment}`).join("\n") || "无",
    },
    {
      id: "s10",
      title: "REVIEW 项",
      content: review.map((c) => `- ${c.checkItem}：${c.aiJudgment}`).join("\n") || "无",
    },
    {
      id: "s11",
      title: "MISSING 项",
      content: missing.map((c) => `- ${c.checkItem}：${c.aiJudgment}`).join("\n") || "无",
    },
    {
      id: "s12",
      title: "风险与建议",
      content: [
        ...selection.risks.map((r) => `- 风险：${r}`),
        ...report.checks
          .filter((c) => c.suggestion)
          .map((c) => `- 建议（${c.checkItem}）：${c.suggestion}`),
      ].join("\n") || "无",
    },
    {
      id: "s13",
      title: "待人工确认事项",
      content: [...selection.pendingItems, ...review.map((c) => c.checkItem)]
        .map((x) => `- ${x}`)
        .join("\n") || "无",
    },
    {
      id: "s14",
      title: "来源文件索引",
      content: selection.sourceDocuments.map((d) => `- ${d}`).join("\n"),
    },
    {
      id: "s15",
      title: "审核记录",
      content: `人工审核状态：${selection.humanReviewStatus}\n确认时间：${selection.confirmedAt}\n报告确认：${report.mas?.status ?? "pending"}`,
    },
  ];
}
