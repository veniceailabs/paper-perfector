import type { Document } from "../models/DocumentSchema";

export type DocumentStats = {
  words: number;
  characters: number;
  pages: number;
  readMinutes: number;
};

const WORDS_PER_MINUTE = 200;
const DOUBLE_SPACED_WORDS_PER_PAGE = 250;
const SINGLE_SPACED_WORDS_PER_PAGE = 400;

export function calculateDocumentStats(
  doc: Document,
  lineHeight: number = 1.5
): DocumentStats {
  const parts: string[] = [];

  if (doc.title) {
    parts.push(doc.title);
  }
  if (doc.subtitle) {
    parts.push(doc.subtitle);
  }

  Object.values(doc.metadata ?? {}).forEach((value) => {
    if (value) {
      parts.push(value);
    }
  });

  doc.sections.forEach((section) => {
    parts.push(section.title);
    section.body.forEach((paragraph) => {
      parts.push(paragraph);
    });
    section.monoBlocks?.forEach((block) => {
      parts.push(block);
    });
  });

  const text = parts.join(" ").trim();
  const words = text ? text.split(/\s+/).filter(Boolean).length : 0;
  const characters = text.length;
  const wordsPerPage =
    lineHeight >= 1.8 ? DOUBLE_SPACED_WORDS_PER_PAGE : SINGLE_SPACED_WORDS_PER_PAGE;
  const pages = Math.max(1, Math.ceil(words / wordsPerPage));
  const readMinutes = Math.max(1, Math.ceil(words / WORDS_PER_MINUTE));

  return {
    words,
    characters,
    pages,
    readMinutes,
  };
}
