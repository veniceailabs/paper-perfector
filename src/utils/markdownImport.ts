import type { Document, Section } from "../models/DocumentSchema";
import { importFromPlainText } from "./plainTextImport";

type MarkdownImportOptions = {
  sourceLabel?: string;
  fileName?: string;
};

const headingLevelMap: Record<number, Section["level"]> = {
  1: 1,
  2: 1,
  3: 2,
  4: 3,
  5: 3,
  6: 3,
};

const headingRegex = /^(#{1,6})\s+(.*)$/;
const unorderedListRegex = /^[-*+]\s+(.+)$/;
const orderedListRegex = /^(\d+)\.\s+(.+)$/;
const dividerRegex = /^([-*_])\1\1+$/;
const metadataRegex = /^\*\*([^*]+)\*\*\s*:\s*(.+)$/;
const inlineMarkdownRegex =
  /(\*\*[^*]+\*\*|`[^`]+`|\*[^*]+\*|_[^_]+_|~~[^~]+~~|<u>[^<]+<\/u>|<s>[^<]+<\/s>|<del>[^<]+<\/del>)/;
const linkRegex = /\[[^\]]+\]\([^)]+\)/;

function looksLikeMarkdown(text: string) {
  const trimmed = text.trim();
  if (!trimmed) {
    return false;
  }

  if (/```/.test(trimmed) || inlineMarkdownRegex.test(trimmed) || linkRegex.test(trimmed)) {
    return true;
  }

  const lines = trimmed.split("\n");
  return lines.some((line) => {
    const lineTrimmed = line.trim();
    return (
      headingRegex.test(lineTrimmed) ||
      unorderedListRegex.test(lineTrimmed) ||
      orderedListRegex.test(lineTrimmed) ||
      dividerRegex.test(lineTrimmed) ||
      metadataRegex.test(lineTrimmed) ||
      /^>\s+/.test(lineTrimmed)
    );
  });
}

function normalizeLine(line: string) {
  return line.replace(/\s+$/, "");
}

function sanitizeMetadata(metadata: Record<string, string>) {
  Object.keys(metadata).forEach((key) => {
    if (!metadata[key]?.trim()) {
      delete metadata[key];
    }
  });
}

export function importFromMarkdownText(
  text: string,
  options: MarkdownImportOptions = {}
): Document {
  if (!looksLikeMarkdown(text)) {
    return importFromPlainText(text, {
      sourceLabel: options.sourceLabel,
      fileName: options.fileName,
    });
  }

  const lines = text.replace(/\r\n/g, "\n").split("\n").map(normalizeLine);
  const metadata: Record<string, string> = {};

  if (options.sourceLabel) {
    metadata.Source = options.sourceLabel;
  }

  let title =
    options.fileName?.replace(/\.[^.]+$/, "") ?? "Untitled Document";
  let titleSet = false;
  let subtitle: string | undefined;
  let frontMatter = true;
  let blankLineStreak = 0;

  const sections: Section[] = [];
  let currentSection: Section | null = null;
  let paragraphParts: string[] = [];
  let inCodeBlock = false;
  let codeLines: string[] = [];

  const ensureSection = () => {
    if (!currentSection) {
      currentSection = {
        id: `section-${sections.length + 1}`,
        level: 1,
        title: "Overview",
        body: [],
      };
    }
  };

  const pushSection = () => {
    if (currentSection) {
      sections.push(currentSection);
      currentSection = null;
    }
  };

  const flushParagraph = () => {
    if (paragraphParts.length === 0) {
      return;
    }
    const paragraph = paragraphParts.join("\n").trim();
    paragraphParts = [];
    if (!paragraph) {
      return;
    }
    ensureSection();
    currentSection?.body.push(paragraph);
  };

  const flushCodeBlock = () => {
    if (codeLines.length === 0) {
      return;
    }
    ensureSection();
    if (!currentSection) {
      return;
    }
    currentSection.monoBlocks = currentSection.monoBlocks ?? [];
    currentSection.monoBlocks.push(codeLines.join("\n"));
    codeLines = [];
  };

  lines.forEach((line) => {
    const trimmed = line.trim();

    if (trimmed.startsWith("```")) {
      if (inCodeBlock) {
        flushCodeBlock();
        inCodeBlock = false;
      } else {
        flushParagraph();
        inCodeBlock = true;
        codeLines = [];
        frontMatter = false;
      }
      blankLineStreak = 0;
      return;
    }

    if (inCodeBlock) {
      codeLines.push(line);
      return;
    }

    if (!trimmed) {
      if (paragraphParts.length > 0) {
        flushParagraph();
        blankLineStreak = 1;
        return;
      }

      blankLineStreak += 1;
      if (blankLineStreak >= 2 && (!frontMatter || currentSection)) {
        ensureSection();
        currentSection?.body.push("");
      }
      return;
    }

    blankLineStreak = 0;

    if (frontMatter) {
      const metaMatch = trimmed.match(metadataRegex);
      if (metaMatch) {
        metadata[metaMatch[1].trim()] = metaMatch[2].trim();
        return;
      }
    }

    const headingMatch = trimmed.match(headingRegex);
    if (headingMatch) {
      const level = headingMatch[1].length;
      const headingText = headingMatch[2].trim();

      if (level === 1 && !titleSet) {
        title = headingText;
        titleSet = true;
        return;
      }

      if (
        level === 2 &&
        titleSet &&
        !subtitle &&
        sections.length === 0 &&
        !currentSection &&
        frontMatter
      ) {
        subtitle = headingText;
        return;
      }

      flushParagraph();
      pushSection();
      currentSection = {
        id: `section-${sections.length + 1}`,
        level: headingLevelMap[level] ?? 1,
        title: headingText,
        body: [],
      };
      frontMatter = false;
      return;
    }

    if (dividerRegex.test(trimmed)) {
      flushParagraph();
      if (frontMatter && !currentSection) {
        return;
      }
      ensureSection();
      currentSection?.body.push("---");
      frontMatter = false;
      return;
    }

    const unorderedMatch = trimmed.match(unorderedListRegex);
    if (unorderedMatch) {
      flushParagraph();
      ensureSection();
      currentSection?.body.push(`- ${unorderedMatch[1].trim()}`);
      frontMatter = false;
      return;
    }

    const orderedMatch = trimmed.match(orderedListRegex);
    if (orderedMatch) {
      flushParagraph();
      ensureSection();
      currentSection?.body.push(`${orderedMatch[1]}. ${orderedMatch[2].trim()}`);
      frontMatter = false;
      return;
    }

    paragraphParts.push(trimmed);
    frontMatter = false;
  });

  flushParagraph();
  if (inCodeBlock) {
    flushCodeBlock();
  }
  pushSection();
  sanitizeMetadata(metadata);

  return {
    title,
    subtitle,
    metadata,
    sections,
  };
}

export async function importFromMarkdown(file: File): Promise<Document> {
  const text = await file.text();
  return importFromMarkdownText(text, {
    sourceLabel: file.name,
    fileName: file.name,
  });
}
