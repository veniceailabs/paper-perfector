import type { Document } from "../models/DocumentSchema";
import { importFromPlainText } from "./plainTextImport";

function scoreText(text: string) {
  const letters = text.match(/[A-Za-z0-9]/g)?.length ?? 0;
  return letters;
}

function sanitizeDocText(text: string) {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n");
}

function decodeDocBinary(buffer: ArrayBuffer) {
  const utf8 = new TextDecoder("utf-8", { fatal: false }).decode(buffer);
  const utf16 = new TextDecoder("utf-16le", { fatal: false }).decode(buffer);
  const utf8Score = scoreText(utf8);
  const utf16Score = scoreText(utf16);
  return utf16Score > utf8Score ? utf16 : utf8;
}

export async function importFromLegacyDoc(file: File): Promise<Document> {
  const buffer = await file.arrayBuffer();
  const decoded = decodeDocBinary(buffer);
  const cleaned = sanitizeDocText(decoded);

  if (!cleaned.trim()) {
    throw new Error("Could not read text from this .doc file.");
  }

  return importFromPlainText(cleaned, {
    sourceLabel: file.name,
    fileName: file.name,
  });
}
