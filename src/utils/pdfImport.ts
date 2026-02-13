import type { Document } from "../models/DocumentSchema";
import { buildDocumentFromLines, type TextLine } from "./textLayout";

type PdfTextItem = {
  str: string;
  transform: number[];
  width?: number;
  height?: number;
};

type LineChunk = {
  text: string;
  x: number;
  endX: number;
};

const noLeadingSpace = /^[,.;:!?%)\]}]/;
const noTrailingSpace = /[(\[{]$/;

function mergeLineChunks(chunks: LineChunk[], fontSize: number) {
  if (chunks.length === 0) {
    return "";
  }
  const sorted = [...chunks].sort((a, b) => a.x - b.x);
  let merged = "";
  let lastEnd = sorted[0].x;

  sorted.forEach((chunk, index) => {
    const gap = chunk.x - lastEnd;
    const shouldAddSpace =
      index > 0 &&
      gap > Math.max(fontSize * 0.18, 0.8) &&
      !noLeadingSpace.test(chunk.text) &&
      !noTrailingSpace.test(merged);
    if (shouldAddSpace) {
      merged += " ";
    }
    merged += chunk.text;
    lastEnd = Math.max(lastEnd, chunk.endX);
  });

  return merged.replace(/\s+/g, " ").trim();
}

export async function importFromPdf(file: File): Promise<Document> {
  const [{ getDocument, GlobalWorkerOptions }, worker] = await Promise.all([
    import("pdfjs-dist/legacy/build/pdf"),
    import("pdfjs-dist/legacy/build/pdf.worker.min.mjs?url"),
  ]);

  GlobalWorkerOptions.workerSrc = worker.default;

  const data = await file.arrayBuffer();
  const loadingTask = getDocument({ data });
  const pdf = await loadingTask.promise;
  const lines: TextLine[] = [];

  for (let pageIndex = 1; pageIndex <= pdf.numPages; pageIndex += 1) {
    const page = await pdf.getPage(pageIndex);
    const textContent = await page.getTextContent();
    const items = textContent.items as PdfTextItem[];

    const lineMap = new Map<
      number,
      { y: number; size: number; chunks: LineChunk[] }
    >();
    const bucketSize = 2;

    items.forEach((item) => {
      const rawText = item.str?.replace(/\s+/g, " ").trim();
      if (!rawText) {
        return;
      }
      const y = item.transform[5];
      const x = item.transform[4];
      const size = Math.abs(item.height ?? item.transform[0]);
      const width = Math.abs(item.width ?? item.transform[0] ?? size);
      const bucket = Math.round(y / bucketSize);
      const entry = lineMap.get(bucket);
      if (!entry) {
        lineMap.set(bucket, {
          y,
          size,
          chunks: [{ text: rawText, x, endX: x + width }],
        });
        return;
      }
      entry.chunks.push({ text: rawText, x, endX: x + width });
      entry.size = Math.max(entry.size, size);
    });

    Array.from(lineMap.values())
      .sort((a, b) => b.y - a.y)
      .forEach((line) => {
        const text = mergeLineChunks(line.chunks, line.size || 12);
        if (text.length === 0) {
          return;
        }
        lines.push({
          text,
          size: line.size,
          y: line.y,
          page: pageIndex,
        });
      });
  }

  return buildDocumentFromLines({
    lines,
    fileName: file.name,
    sourceLabel: "PDF import",
    preserveLineBreaks: true,
  });
}
