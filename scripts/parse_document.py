#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Document text extraction for SpecLens product compare.
Adapted from @user_509b3ac1/biaoshu-writer-pro scripts/parse_bid_files.py

Supports: txt, pdf, docx, xlsx, xls
Usage:
  python3 scripts/parse_document.py <file>            # plain text to stdout
  python3 scripts/parse_document.py --json <file>     # JSON {ok,text,warning,error}
"""

from __future__ import annotations

import json
import os
import sys


def parse_txt(file_path: str) -> str:
    with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
        return f.read()


def parse_docx(file_path: str) -> str:
    from docx import Document

    doc = Document(file_path)
    paragraphs = []
    for para in doc.paragraphs:
        if para.text.strip():
            paragraphs.append(para.text)

    for table in doc.tables:
        for row in table.rows:
            row_text = " | ".join(
                [cell.text.strip() for cell in row.cells if cell.text.strip()]
            )
            if row_text:
                paragraphs.append(f"[表格] {row_text}")

    return "\n".join(paragraphs)


def check_pdf_is_scanned(file_path: str) -> tuple[bool, str]:
    import pdfplumber

    with pdfplumber.open(file_path) as pdf:
        if len(pdf.pages) == 0:
            return True, "PDF页数为0，无法解析"

        first_page_text = ""
        for page in pdf.pages[:3]:
            text = page.extract_text()
            if text:
                first_page_text = text
                break

        if not first_page_text or len(first_page_text.strip()) < 50:
            return True, "PDF可能为扫描版（文字层缺失或极少）"

        return False, "PDF为文本型，可正常解析"


def parse_pdf(file_path: str) -> tuple[str, str | None]:
    warning = None
    is_scanned, check_msg = check_pdf_is_scanned(file_path)
    if is_scanned:
        warning = check_msg
        try:
            import PyPDF2

            text_parts = []
            with open(file_path, "rb") as f:
                reader = PyPDF2.PdfReader(f)
                for page in reader.pages:
                    text = page.extract_text()
                    if text and len(text.strip()) > 20:
                        text_parts.append(text)
            if text_parts:
                return "\n\n".join(text_parts[:20]), warning + "；已用备用方案提取部分文字"
            return "", (
                "PDF为扫描版，无法自动提取文字。请使用 OCR 后上传 TXT，或直接粘贴原文。"
            )
        except Exception as e:
            return "", f"扫描版 PDF 备用提取失败: {e}"

    import pdfplumber

    text_parts = []
    with pdfplumber.open(file_path) as pdf:
        for page in pdf.pages:
            text = page.extract_text()
            if text:
                text_parts.append(text)
    return "\n\n".join(text_parts), warning


def parse_xlsx(file_path: str) -> str:
    import openpyxl

    text_parts = []
    wb = openpyxl.load_workbook(file_path, data_only=True)
    for sheet_name in wb.sheetnames:
        sheet = wb[sheet_name]
        text_parts.append(f"=== Sheet: {sheet_name} ===")
        for row in sheet.iter_rows(values_only=True):
            row_text = " | ".join(
                [str(cell) if cell is not None else "" for cell in row]
            )
            if row_text.strip():
                text_parts.append(row_text)
    return "\n".join(text_parts)


def parse_file(file_path: str) -> tuple[str, str | None, str | None]:
    """Return (text, warning, error)."""
    if not os.path.exists(file_path):
        return "", None, f"文件不存在: {file_path}"

    ext = os.path.splitext(file_path)[1].lower()
    try:
        if ext == ".txt":
            return parse_txt(file_path), None, None
        if ext == ".docx":
            return parse_docx(file_path), None, None
        if ext == ".pdf":
            text, warning = parse_pdf(file_path)
            if not text.strip():
                return "", warning, warning or "未能从 PDF 提取文字"
            return text, warning, None
        if ext in (".xlsx", ".xls"):
            return parse_xlsx(file_path), None, None
        return "", None, f"不支持的文件格式: {ext}（支持 txt/docx/pdf/xlsx）"
    except Exception as e:
        return "", None, f"解析失败: {e}"


def main() -> None:
    args = sys.argv[1:]
    as_json = False
    if args and args[0] == "--json":
        as_json = True
        args = args[1:]

    if not args:
        print("用法: python3 parse_document.py [--json] <文件路径>", file=sys.stderr)
        sys.exit(1)

    file_path = args[0]
    text, warning, error = parse_file(file_path)

    if as_json:
        payload = {
            "ok": not bool(error),
            "text": text or "",
            "warning": warning,
            "error": error,
            "chars": len(text or ""),
        }
        print(json.dumps(payload, ensure_ascii=False))
        sys.exit(0 if not error else 2)

    if error:
        print(error, file=sys.stderr)
        sys.exit(2)
    if warning:
        print(f"[警告] {warning}", file=sys.stderr)
    print(text)


if __name__ == "__main__":
    main()
