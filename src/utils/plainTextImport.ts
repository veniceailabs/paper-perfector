import type { Document, Section } from "../models/DocumentSchema";

type PlainTextImportOptions = {
  sourceLabel?: string;
  fileName?: string;
};

function deriveTitle(lines: string[], fileName?: string) {
  const fallback = fileName?.replace(/\.[^.]+$/, "") ?? "Untitled Document";
  const firstNonEmptyIndex = lines.findIndex((line) => line.trim().length > 0);

  if (firstNonEmptyIndex === -1) {
    return { title: fallback, startIndex: 0 };
  }

  const firstLine = lines[firstNonEmptyIndex].trim();
  const nextLine = lines[firstNonEmptyIndex + 1] ?? "";

  if (firstLine.length <= 80 && nextLine.trim().length === 0) {
    return { title: firstLine, startIndex: firstNonEmptyIndex + 1 };
  }

  return { title: fallback, startIndex: firstNonEmptyIndex };
}

export function importFromPlainText(
  text: string,
  options: PlainTextImportOptions = {}
): Document {
  const lines = text.replace(/\r\n/g, "\n").split("\n");
  const { title, startIndex } = deriveTitle(lines, options.fileName);
  const metadata: Record<string, string> = {};

  if (options.sourceLabel) {
    metadata.Source = options.sourceLabel;
  }

  const body: string[] = [];
  let paragraphBuffer: string[] = [];
  let blankStreak = 0;

  for (let i = startIndex; i < lines.length; i += 1) {
    const rawLine = lines[i] ?? "";
    const line = rawLine.replace(/\s+$/, "");

    if (line.trim().length === 0) {
      if (paragraphBuffer.length > 0) {
        body.push(paragraphBuffer.join("\n"));
        paragraphBuffer = [];
        blankStreak = 1;
        continue;
      }

      blankStreak += 1;
      if (blankStreak > 1) {
        body.push("");
      }
      continue;
    }

    blankStreak = 0;
    paragraphBuffer.push(line);
  }

  if (paragraphBuffer.length > 0) {
    body.push(paragraphBuffer.join("\n"));
  }

  const sections: Section[] = [
    {
      id: "section-1",
      level: 1,
      title: "Overview",
      body,
    },
  ];

  return {
    title,
    metadata,
    sections,
  };
}
