import type { Document } from "../models/DocumentSchema";

export const paperPerfectorOneSheet: Document = {
  title: "Paper Perfector",
  subtitle: "One-sheet product overview",
  metadata: {
    Product: "Paper Perfector",
    Date: new Date().toISOString().split("T")[0],
    Version: "1.0",
    Audience: "Students, researchers, professionals",
    Classification: "Product overview",
  },
  format: {
    preset: "default",
    renderMarkdown: true,
  },
  sections: [
    {
      id: "overview",
      level: 1,
      title: "Overview",
      body: [
        "Paper Perfector is a modern document editor that focuses on beautiful, structured papers with instant PDF export.",
        "You draft content; the app applies professional typography, themes, and layout so every paper looks publication-ready.",
      ],
    },
    {
      id: "features",
      level: 2,
      title: "Key Features",
      body: [
        "- Stunning typography powered by Google Sans and Roboto Mono.",
        "- Document templates (APA, MLA, Chicago) plus blank or sample papers.",
        "- Support for Markdown, HTML, PDF, and plaintext imports, including OCR extraction.",
        "- Built-in research tools: Scholar search, citations, and document scoring.",
        "- Theme-aware editor with dark/light modes, focus assist, and Share/Export modals.",
      ],
    },
    {
      id: "workflow",
      level: 2,
      title: "Workflow",
      body: [
        "1. Start from blank, template, or import existing content (Markdown/HTML/PDF).",
        "2. Organize sections, insert code blocks, citations, and metadata.",
        "3. Format via customizable controls (fonts, margins, spacing, headers).",
        "4. Export as a clean PDF or share a live document link with integrity hashing.",
      ],
    },
    {
      id: "outputs",
      level: 2,
      title: "Outputs & Governance",
      body: [
        "- Professional PDFs with perfect typography, headers, and references.",
        "- Document integrity ensured via automatic hashing.",
        "- Share modal for links, and export checklist for quality assurance.",
        "- Citations, references, and optional Scholar search built-in for academic rigor.",
      ],
    },
    {
      id: "notes",
      level: 2,
      title: "Notes",
      body: [
        "- Built with React, Vite, TypeScript, and PDF.js in the browser – no AI content generation.",
        "- Offline-friendly with local hashing; export and import flows work without server round trips.",
        "- Sample papers and quickstart guide keep new users productive instantly.",
      ],
    },
  ],
};
