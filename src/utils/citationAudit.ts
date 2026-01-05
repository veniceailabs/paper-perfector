import type { Document, DocumentFormat, Source } from "../models/DocumentSchema";
import { resolveFormat } from "./formatting";

const referenceSectionRegex = /references|bibliography|works cited/i;

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function lastName(name: string) {
  const parts = name.trim().split(/\s+/);
  return parts[parts.length - 1] ?? name;
}

function normalizeText(text: string) {
  return text.replace(/\s+/g, " ").trim();
}

function buildSearchText(doc: Document) {
  const parts: string[] = [];

  if (doc.title) {
    parts.push(doc.title);
  }
  if (doc.subtitle) {
    parts.push(doc.subtitle);
  }

  doc.sections
    .filter((section) => !referenceSectionRegex.test(section.title))
    .forEach((section) => {
      parts.push(section.title);
      section.body.forEach((paragraph) => {
        if (paragraph.trim()) {
          parts.push(paragraph);
        }
      });
      section.monoBlocks?.forEach((block) => {
        if (block.trim()) {
          parts.push(block);
        }
      });
    });

  return normalizeText(parts.join("\n")).toLowerCase();
}

function sourceReferenced(
  text: string,
  source: Source,
  format: DocumentFormat
) {
  const preset = format.preset ?? "default";
  const year = source.year ? String(source.year) : "";
  const authorLastNames = source.authors
    .map((author) => lastName(author))
    .filter(Boolean);

  if (authorLastNames.length === 0 && !source.title) {
    return false;
  }

  const nameMatches = authorLastNames.filter((name) =>
    new RegExp(`\\b${escapeRegExp(name.toLowerCase())}\\b`).test(text)
  );

  const hasName = nameMatches.length > 0;
  if (!hasName) {
    if (source.title) {
      const keyword = source.title
        .split(/\s+/)
        .find((word) => word.length > 4);
      if (keyword) {
        return new RegExp(`\\b${escapeRegExp(keyword.toLowerCase())}\\b`).test(text);
      }
    }
    return false;
  }

  if (!year || preset === "mla") {
    return true;
  }

  return nameMatches.some((name) => {
    const proximity = new RegExp(
      `\\b${escapeRegExp(name.toLowerCase())}\\b[^\\n]{0,80}\\b${escapeRegExp(
        year
      )}\\b|\\b${escapeRegExp(year)}\\b[^\\n]{0,80}\\b${escapeRegExp(
        name.toLowerCase()
      )}\\b`
    );
    return proximity.test(text);
  });
}

export function auditCitationCoverage(
  doc: Document,
  formatOverride?: DocumentFormat
) {
  const format = formatOverride ?? resolveFormat(doc);
  const sources = doc.sources ?? [];
  const searchText = buildSearchText(doc);
  const missingSources = sources.filter(
    (source) => !sourceReferenced(searchText, source, format)
  );

  return {
    totalSources: sources.length,
    missingSources,
    hasAnyCitation: sources.length > missingSources.length,
  };
}
