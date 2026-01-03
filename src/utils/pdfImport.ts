import type { Document } from "../models/DocumentSchema";
import { buildDocumentFromLines, type TextLine } from "./textLayout";

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
    const items = textContent.items as Array<{
      str: string;
      transform: number[];
      height?: number;
    }>;

    const lineMap = new Map<number, { y: number; size: number; parts: string[] }>();
    const bucketSize = 2;

    items.forEach((item) => {
      const y = item.transform[5];
      const size = Math.abs(item.height ?? item.transform[0]);
      const bucket = Math.round(y / bucketSize);
      const entry = lineMap.get(bucket);
      if (!entry) {
        lineMap.set(bucket, {
          y,
          size,
          parts: [item.str],
        });
        return;
      }
      entry.parts.push(item.str);
      entry.size = Math.max(entry.size, size);
    });

    Array.from(lineMap.values())
      .sort((a, b) => b.y - a.y)
      .forEach((line) => {
        const text = line.parts.join(" ").replace(/\s+/g, " ").trim();
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
