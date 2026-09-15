import { getFeishuConfig } from "@/services/feishu/config";
import type { CozeReviewResult } from "@/types/coze-review";

export class FeishuApiError extends Error {
  code?: number;
  permissionUrl?: string;

  constructor(message: string, options?: { code?: number; permissionUrl?: string }) {
    super(message);
    this.name = "FeishuApiError";
    this.code = options?.code;
    this.permissionUrl = options?.permissionUrl;
  }
}

let cachedToken: { token: string; expireAt: number } | null = null;

async function getTenantAccessToken(): Promise<string> {
  const config = getFeishuConfig();
  if (!config.configured) {
    throw new FeishuApiError("未配置 FEISHU_APP_ID / FEISHU_APP_SECRET");
  }

  if (cachedToken && Date.now() < cachedToken.expireAt - 60_000) {
    return cachedToken.token;
  }

  const response = await fetch(
    "https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        app_id: config.appId,
        app_secret: config.appSecret,
      }),
    }
  );
  const json = (await response.json()) as {
    code?: number;
    msg?: string;
    tenant_access_token?: string;
    expire?: number;
  };

  if (json.code !== 0 || !json.tenant_access_token) {
    throw new FeishuApiError(json.msg || "获取飞书 tenant_access_token 失败", {
      code: json.code,
    });
  }

  cachedToken = {
    token: json.tenant_access_token,
    expireAt: Date.now() + (json.expire || 7200) * 1000,
  };
  return cachedToken.token;
}

function buildSheetValues(result: CozeReviewResult): string[][] {
  const rows: string[][] = [
    ["海外工程项目产品合规 / 合同审查报告"],
    ["生成时间", new Date().toISOString()],
    ["结果来源", result.source === "coze" ? "扣子工作流" : "演示结果"],
    ["摘要", result.summary || ""],
    [],
    ["一、审查意见列表"],
    ["序号", "标题", "问题", "分析", "修改建议", "风险", "条款"],
  ];

  result.opinions.forEach((op, idx) => {
    rows.push([
      String(idx + 1),
      op.title,
      op.problem,
      op.analysis,
      op.suggestion,
      op.riskLevel || "",
      op.clause || "",
    ]);
  });

  rows.push([]);
  rows.push(["二、法律引用核验结果"]);
  rows.push(["引用", "状态", "说明"]);
  result.legalCitations.forEach((item) => {
    rows.push([item.citation, item.status, item.detail]);
  });

  rows.push([]);
  rows.push(["三、企业信息核验结果"]);
  rows.push(["企业", "状态", "说明"]);
  result.enterpriseChecks.forEach((item) => {
    rows.push([item.name, item.status, item.detail]);
  });

  if (result.demoLabel) {
    rows.push([]);
    rows.push(["备注", result.demoLabel]);
  }

  return rows;
}

async function createSpreadsheetReport(
  token: string,
  title: string,
  result: CozeReviewResult
): Promise<string> {
  const createRes = await fetch("https://open.feishu.cn/open-apis/sheets/v3/spreadsheets", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ title }),
  });
  const createJson = (await createRes.json()) as {
    code?: number;
    msg?: string;
    data?: { spreadsheet?: { spreadsheet_token?: string; url?: string } };
  };

  if (createJson.code !== 0 || !createJson.data?.spreadsheet?.spreadsheet_token) {
    const permissionUrl = createJson.msg?.match(/https:\/\/open\.feishu\.cn\/app\/[^\s]+/)?.[0];
    throw new FeishuApiError(createJson.msg || "创建飞书表格失败", {
      code: createJson.code,
      permissionUrl,
    });
  }

  const spreadsheetToken = createJson.data.spreadsheet.spreadsheet_token;
  const url =
    createJson.data.spreadsheet.url ||
    `https://feishu.cn/sheets/${spreadsheetToken}`;

  const sheetsRes = await fetch(
    `https://open.feishu.cn/open-apis/sheets/v3/spreadsheets/${spreadsheetToken}/sheets/query`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  const sheetsJson = (await sheetsRes.json()) as {
    code?: number;
    data?: { sheets?: Array<{ sheet_id?: string }> };
  };
  const sheetId = sheetsJson.data?.sheets?.[0]?.sheet_id || "sheet1";
  const values = buildSheetValues(result);
  const endRow = Math.max(values.length, 1);
  const endCol = "G";

  const writeRes = await fetch(
    `https://open.feishu.cn/open-apis/sheets/v2/spreadsheets/${spreadsheetToken}/values`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        valueRange: {
          range: `${sheetId}!A1:${endCol}${endRow}`,
          values,
        },
      }),
    }
  );
  const writeJson = (await writeRes.json()) as { code?: number; msg?: string };
  if (writeJson.code !== 0) {
    // Document created; content write failed — still return URL
    console.warn("[feishu] write values failed:", writeJson.msg);
  }

  return url;
}

/**
 * Create a Feishu report for a review result.
 * Uses Sheets API by default because current app already has spreadsheet scopes;
 * Docx can be enabled later after granting docx:document:create.
 */
export async function createFeishuReviewReport(
  result: CozeReviewResult,
  title?: string
): Promise<{ url: string; provider: "feishu_sheet" }> {
  const token = await getTenantAccessToken();
  const reportTitle =
    title ||
    `SpecLens 合规审查报告 ${new Date().toISOString().slice(0, 19).replace("T", " ")}`;
  const url = await createSpreadsheetReport(token, reportTitle, result);
  return { url, provider: "feishu_sheet" };
}

export async function maybeAttachFeishuReport(
  result: CozeReviewResult
): Promise<CozeReviewResult> {
  const config = getFeishuConfig();
  if (!config.configured) return result;
  if (result.feishuReportUrl) return result;

  try {
    const created = await createFeishuReviewReport(result);
    return {
      ...result,
      feishuReportUrl: created.url,
    };
  } catch (error) {
    // Soft-fail: keep review result even if Feishu doc creation fails
    const message = error instanceof Error ? error.message : "飞书报告生成失败";
    return {
      ...result,
      summary: result.summary
        ? `${result.summary}\n（飞书报告未生成：${message}）`
        : `飞书报告未生成：${message}`,
    };
  }
}
