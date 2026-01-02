import { Document } from "../models/DocumentSchema";
import { samplePaper } from "../documents/samplePaper";
import "../styles/StartScreen.css";

interface StartScreenProps {
  onSelectDocument: (doc: Document) => void;
  onImport: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

export function StartScreen({ onSelectDocument, onImport }: StartScreenProps) {
  const createBlankDocument = (): Document => {
    return {
      title: "Untitled Document",
      subtitle: "A new paper",
      metadata: {
        author: "Your Name",
        date: new Date().toISOString().split("T")[0],
        version: "1.0.0",
        classification: "Draft",
      },
      sections: [
        {
          id: "introduction",
          level: 1,
          title: "Introduction",
          body: [
            "Start writing your paper here. Replace this text with your own content.",
            "You can add multiple paragraphs, and they will be formatted automatically.",
          ],
          monoBlocks: [],
        },
        {
          id: "main-content",
          level: 2,
          title: "Main Content",
          body: [
            "Add your main content here. You can create sections and subsections using different heading levels.",
            "Each section can contain multiple paragraphs and code examples.",
          ],
          monoBlocks: [],
        },
        {
          id: "conclusion",
          level: 2,
          title: "Conclusion",
          body: [
            "Wrap up your paper with a conclusion section.",
            "Don't forget to export to PDF when you're done!",
          ],
          monoBlocks: [],
        },
      ],
    };
  };

  return (
    <div className="start-screen">
      <div className="start-container">
        <div className="start-header">
          <h1>Paper Perfector</h1>
          <p>Create and format professional documents</p>
        </div>

        <div className="start-grid">
          {/* New Document */}
          <div
            className="start-card start-card-new"
            onClick={() => onSelectDocument(createBlankDocument())}
          >
            <div className="card-icon">📝</div>
            <h3>New Document</h3>
            <p>Start with a blank canvas</p>
          </div>

          {/* Load Sample Example */}
          <div
            className="start-card start-card-example"
            onClick={() => onSelectDocument(samplePaper)}
          >
            <div className="card-icon">📚</div>
            <h3>Sample Paper</h3>
            <p>View a formatted example document</p>
          </div>

          {/* Import Document */}
          <label className="start-card start-card-import">
            <div className="card-icon">📤</div>
            <h3>Import Document</h3>
            <p>Load from HTML, PDF, or Markdown</p>
            <input
              type="file"
              accept="text/html,.html,.htm,application/pdf,.pdf,image/*,text/markdown,.md"
              onChange={onImport}
              style={{ display: "none" }}
            />
          </label>
        </div>

        <div className="start-footer">
          <p>💡 Tip: You can import markdown, HTML, or PDF files</p>
        </div>
      </div>
    </div>
  );
}
