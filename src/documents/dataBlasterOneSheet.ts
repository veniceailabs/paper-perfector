import type { Document } from "../models/DocumentSchema";

export const dataBlasterOneSheet: Document = {
  title: "Data Blaster",
  subtitle: "One-sheet product overview",
  metadata: {
    Product: "Data Blaster",
    Date: new Date().toISOString().split("T")[0],
    Version: "1.0",
    Audience: "Executives, operators, product leaders",
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
        "Data Blaster is a lightweight, desktop-ready web app that turns raw Excel exports into draft slide outlines, narrative, and diagram scaffolds.",
        "Built for complex companies and non-technical teams that need executive-ready storytelling fast.",
      ],
    },
    {
      id: "capabilities",
      level: 2,
      title: "Core Capabilities",
      body: [
        "- Ingest CSV, XLSX, or pasted rows with smart column mapping and data health checks.",
        "- Join sheets, roll up hierarchies, and manage glossary, lineage, and audit trail.",
        "- Prompt templates, guided setup, and plain-language questions for multi-output storytelling.",
        "- Auto-generate executive narrative, KPI cards, diagrams, and phrasing for slides.",
        "- Apply brand themes and tone to deliver board-ready exports (PPTX or scaffolds).",
      ],
    },
    {
      id: "workflow",
      level: 2,
      title: "Workflow",
      body: [
        "1. Upload, drop, or paste Excel/CSV data (or search the web for live figures).",
        "2. Map columns, choose deliverable/audience/focus, and craft your prompt.",
        "3. Review the outline, narrative, diagram, and metrics panels.",
        "4. Export PPTX or download the outline/diagram scaffolds for editing.",
      ],
    },
    {
      id: "governance",
      level: 2,
      title: "Governance & Trust",
      body: [
        "- Governance helpers surface PII (email, phone, SSN, credit card) counts and entries.",
        "- Roles (admin, editor, viewer) adjust editing/export rights while keeping an audit log.",
        "- Glossary entries and lineage tracking explain how joined or rolled-up data flows into insights.",
      ],
    },
    {
      id: "outputs",
      level: 2,
      title: "Outputs",
      body: [
        "- Slide outlines, executive answers, diagram scaffolds, KPI highlight cards, and PPTX export.",
        "- Exported content is a scaffold intended for easy editing and presentation polish.",
        "- Data source toggles let you default to web search until a spreadsheet is imported.",
      ],
    },
    {
      id: "notes",
      level: 2,
      title: "Notes",
      body: [
        "- Open `index.html` locally; no build step required for the static preview.",
        "- PPTX export loads a third-party library and may need network access.",
        "- The app log records lineage, PII detections, and user actions for governance needs.",
      ],
    },
  ],
};
