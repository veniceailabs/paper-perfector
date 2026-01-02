import type { Document } from "../models/DocumentSchema";
import { buildDocumentFromLines, type TextLine } from "./textLayout";

export async function importFromImage(file: File): Promise<Document> {
  const { default: Tesseract } = await import("tesseract.js");
  const result = await Tesseract.recognize(file, "eng");

  const lines: TextLine[] = result.data.lines.map((line) => {
    const height = line.bbox.y1 - line.bbox.y0;
    return {
      text: line.text,
      size: height,
      y: line.bbox.y0,
    };
  });

  return buildDocumentFromLines({
    lines,
    fileName: file.name,
    sourceLabel: "Image OCR",
  });
}
