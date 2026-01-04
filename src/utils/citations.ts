import type { FormatPreset, Source } from "../models/DocumentSchema";

function lastName(name: string) {
  const parts = name.trim().split(/\s+/);
  return parts[parts.length - 1] ?? name;
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0] ?? "";
  }
  const last = parts.pop();
  const init = parts.map((part) => `${part[0]?.toUpperCase() ?? ""}.`).join(" ");
  return `${last}, ${init}`.trim();
}

function formatAuthorsInline(authors: string[], style: FormatPreset) {
  if (authors.length === 0) {
    return "Unknown";
  }
  if (authors.length === 1) {
    return lastName(authors[0]);
  }
  if (authors.length === 2) {
    const [first, second] = authors;
    return style === "mla"
      ? `${lastName(first)} and ${lastName(second)}`
      : `${lastName(first)} & ${lastName(second)}`;
  }
  return `${lastName(authors[0])} et al.`;
}

function formatAuthorsReference(authors: string[], style: FormatPreset) {
  if (authors.length === 0) {
    return "Unknown";
  }
  if (style === "apa") {
    return authors.map(initials).join(", ");
  }
  if (style === "mla") {
    if (authors.length === 1) {
      return initials(authors[0]);
    }
    if (authors.length === 2) {
      return `${initials(authors[0])}, and ${initials(authors[1])}`;
    }
    return `${initials(authors[0])}, et al.`;
  }
  if (style === "chicago") {
    if (authors.length === 1) {
      return initials(authors[0]);
    }
    return `${initials(authors[0])}, and ${initials(authors[1])}`;
  }
  return authors.join(", ");
}

export function formatInTextCitation(source: Source, style: FormatPreset) {
  const year = source.year ?? "n.d.";
  const authorText = formatAuthorsInline(source.authors, style);
  if (style === "mla") {
    return `(${authorText})`;
  }
  if (style === "chicago") {
    return `(${authorText} ${year})`;
  }
  return `(${authorText}, ${year})`;
}

export function formatReference(source: Source, style: FormatPreset) {
  const year = source.year ?? "n.d.";
  const title = source.title ?? "Untitled";
  const venue = source.venue ? `${source.venue}.` : "";
  const url = source.url ?? source.pdfUrl ?? "";
  const authorText = formatAuthorsReference(source.authors, style);

  if (style === "mla") {
    return `${authorText}. ${title}. ${source.venue ?? ""}${
      source.venue ? "," : ""
    } ${year}. ${url}`.trim();
  }

  if (style === "chicago") {
    return `${authorText}. ${title}. ${venue} ${year}. ${url}`.trim();
  }

  return `${authorText} (${year}). ${title}. ${venue} ${url}`.trim();
}

export function formatReferenceTitle(style: FormatPreset) {
  if (style === "mla") {
    return "Works Cited";
  }
  if (style === "chicago") {
    return "Bibliography";
  }
  return "References";
}
