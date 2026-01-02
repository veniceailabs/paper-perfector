import type { Document } from "../models/DocumentSchema";

const listItemRegex = /^[-*+]\s+.+/;
const orderedListRegex = /^\d+\.\s+.+/;

function isListItem(text: string) {
  return listItemRegex.test(text) || orderedListRegex.test(text);
}

function headingPrefix(level: number) {
  if (level <= 1) return "##";
  if (level === 2) return "###";
  return "####";
}

export function documentToMarkdown(doc: Document): string {
  const lines: string[] = [];

  lines.push(`# ${doc.title}`);

  if (doc.subtitle) {
    lines.push(`## ${doc.subtitle}`);
  }

  const metadataEntries = Object.entries(doc.metadata || {}).filter(
    ([, value]) => value && value.trim().length > 0
  );

  if (metadataEntries.length > 0) {
    lines.push("");
    metadataEntries.forEach(([key, value]) => {
      lines.push(`**${key}:** ${value}`);
    });
  }

  doc.sections.forEach((section) => {
    lines.push("");
    lines.push(`${headingPrefix(section.level)} ${section.title}`);
    lines.push("");

    section.body.forEach((paragraph, index) => {
      const trimmed = paragraph.trim();
      if (!trimmed) {
        return;
      }

      const currentIsList = isListItem(trimmed);
      const next = section.body[index + 1]?.trim() ?? "";
      const nextIsList = isListItem(next);

      lines.push(trimmed);

      if (!currentIsList || !nextIsList) {
        lines.push("");
      }
    });

    if (section.monoBlocks?.length) {
      section.monoBlocks.forEach((block) => {
        lines.push("```");
        lines.push(block);
        lines.push("```");
        lines.push("");
      });
    }
  });

  return lines.join("\n").trimEnd() + "\n";
}
