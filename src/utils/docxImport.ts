import type { Document } from "../models/DocumentSchema";
import { importFromPlainText } from "./plainTextImport";

export async function importFromDocx(file: File): Promise<Document> {
  const mammoth = await import("mammoth/mammoth.browser");
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  const text = result.value ?? "";

  return importFromPlainText(text, {
    sourceLabel: file.name,
    fileName: file.name,
  });
}
