import type { Document } from "../models/DocumentSchema";
import { importFromHtml } from "./htmlImport";
import { importFromPdf } from "./pdfImport";
import { importFromImage } from "./imageImport";

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

  throw new Error("Unsupported file type. Import HTML, PDF, or image files.");
}
