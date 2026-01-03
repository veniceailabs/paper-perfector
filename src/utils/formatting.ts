import type { Document, DocumentFormat, FormatPreset } from "../models/DocumentSchema";

export const formatPresets: Record<FormatPreset, DocumentFormat> = {
  default: {
    preset: "default",
    fontFamily: "\"Google Sans\", system-ui, -apple-system, sans-serif",
    fontSize: "14.5px",
    lineHeight: 1.65,
  },
  apa: {
    preset: "apa",
    fontFamily: "\"Times New Roman\", Times, serif",
    fontSize: "12pt",
    lineHeight: 2,
  },
  mla: {
    preset: "mla",
    fontFamily: "\"Times New Roman\", Times, serif",
    fontSize: "12pt",
    lineHeight: 2,
  },
  chicago: {
    preset: "chicago",
    fontFamily: "\"Times New Roman\", Times, serif",
    fontSize: "12pt",
    lineHeight: 2,
  },
  custom: {
    preset: "custom",
    fontFamily: "\"Google Sans\", system-ui, -apple-system, sans-serif",
    fontSize: "14.5px",
    lineHeight: 1.65,
  },
};

export const fontOptions = [
  {
    label: "Google Sans",
    value: "\"Google Sans\", system-ui, -apple-system, sans-serif",
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

export const lineHeightOptions = [1, 1.15, 1.5, 2, 2.5];

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
