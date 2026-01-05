export type Section = {
  id: string;
  level: 1 | 2 | 3;
  title: string;
  body: string[];
  monoBlocks?: string[];
};

export type FormatPreset = "default" | "apa" | "mla" | "chicago" | "custom";

export type Source = {
  id: string;
  title: string;
  authors: string[];
  year?: number;
  venue?: string;
  doi?: string;
  volume?: string;
  issue?: string;
  pages?: string;
  publisher?: string;
  edition?: string;
  url?: string;
  pdfUrl?: string;
  accessed?: string;
};

export type DocumentFormat = {
  preset?: FormatPreset;
  fontFamily?: string;
  fontSize?: string;
  lineHeight?: number;
  pageMargin?: string;
  fontWeight?: number;
  paragraphSpacing?: number;
  headerText?: string;
  showHeader?: boolean;
  showPageNumbers?: boolean;
  renderMarkdown?: boolean;
};

export type Document = {
  title: string;
  subtitle?: string;
  metadata: Record<string, string>;
  sections: Section[];
  format?: DocumentFormat;
  sources?: Source[];
};
