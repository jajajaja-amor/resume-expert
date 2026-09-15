import { NextResponse } from "next/server";
import path from "path";
import { extractText as extractPdfText } from "unpdf";
import mammoth from "mammoth";
import * as XLSX from "xlsx";

export const runtime = "nodejs";
export const maxDuration = 120;

const MAX_SIZE = 20 * 1024 * 1024;
const ALLOWED_EXT = new Set([".txt", ".pdf", ".docx", ".xlsx", ".xls"]);

async function parseBuffer(
  ext: string,
  bytes: Uint8Array,
  fileName: string
): Promise<{ ok: boolean; text: string; warning?: string | null; error?: string | null }> {
  if (ext === ".txt") {
    const text = new TextDecoder("utf-8").decode(bytes);
    return { ok: Boolean(text.trim()), text, error: text.trim() ? null : "空文本文件" };
  }

  if (ext === ".pdf") {
    const { text } = await extractPdfText(bytes, { mergePages: true });
    const joined = Array.isArray(text) ? text.join("\n") : String(text || "");
    if (!joined.trim()) {
      return {
        ok: false,
        text: "",
        warning: "PDF 未提取到可检索文本（可能是扫描件），请粘贴原文或提供带文字层的 PDF。",
        error: "未能从 PDF 提取文字",
      };
    }
    return { ok: true, text: joined };
  }

  if (ext === ".docx") {
    const result = await mammoth.extractRawText({ buffer: Buffer.from(bytes) });
    const text = result.value || "";
    return {
      ok: Boolean(text.trim()),
      text,
      warning: result.messages?.length ? result.messages.map((m) => m.message).join("; ") : null,
      error: text.trim() ? null : "未能从 DOCX 提取文字",
    };
  }

  if (ext === ".xlsx" || ext === ".xls") {
    const workbook = XLSX.read(bytes, { type: "array" });
    const chunks: string[] = [];
    for (const sheetName of workbook.SheetNames) {
      const sheet = workbook.Sheets[sheetName];
      if (!sheet) continue;
      chunks.push(`# ${sheetName}`);
      chunks.push(XLSX.utils.sheet_to_csv(sheet));
    }
    const text = chunks.join("\n").trim();
    return {
      ok: Boolean(text),
      text,
      error: text ? null : `未能从表格 ${fileName} 提取文字`,
    };
  }

  return { ok: false, text: "", error: `不支持的格式 ${ext}` };
}

export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "请上传文件（field: file）" }, { status: 400 });
    }
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: "文件超过 20MB" }, { status: 400 });
    }

    const ext = path.extname(file.name || "").toLowerCase();
    if (!ALLOWED_EXT.has(ext)) {
      return NextResponse.json(
        { error: `不支持的格式 ${ext || "(无扩展名)"}，请上传 txt/pdf/docx/xlsx` },
        { status: 400 }
      );
    }

    const bytes = new Uint8Array(await file.arrayBuffer());
    const result = await parseBuffer(ext, bytes, file.name);

    if (!result.ok && !result.text.trim()) {
      return NextResponse.json(
        {
          ok: false,
          text: "",
          warning: result.warning,
          error: result.error || "未能从文件提取文字",
          engine: "speclens-js-parser",
        },
        { status: 422 }
      );
    }

    return NextResponse.json({
      ok: true,
      text: result.text,
      warning: result.warning,
      error: null,
      chars: result.text.length,
      engine: "speclens-js-parser",
      fileName: file.name,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "文档解析失败";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
