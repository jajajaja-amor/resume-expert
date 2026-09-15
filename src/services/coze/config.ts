/**
 * Server-only Coze configuration.
 * Secrets must come from environment / Secrets — never hardcode tokens here.
 */

export function getCozeConfig() {
  const pat = process.env.COZE_PAT?.trim() || "";
  const workflowId =
    process.env.COZE_WORKFLOW_ID?.trim() || "7673528525253820442";
  const apiBase = (process.env.COZE_API_BASE?.trim() || "https://api.coze.cn").replace(
    /\/$/,
    ""
  );
  const forceMock = process.env.COZE_FORCE_MOCK === "true";

  return {
    pat,
    workflowId,
    apiBase,
    forceMock,
    configured: Boolean(pat) && !forceMock,
  };
}

export function getPublicCozeStatus() {
  const config = getCozeConfig();
  if (config.forceMock) {
    return {
      configured: false,
      workflowConfigured: Boolean(config.workflowId),
      mode: "demo" as const,
      reason: "forced_mock",
    };
  }
  if (!config.pat) {
    return {
      configured: false,
      workflowConfigured: Boolean(config.workflowId),
      mode: "demo" as const,
      reason: "missing_pat",
    };
  }
  return {
    configured: true,
    workflowConfigured: Boolean(config.workflowId),
    mode: "coze" as const,
  };
}
