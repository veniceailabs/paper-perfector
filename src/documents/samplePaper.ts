import type { Document } from "../models/DocumentSchema";

export const samplePaper: Document = {
  title: "Sample Research Paper",
  subtitle: "An example document created with Paper Perfector",
  metadata: {
    author: "Your Name",
    date: "2026-01-01",
    version: "1.0.0",
    classification: "Example",
  },
  sections: [
    {
      id: "introduction",
      level: 1,
      title: "Introduction",
      body: [
        "This is a sample document demonstrating the capabilities of Paper Perfector. Replace this content with your own research, findings, or technical documentation.",
        "Paper Perfector is a professional document creation tool that enables you to format, structure, and export beautiful papers with ease.",
      ],
      monoBlocks: [],
    },
    {
      id: "getting-started",
      level: 2,
      title: "Getting Started",
      body: [
        "Paper Perfector allows you to create beautifully formatted documents with support for markdown, code blocks, and professional typography.",
        "You can organize content using multiple heading levels and create well-structured papers that are ready for printing or digital distribution.",
      ],
      monoBlocks: [],
    },
    {
      id: "features",
      level: 2,
      title: "Features",
      body: [
        "The tool supports multiple powerful features:",
        "• Markdown formatting for bold, italic, and other text styling",
        "• Code syntax highlighting for technical documentation",
        "• Automatic document hashing for integrity verification",
        "• PDF export with professional styling and formatting",
        "• Dark and light theme support",
        "• Responsive design for different screen sizes",
      ],
      monoBlocks: [],
    },
    {
      id: "code-examples",
      level: 3,
      title: "Code Examples",
      body: [
        "You can include code blocks that are syntax-highlighted and properly formatted for printing and digital sharing.",
      ],
      monoBlocks: [
        `// Example TypeScript code
export interface Document {
  title: string;
  subtitle?: string;
  metadata: Record<string, string>;
  sections: Section[];
}

// Define your document structure
const myDocument: Document = {
  title: "My Paper",
  subtitle: "A work in progress",
  metadata: {
    author: "Jane Doe",
    date: "2026-01-01",
    version: "1.0.0",
  },
  sections: [],
};`,
      ],
    },
    {
      id: "workflow",
      level: 2,
      title: "Workflow",
      body: [
        "The typical workflow with Paper Perfector is straightforward:",
        "1. Create a new document or import existing content from HTML, PDF, or Markdown",
        "2. Edit and format your content using the rich text editor",
        "3. Organize sections and subsections logically",
        "4. Export to PDF for sharing or printing",
      ],
      monoBlocks: [],
    },
    {
      id: "next-steps",
      level: 1,
      title: "Getting Your Own Documents Started",
      body: [
        "To get started with your own document:",
        "1. Click the home button (⌂) in the toolbar to return to the start screen",
        "2. Choose 'New Document' to begin with a blank canvas",
        "3. Or import existing content from HTML, PDF, or Markdown files",
        "4. Once complete, export your document as a professional PDF",
      ],
      monoBlocks: [],
    },
  ],
};
