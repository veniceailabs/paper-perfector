import type { Document } from "../models/DocumentSchema";
import { buildDocumentFromLines, type TextLine } from "./textLayout";

type PdfTextItem = {
  str: string;
  transform: number[];
  width?: number;
  height?: number;
};

type ColumnRange = {
  start: number;
  end: number;
};

export type PdfImportDebugItem = {
  text: string;
  x: number;
  y: number;
  width: number;
  size: number;
};

export type PdfImportDebugPage = {
  pageIndex: number;
  pageWidth: number;
  pageHeight: number;
  columns: ColumnRange[];
  items: PdfImportDebugItem[];
};

type PageItem = PdfImportDebugItem;

type PdfImportOptions = {
  collectDebug?: boolean;
};

let lastPdfImportDebugPages: PdfImportDebugPage[] = [];

export function getLastPdfImportDebugPages() {
  return lastPdfImportDebugPages;
}

const noLeadingSpace = /^[,.;:!?%)\]}]/;
const noTrailingSpace = /[(\[{]$/;

function mergeLineChunks(chunks: Array<{ text: string; x: number; endX: number }>, fontSize: number) {
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

function toPageItems(items: PdfTextItem[]) {
  const parsed: PageItem[] = [];
  items.forEach((item) => {
    const text = item.str?.replace(/\s+/g, " ").trim();
    if (!text) {
      return;
    }
    const x = item.transform[4];
    const y = item.transform[5];
    const size = Math.abs(item.height ?? item.transform[0]) || 10;
    const width = Math.max(
      1,
      Math.abs(item.width ?? item.transform[0] ?? size)
    );
    parsed.push({ text, x, y, width, size });
  });
  return parsed;
}

export function detectColumns(items: PageItem[], pageWidth: number): ColumnRange[] {
  if (items.length < 30) {
    return [{ start: 0, end: pageWidth }];
  }

  const candidates = items.filter(
    (item) => item.width < pageWidth * 0.65 && item.text.length > 2
  );
  if (candidates.length < 24) {
    return [{ start: 0, end: pageWidth }];
  }

  const bucketSize = 12;
  const xHistogram = new Map<number, number>();
  candidates.forEach((item) => {
    const bucket = Math.round(item.x / bucketSize) * bucketSize;
    xHistogram.set(bucket, (xHistogram.get(bucket) ?? 0) + 1);
  });

  const peakThreshold = Math.max(4, Math.floor(candidates.length * 0.08));
  const significantBuckets = Array.from(xHistogram.entries())
    .filter(([, count]) => count >= peakThreshold)
    .map(([x]) => x)
    .sort((a, b) => a - b);

  if (significantBuckets.length < 2) {
    return [{ start: 0, end: pageWidth }];
  }

  const mergedStarts: number[] = [];
  significantBuckets.forEach((bucket) => {
    const last = mergedStarts[mergedStarts.length - 1];
    if (last === undefined || Math.abs(bucket - last) > bucketSize * 2) {
      mergedStarts.push(bucket);
      return;
    }
    mergedStarts[mergedStarts.length - 1] = Math.round((last + bucket) / 2);
  });

  if (mergedStarts.length < 2) {
    return [{ start: 0, end: pageWidth }];
  }

  const rawColumns = mergedStarts.map((start, index) => {
    const previous = mergedStarts[index - 1];
    const next = mergedStarts[index + 1];
    const colStart = previous === undefined ? 0 : (previous + start) / 2;
    const colEnd = next === undefined ? pageWidth : (start + next) / 2;
    return {
      start: Math.max(0, colStart),
      end: Math.min(pageWidth, colEnd),
    };
  });

  const minColumnCoverage = Math.max(6, Math.floor(candidates.length * 0.12));
  const coveredColumns = rawColumns.filter((column) => {
    const coverage = candidates.filter((item) => {
      const center = item.x + item.width / 2;
      return center >= column.start && center <= column.end;
    }).length;
    return coverage >= minColumnCoverage;
  });

  if (coveredColumns.length < 2) {
    return [{ start: 0, end: pageWidth }];
  }

  return coveredColumns;
}

function findColumnIndex(item: PageItem, columns: ColumnRange[]) {
  const center = item.x + item.width / 2;
  let index = columns.findIndex(
    (column) => center >= column.start - 14 && center <= column.end + 14
  );
  if (index >= 0) {
    return index;
  }

  let bestDistance = Number.POSITIVE_INFINITY;
  let bestIndex = 0;
  columns.forEach((column, columnIndex) => {
    const columnCenter = (column.start + column.end) / 2;
    const distance = Math.abs(center - columnCenter);
    if (distance < bestDistance) {
      bestDistance = distance;
      bestIndex = columnIndex;
    }
  });
  return bestIndex;
}

export function reconstructPageLines(
  pageItems: PageItem[],
  pageWidth: number,
  pageIndex: number,
  columnsInput?: ColumnRange[]
): TextLine[] {
  if (pageItems.length === 0) {
    return [];
  }

  const columns = columnsInput ?? detectColumns(pageItems, pageWidth);
  const baseItems = pageItems.filter((item) => item.width <= pageWidth * 0.62);
  const topY = baseItems.length
    ? Math.max(...baseItems.map((item) => item.y))
    : Math.max(...pageItems.map((item) => item.y));
  const bottomY = baseItems.length
    ? Math.min(...baseItems.map((item) => item.y))
    : Math.min(...pageItems.map((item) => item.y));

  const lineMaps = new Map<
    string,
    {
      segment: number;
      y: number;
      size: number;
      chunks: Array<{ text: string; x: number; endX: number }>;
    }
  >();
  const bucketSize = 2;

  pageItems.forEach((item) => {
    let segment = 1;
    if (item.width > pageWidth * 0.62) {
      if (item.y >= topY - 18) {
        segment = 0;
      } else if (item.y <= bottomY + 18) {
        segment = columns.length + 1;
      }
    } else {
      segment = findColumnIndex(item, columns) + 1;
    }

    const yBucket = Math.round(item.y / bucketSize);
    const key = `${segment}:${yBucket}`;
    const entry = lineMaps.get(key);
    if (!entry) {
      lineMaps.set(key, {
        segment,
        y: item.y,
        size: item.size,
        chunks: [{ text: item.text, x: item.x, endX: item.x + item.width }],
      });
      return;
    }
    entry.y = Math.max(entry.y, item.y);
    entry.size = Math.max(entry.size, item.size);
    entry.chunks.push({ text: item.text, x: item.x, endX: item.x + item.width });
  });

  const ordered = Array.from(lineMaps.values()).sort((a, b) => {
    if (a.segment !== b.segment) {
      return a.segment - b.segment;
    }
    return b.y - a.y;
  });

  return ordered
    .map((line) => {
      const text = mergeLineChunks(line.chunks, line.size || 12);
      if (!text) {
        return null;
      }
      return {
        text,
        size: line.size,
        y: line.y,
        // Segment the virtual page to preserve column reading order.
        page: pageIndex * 10 + line.segment,
      } satisfies TextLine;
    })
    .filter((line): line is TextLine => Boolean(line));
}

export async function importFromPdf(
  file: File,
  options?: PdfImportOptions
): Promise<Document> {
  const [{ getDocument, GlobalWorkerOptions }, worker] = await Promise.all([
    import("pdfjs-dist/legacy/build/pdf"),
    import("pdfjs-dist/legacy/build/pdf.worker.min.mjs?url"),
  ]);

  GlobalWorkerOptions.workerSrc = worker.default;

  const data = await file.arrayBuffer();
  const loadingTask = getDocument({ data });
  const pdf = await loadingTask.promise;
  const lines: TextLine[] = [];
  const debugPages: PdfImportDebugPage[] = [];

  for (let pageIndex = 1; pageIndex <= pdf.numPages; pageIndex += 1) {
    const page = await pdf.getPage(pageIndex);
    const textContent = await page.getTextContent();
    const viewport = page.getViewport({ scale: 1 });
    const items = toPageItems(textContent.items as PdfTextItem[]);
    const columns = detectColumns(items, viewport.width);
    lines.push(...reconstructPageLines(items, viewport.width, pageIndex, columns));
    if (options?.collectDebug) {
      debugPages.push({
        pageIndex,
        pageWidth: viewport.width,
        pageHeight: viewport.height,
        columns,
        items,
      });
    }
  }

  lastPdfImportDebugPages = options?.collectDebug ? debugPages : [];

  return buildDocumentFromLines({
    lines,
    fileName: file.name,
    sourceLabel: "PDF import",
    preserveLineBreaks: true,
  });
}
