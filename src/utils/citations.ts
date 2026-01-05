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

function formatDoi(doi?: string) {
  if (!doi) {
    return "";
  }
  const trimmed = doi.trim();
  if (!trimmed) {
    return "";
  }
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }
  if (trimmed.startsWith("doi.org/")) {
    return `https://${trimmed}`;
  }
  return `https://doi.org/${trimmed}`;
}

function formatLink(source: Source) {
  const doi = formatDoi(source.doi);
  if (doi) {
    return doi;
  }
  return source.url ?? source.pdfUrl ?? "";
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
    const names = authors.map(initials);
    if (names.length === 1) {
      return names[0];
    }
    if (names.length === 2) {
      return `${names[0]}, & ${names[1]}`;
    }
    return `${names.slice(0, -1).join(", ")}, & ${names[names.length - 1]}`;
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
    if (authors.length === 2) {
      return `${initials(authors[0])}, and ${initials(authors[1])}`;
    }
    return `${initials(authors[0])}, et al.`;
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
  const authorText = formatAuthorsReference(source.authors, style);
  const link = formatLink(source);
  const venue = source.venue ? `*${source.venue}*` : "";
  const volume = source.volume ? source.volume.trim() : "";
  const issue = source.issue ? source.issue.trim() : "";
  const pages = source.pages ? source.pages.trim() : "";
  const publisher = source.publisher ? source.publisher.trim() : "";
  const edition = source.edition ? source.edition.trim() : "";
  const accessed = source.accessed ? source.accessed.trim() : "";

  if (style === "mla") {
    const parts: string[] = [`${authorText}.`, `${title}.`];
    if (venue) {
      parts.push(`${venue},`);
    } else if (publisher) {
      parts.push(`${publisher},`);
    }
    if (edition) {
      parts.push(`${edition} ed.,`);
    }
    if (volume) {
      parts.push(`vol. ${volume},`);
    }
    if (issue) {
      parts.push(`no. ${issue},`);
    }
    if (year) {
      parts.push(`${year}.`);
    }
    if (pages) {
      parts.push(`pp. ${pages}.`);
    }
    if (link) {
      parts.push(`${link}.`);
    }
    if (accessed) {
      parts.push(`Accessed ${accessed}.`);
    }
    return parts.join(" ").replace(/\s+/g, " ").trim();
  }

  if (style === "chicago") {
    const parts: string[] = [`${authorText}.`, `${title}.`];
    if (venue) {
      let venueLine = venue;
      if (volume) {
        venueLine += ` ${volume}`;
      }
      if (issue) {
        venueLine += `, no. ${issue}`;
      }
      if (year) {
        venueLine += ` (${year})`;
      }
      if (pages) {
        venueLine += `: ${pages}`;
      }
      parts.push(`${venueLine}.`);
    } else if (publisher) {
      parts.push(`${publisher}, ${year}.`);
    } else if (year) {
      parts.push(`${year}.`);
    }
    if (link) {
      parts.push(`${link}.`);
    }
    return parts.join(" ").replace(/\s+/g, " ").trim();
  }

  const parts: string[] = [`${authorText} (${year}).`, `${title}.`];
  if (venue) {
    let venueLine = venue;
    if (volume) {
      venueLine += `, ${volume}`;
      if (issue) {
        venueLine += `(${issue})`;
      }
    }
    if (pages) {
      venueLine += `, ${pages}`;
    }
    parts.push(`${venueLine}.`);
  } else if (publisher) {
    parts.push(`${publisher}.`);
  }
  if (link) {
    parts.push(`${link}.`);
  }
  return parts.join(" ").replace(/\s+/g, " ").trim();
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
