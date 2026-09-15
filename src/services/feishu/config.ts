/** Server-only Feishu Open Platform config. Secrets never go to the client. */

export function getFeishuConfig() {
  const appId = process.env.FEISHU_APP_ID?.trim() || "";
  const appSecret = process.env.FEISHU_APP_SECRET?.trim() || "";
  const folderToken = process.env.FEISHU_FOLDER_TOKEN?.trim() || "";
  const preferredDocType =
    (process.env.FEISHU_DOC_TYPE?.trim() as "sheet" | "docx" | undefined) || "sheet";

  return {
    appId,
    appSecret,
    folderToken,
    preferredDocType,
    configured: Boolean(appId && appSecret),
  };
}

export function getPublicFeishuStatus() {
  const config = getFeishuConfig();
  return {
    configured: config.configured,
    docType: config.preferredDocType,
  };
}
