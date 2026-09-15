import { NextResponse } from "next/server";
import { mkdtemp, writeFile, rm } from "fs/promises";
import { tmpdir } from "os";
import path from "path";
import { spawn } from "child_process";

export const runtime = "nodejs";
export const maxDuration = 120;

const MAX_SIZE = 20 * 1024 * 1024;
const ALLOWED_EXT = new Set([".txt", ".pdf", ".docx", ".xlsx", ".xls"]);

function runPythonParse(filePath: string): Promise<{
  ok: boolean;
  text: string;
  warning?: string | null;
  error?: string | null;
  chars?: number;
}> {
  const script = path.join(process.cwd(), "scripts", "parse_document.py");
  return new Promise((resolve, reject) => {
    const child = spawn("python3", [script, "--json", filePath], {
      env: { ...process.env, PYTHONIOENCODING: "utf-8" },
    });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (d) => {
      stdout += d.toString("utf8");
    });
    child.stderr.on("data", (d) => {
      stderr += d.toString("utf8");
    });
    child.on("error", reject);
    child.on("close", () => {
      try {
        const parsed = JSON.parse(stdout.trim() || "{}") as {
          ok?: boolean;
          text?: string;
          warning?: string | null;
          error?: string | null;
          chars?: number;
        };
        resolve({
          ok: Boolean(parsed.ok),
          text: parsed.text || "",
          warning: parsed.warning,
          error: parsed.error || (parsed.ok ? null : stderr || "解析失败"),
          chars: parsed.chars,
        });
      } catch {
        reject(new Error(stderr || stdout || "解析脚本返回无效 JSON"));
      }
    });
  });
}

export async function POST(request: Request) {
  let tempDir: string | null = null;
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

    tempDir = await mkdtemp(path.join(tmpdir(), "speclens-parse-"));
    const safeName = `${Date.now()}${ext}`;
    const filePath = path.join(tempDir, safeName);
    const bytes = Buffer.from(await file.arrayBuffer());
    await writeFile(filePath, bytes);

    const result = await runPythonParse(filePath);
    if (!result.ok && !result.text.trim()) {
      return NextResponse.json(
        {
          ok: false,
          text: "",
          warning: result.warning,
          error: result.error || "未能从文件提取文字",
          engine: "biaoshu-writer-pro/parse_bid_files",
        },
        { status: 422 }
      );
    }

    return NextResponse.json({
      ok: true,
      text: result.text,
      warning: result.warning,
      error: null,
      chars: result.chars ?? result.text.length,
      engine: "biaoshu-writer-pro/parse_bid_files",
      fileName: file.name,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "文档解析失败";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  } finally {
    if (tempDir) {
      await rm(tempDir, { recursive: true, force: true }).catch(() => undefined);
    }
  }
}
