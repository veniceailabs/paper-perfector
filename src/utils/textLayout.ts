import type { Document, Section } from "../models/DocumentSchema";

export type TextLine = {
  text: string;
  size: number;
  page?: number;
  y?: number;
};

const punctuationRegex = /[.!?:]$/;

function median(values: number[]) {
  if (values.length === 0) {
    return 0;
  }
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1] + sorted[mid]) / 2;
  }
  return sorted[mid];
}

function normalizeLineText(text: string) {
  return text.replace(/\s+/g, " ").trim();
}

function sortedLines(lines: TextLine[]) {
  return [...lines].sort((a, b) => {
    const pageDiff = (a.page ?? 0) - (b.page ?? 0);
    if (pageDiff !== 0) {
      return pageDiff;
    }
    const yDiff = (b.y ?? 0) - (a.y ?? 0);
    if (yDiff !== 0) {
      return yDiff;
    }
    return 0;
  });
}

function addParagraph(
  paragraphs: string[],
  nextLine: string,
  join: boolean,
  joiner: string = " "
) {
  if (!join || paragraphs.length === 0) {
    paragraphs.push(nextLine);
    return;
  }
  const lastIndex = paragraphs.length - 1;
  paragraphs[lastIndex] = `${paragraphs[lastIndex]}${joiner}${nextLine}`;
}

export function buildDocumentFromLines(options: {
  lines: TextLine[];
  fileName: string;
  sourceLabel: string;
  preserveLineBreaks?: boolean;
}) {
  const cleaned = sortedLines(options.lines)
    .map((line) => ({
      ...line,
      text: normalizeLineText(line.text),
    }))
    .filter((line) => line.text.length > 0);

  const sizes = cleaned.map((line) => line.size).filter((size) => size > 0);
  const medianSize = median(sizes) || 12;
  const headingThreshold = medianSize * 1.3;
  const titleThreshold = medianSize * 1.6;

  let title = options.fileName.replace(/\.[^.]+$/, "");
  const sections: Section[] = [];
  let currentSection: Section | null = null;
  let lastBodyLine: TextLine | null = null;

  const pushSection = () => {
    if (currentSection) {
      sections.push(currentSection);
      currentSection = null;
    }
  };

  cleaned.forEach((line, index) => {
    const isPotentialTitle =
      index === 0 && line.size >= titleThreshold && line.text.length > 0;

    if (isPotentialTitle) {
      title = line.text;
      return;
    }

    const isHeading = line.size >= headingThreshold;

    if (isHeading) {
      pushSection();
      currentSection = {
        id: `section-${sections.length + 1}`,
        level: 1,
        title: line.text,
        body: [],
      };
      lastBodyLine = null;
      return;
    }

    if (!currentSection) {
      currentSection = {
        id: `section-${sections.length + 1}`,
        level: 1,
        title: "Overview",
        body: [],
      };
    }

    if (
      options.preserveLineBreaks &&
      lastBodyLine?.y !== undefined &&
      line.y !== undefined &&
      (lastBodyLine.page ?? 0) === (line.page ?? 0)
    ) {
      const gap = lastBodyLine.y - line.y;
      if (gap > medianSize * 1.6) {
        currentSection.body.push("");
      }
    }

    const lastParagraph = currentSection.body[currentSection.body.length - 1] ?? "";
    const join =
      currentSection.body.length > 0 &&
      lastParagraph.trim().length > 0 &&
      !punctuationRegex.test(lastParagraph);

    addParagraph(
      currentSection.body,
      line.text,
      join,
      options.preserveLineBreaks ? "\n" : " "
    );
    lastBodyLine = line;
  });

  pushSection();

  return {
    title,
    metadata: {
      Source: options.sourceLabel,
      Imported: new Date().toISOString().slice(0, 10),
    },
    sections,
    format: {
      renderMarkdown: false,
    },
  } satisfies Document;
}
