export type ScholarResult = {
  id: string;
  title: string;
  authors: string[];
  year?: number;
  venue?: string;
  url?: string;
  pdfUrl?: string;
  abstract?: string;
};
