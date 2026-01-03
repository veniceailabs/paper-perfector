import type { Document } from "../models/DocumentSchema";
import { importFromHtml } from "./htmlImport";
import { importFromPdf } from "./pdfImport";
import { importFromImage } from "./imageImport";
import { importFromMarkdown } from "./markdownImport";
import { importFromPlainText } from "./plainTextImport";
import { importFromDocx } from "./docxImport";
import { importFromLegacyDoc } from "./legacyDocImport";

export type ImportResult = {
  document: Document;
  warnings: string[];
  source: string;
};

export async function importDocumentFromFile(file: File): Promise<ImportResult> {
  const fileName = file.name.toLowerCase();
  const warnings: string[] = [];

  if (
    file.type === "text/html" ||
    fileName.endsWith(".html") ||
    fileName.endsWith(".htm")
  ) {
    return {
      document: await importFromHtml(file),
      warnings,
      source: "HTML",
    };
  }

  if (file.type === "application/pdf" || fileName.endsWith(".pdf")) {
    return {
      document: await importFromPdf(file),
      warnings,
      source: "PDF",
    };
  }

  if (file.type.startsWith("image/")) {
    warnings.push("Image OCR is best-effort and may need review.");
    return {
      document: await importFromImage(file),
      warnings,
      source: "Image",
    };
  }

  if (file.type === "text/plain" || fileName.endsWith(".txt")) {
    return {
      document: importFromPlainText(await file.text(), {
        sourceLabel: file.name,
        fileName: file.name,
      }),
      warnings,
      source: "Text",
    };
  }

  if (
    file.type ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    fileName.endsWith(".docx")
  ) {
    warnings.push("Word import is best-effort; review formatting after import.");
    return {
      document: await importFromDocx(file),
      warnings,
      source: "Word",
    };
  }

  if (file.type === "application/msword" || fileName.endsWith(".doc")) {
    warnings.push("Legacy .doc import is best-effort; review formatting after import.");
    return {
      document: await importFromLegacyDoc(file),
      warnings,
      source: "Word",
    };
  }

  if (
    file.type === "text/markdown" ||
    fileName.endsWith(".md") ||
    fileName.endsWith(".markdown")
  ) {
    return {
      document: await importFromMarkdown(file),
      warnings,
      source: "Markdown",
    };
  }

  throw new Error(
    "Unsupported file type. Import HTML, PDF, Markdown, Word, text, or image files."
  );
}
