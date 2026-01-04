import type { Document, DocumentFormat, FormatPreset } from "../models/DocumentSchema";

export const formatPresets: Record<FormatPreset, DocumentFormat> = {
  default: {
    preset: "default",
    fontFamily: "\"Google Sans\", system-ui, -apple-system, sans-serif",
    fontSize: "14.5px",
    lineHeight: 1.65,
    pageMargin: "24mm",
    fontWeight: 400,
    paragraphSpacing: 12,
    showHeader: false,
    showPageNumbers: false,
    renderMarkdown: true,
  },
  apa: {
    preset: "apa",
    fontFamily: "\"Times New Roman\", Times, serif",
    fontSize: "12pt",
    lineHeight: 2,
    pageMargin: "1in",
    fontWeight: 400,
    paragraphSpacing: 12,
    showHeader: true,
    showPageNumbers: true,
    renderMarkdown: true,
  },
  mla: {
    preset: "mla",
    fontFamily: "\"Times New Roman\", Times, serif",
    fontSize: "12pt",
    lineHeight: 2,
    pageMargin: "1in",
    fontWeight: 400,
    paragraphSpacing: 12,
    showHeader: true,
    showPageNumbers: true,
    renderMarkdown: true,
  },
  chicago: {
    preset: "chicago",
    fontFamily: "\"Times New Roman\", Times, serif",
    fontSize: "12pt",
    lineHeight: 2,
    pageMargin: "1in",
    fontWeight: 400,
    paragraphSpacing: 12,
    showHeader: true,
    showPageNumbers: true,
    renderMarkdown: true,
  },
  custom: {
    preset: "custom",
    fontFamily: "\"Google Sans\", system-ui, -apple-system, sans-serif",
    fontSize: "14.5px",
    lineHeight: 1.65,
    pageMargin: "24mm",
    fontWeight: 400,
    paragraphSpacing: 12,
    showHeader: false,
    showPageNumbers: false,
    renderMarkdown: true,
  },
};

export const fontOptions = [
  {
    label: "Google Sans",
    value: "\"Google Sans\", system-ui, -apple-system, sans-serif",
  },
  {
    label: "Helvetica Neue",
    value: "\"Helvetica Neue\", Helvetica, Arial, sans-serif",
  },
  {
    label: "Helvetica",
    value: "Helvetica, Arial, sans-serif",
  },
  {
    label: "Times New Roman",
    value: "\"Times New Roman\", Times, serif",
  },
  {
    label: "Georgia",
    value: "Georgia, serif",
  },
  {
    label: "Arial",
    value: "Arial, Helvetica, sans-serif",
  },
];

export const fontWeightOptions = [
  { label: "Thin", value: 300 },
  { label: "Regular", value: 400 },
  { label: "Medium", value: 500 },
  { label: "Semibold", value: 600 },
  { label: "Bold", value: 700 },
];

export const lineHeightOptions = [1, 1.15, 1.5, 2, 2.5];

const FORMAT_DEFAULTS_KEY = "paper-perfector-format-defaults";

export function loadSavedFormatDefaults(): DocumentFormat | null {
  try {
    const raw = localStorage.getItem(FORMAT_DEFAULTS_KEY);
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw) as DocumentFormat;
    if (!parsed || typeof parsed !== "object") {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function saveFormatDefaults(format: DocumentFormat) {
  try {
    const normalized: DocumentFormat = {
      ...format,
      preset: format.preset ?? "default",
    };
    localStorage.setItem(FORMAT_DEFAULTS_KEY, JSON.stringify(normalized));
  } catch {
    // Ignore storage failures.
  }
}

export function parseFontSize(value: string | undefined, fallback: string) {
  const target = value ?? fallback;
  const match = target.match(/^(\d+(?:\.\d+)?)(pt|px)$/);
  if (!match) {
    return { size: 12, unit: "pt" as const };
  }
  return {
    size: Number(match[1]),
    unit: match[2] as "pt" | "px",
  };
}

export function formatFontSize(size: number, unit: "pt" | "px") {
  return `${size}${unit}`;
}

export function parsePageMargin(value: string | undefined, fallback: string) {
  const target = value ?? fallback;
  const match = target.match(/^(\d+(?:\.\d+)?)(mm|in)$/);
  if (!match) {
    return { size: 24, unit: "mm" as const };
  }
  return {
    size: Number(match[1]),
    unit: match[2] as "mm" | "in",
  };
}

export function formatPageMargin(size: number, unit: "mm" | "in") {
  return `${size}${unit}`;
}

function inferPresetFromDoc(doc: Document): FormatPreset {
  if (doc.format?.preset) {
    return doc.format.preset;
  }

  const classification = (doc.metadata?.classification ?? "").toLowerCase();
  const title = doc.title.toLowerCase();

  if (classification.includes("apa") || title.includes("apa")) {
    return "apa";
  }
  if (classification.includes("mla") || title.includes("mla")) {
    return "mla";
  }
  if (classification.includes("chicago") || title.includes("chicago")) {
    return "chicago";
  }

  return "default";
}

export function resolveFormat(doc: Document): DocumentFormat {
  const preset = inferPresetFromDoc(doc);
  const defaults = formatPresets[preset] ?? formatPresets.default;
  return {
    ...defaults,
    ...(doc.format ?? {}),
    preset,
  };
}
