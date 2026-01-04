import type { Document } from "../models/DocumentSchema";

export const quickstartGuide: Document = {
  title: "Paper Perfector Quickstart",
  subtitle: "A fast, visual guide to writing, formatting, and exporting",
  metadata: {
    version: "1.0",
    date: new Date().toISOString().split("T")[0],
    audience: "New Users",
  },
  format: {
    preset: "default",
  },
  sections: [
    {
      id: "overview",
      level: 1,
      title: "Overview",
      body: [
        "Paper Perfector is a focused writing and export tool built for clean, defensible documents. This guide walks you through the core flow so you can ship a polished PDF fast.",
        "**Best flow:** Choose a template → Edit → Tune format → Export.",
      ],
    },
    {
      id: "start",
      level: 1,
      title: "Choose How You Want to Start",
      body: [
        "- **Blank Document** for full control.",
        "- **APA / MLA / Chicago** for academic structure.",
        "- **Paste Text** when you already have content (Markdown, HTML, or plain text).",
        "- **Import Document** for PDF, Word, or HTML files.",
      ],
    },
    {
      id: "paste-import",
      level: 1,
      title: "Paste & Import Like a Pro",
      body: [
        "Paste supports **Markdown**, **HTML**, and **plain text**. Links are preserved and will export into the PDF.",
        "You can also paste a public URL to an HTML page to import it.",
        "**Tip:** If a site blocks access, download the HTML and use Import Document.",
      ],
    },
    {
      id: "edit-modes",
      level: 1,
      title: "Edit Modes",
      body: [
        "**Structured Mode** keeps sections and metadata organized.",
        "**Freeform Mode** lets you edit raw Markdown, perfect for copy/paste workflows.",
        "Use the **Expand** button for a full-size editor when a paragraph needs more room.",
      ],
    },
    {
      id: "format",
      level: 1,
      title: "Formatting & Spacing",
      body: [
        "Open **Format** to adjust font, size, line spacing, margins, and paragraph spacing.",
        "APA/MLA/Chicago presets are included, but you can always customize.",
        "**Print Tip:** Use paragraph spacing and margins to tune the final PDF layout.",
      ],
    },
    {
      id: "tools",
      level: 1,
      title: "Research & Quality Tools",
      body: [
        "Use **Search** to find and replace text across your document.",
        "**Scholar Search** helps you find sources quickly without leaving the app.",
        "Use **Score** for an A+ readiness check before export.",
      ],
    },
    {
      id: "export",
      level: 1,
      title: "Share & Export",
      body: [
        "Export to PDF when ready, or share a live link.",
        "Email export will generate a PDF attachment for your message.",
        "**Mobile Preview** shows how the document looks on phones before you ship.",
      ],
    },
    {
      id: "shortcuts",
      level: 1,
      title: "Shortcuts",
      body: [
        "- **Cmd/Ctrl + S**: Save changes",
        "- **Cmd/Ctrl + B**: Bold",
        "- **Cmd/Ctrl + I**: Italic",
        "- **Cmd/Ctrl + U**: Underline",
        "- **Cmd/Ctrl + Shift + X**: Strikethrough",
      ],
    },
    {
      id: "finish",
      level: 1,
      title: "Final Checklist",
      body: [
        "✅ Title + metadata completed",
        "✅ Citations included",
        "✅ Spacing and margins dialed in",
        "✅ Export preview looks correct",
      ],
    },
  ],
};
