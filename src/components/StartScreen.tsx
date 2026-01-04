import { useRef, useState } from "react";
import { Document } from "../models/DocumentSchema";
import { samplePaper } from "../documents/samplePaper";
import { templates } from "../documents/templates";
import { quickstartGuide } from "../documents/quickstartGuide";
import { importFromMarkdownText } from "../utils/markdownImport";
import { importFromHtmlText } from "../utils/htmlImport";
import "../styles/StartScreen.css";

interface StartScreenProps {
  onSelectDocument: (doc: Document) => void;
  onImport: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onThemeChange: (theme: "light" | "dark") => void;
}

export function StartScreen({
  onSelectDocument,
  onImport,
  onThemeChange,
}: StartScreenProps) {
  const [showPasteModal, setShowPasteModal] = useState(false);
  const [showThemeModal, setShowThemeModal] = useState(false);
  const [markdownText, setMarkdownText] = useState("");
  const [markdownError, setMarkdownError] = useState<string | null>(null);
  const [pendingDoc, setPendingDoc] = useState<Document | null>(null);
  const [assistantOpen, setAssistantOpen] = useState(false);
  const importInputRef = useRef<HTMLInputElement>(null);

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
      format: {
        preset: "default",
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

  const openPasteModal = () => {
    setMarkdownText("");
    setMarkdownError(null);
    setShowPasteModal(true);
  };

  const openImportPicker = () => {
    importInputRef.current?.click();
  };

  const handleSelectFromAssistant = (doc: Document) => {
    setAssistantOpen(false);
    onSelectDocument(doc);
  };

  const handlePasteContinue = async () => {
    if (!markdownText.trim()) {
      setMarkdownError("Paste your markdown, HTML, or text to continue.");
      return;
    }

    const trimmed = markdownText.trim();
    const isSingleUrl = /^(\S+)$/.test(trimmed);
    const urlMatch = isSingleUrl
      ? trimmed.match(/^(https?:\/\/\S+|file:\/\/\S+)$/i)
      : null;
    const looksLikeHtml = /<(html|body|head|h1|h2|h3|h4|p|div|section|article|ul|ol|li|table|a)\b/i.test(
      trimmed
    );

    try {
      if (urlMatch) {
        const url = urlMatch[1];
        if (url.toLowerCase().startsWith("file://")) {
          setMarkdownError(
            "Local file links can’t be opened in the browser. Please use Import Document to select the HTML file."
          );
          openImportPicker();
          return;
        }

        try {
          const response = await fetch(url);
          if (!response.ok) {
            throw new Error("Unable to load that link.");
          }
          const contentType = response.headers.get("content-type") ?? "";
          const payload = await response.text();
          const filename = url.split("/").pop() ?? "linked-document.html";

          const payloadLooksLikeHtml =
            /<(html|body|head|h1|h2|h3|h4|p|div|section|article|ul|ol|li|table|a)\b/i.test(
              payload
            );
          const doc =
            contentType.includes("text/html") || payloadLooksLikeHtml
              ? importFromHtmlText(payload, {
                  sourceLabel: url,
                  fileName: filename,
                })
              : importFromMarkdownText(payload, {
                  sourceLabel: url,
                  fileName: filename,
                });
          setPendingDoc(doc);
          setShowPasteModal(false);
          setShowThemeModal(true);
          setMarkdownError(null);
          return;
        } catch (error) {
          setMarkdownError(
            error instanceof Error
              ? `${error.message} Download the HTML and use Import Document if the site blocks access.`
              : "Unable to load that link. Download the HTML and import it instead."
          );
          return;
        }
      }

      const doc = looksLikeHtml
        ? importFromHtmlText(trimmed, { sourceLabel: "Pasted HTML" })
        : importFromMarkdownText(trimmed);
      setPendingDoc(doc);
      setShowPasteModal(false);
      setShowThemeModal(true);
      setMarkdownError(null);
    } catch (error) {
      setMarkdownError(
        error instanceof Error ? error.message : "Failed to parse content."
      );
    }
  };

  const handleThemeSelect = (theme: "light" | "dark") => {
    if (!pendingDoc) {
      return;
    }
    onThemeChange(theme);
    onSelectDocument(pendingDoc);
    setPendingDoc(null);
    setShowThemeModal(false);
  };

  return (
    <div className="start-screen">
      <div className="start-container">
        <div className="start-header">
          <h1>Paper Perfector</h1>
          <p>Create and format professional documents</p>
        </div>

        <div className="start-section">
          <div className="start-section-header">
            <div className="start-section-title">
              <h2>Academic &amp; Structured</h2>
              <span className="start-section-tag">Templates</span>
            </div>
          </div>
          <div className="start-grid start-grid-templates">
            {/* APA Template */}
            <div
              className="start-card start-card-example"
              onClick={() => onSelectDocument(templates.apa)}
            >
              <div className="card-icon">📑</div>
              <h3>APA Format</h3>
              <p>7th Edition template</p>
            </div>

            {/* MLA Template */}
            <div
              className="start-card start-card-example"
              onClick={() => onSelectDocument(templates.mla)}
            >
              <div className="card-icon">📄</div>
              <h3>MLA Format</h3>
              <p>9th Edition template</p>
            </div>

            {/* Chicago Template */}
            <div
              className="start-card start-card-example"
              onClick={() => onSelectDocument(templates.chicago)}
            >
              <div className="card-icon">📋</div>
              <h3>Chicago Style</h3>
              <p>17th Edition template</p>
            </div>
          </div>
        </div>

        <div className="start-section">
          <div className="start-section-header">
            <div className="start-section-title">
              <h2>Bring Your Own Content</h2>
            </div>
          </div>
          <div className="start-grid start-grid-content">
            {/* New Document */}
            <div
              className="start-card start-card-new"
              onClick={() => onSelectDocument(createBlankDocument())}
            >
              <div className="card-icon">📝</div>
              <h3>Blank Document</h3>
              <p>Start from scratch</p>
            </div>

            {/* Sample Example */}
            <div
              className="start-card start-card-example"
              onClick={() => onSelectDocument(samplePaper)}
            >
              <div className="card-icon">📚</div>
              <h3>Sample Paper</h3>
              <p>View a formatted example</p>
            </div>

            {/* Paste Text */}
            <div
              className="start-card start-card-paste"
              onClick={openPasteModal}
            >
              <div className="card-icon">🧾</div>
              <h3>Paste Text</h3>
              <p>Paste markdown, HTML, or a link</p>
            </div>

            {/* Import Document */}
            <label className="start-card start-card-import">
              <div className="card-icon">📤</div>
              <h3>Import Document</h3>
              <p>Load from HTML, PDF, Word, or Markdown</p>
            <input
              ref={importInputRef}
              type="file"
              accept="text/html,.html,.htm,application/pdf,.pdf,image/*,text/markdown,.md,text/plain,.txt,application/vnd.openxmlformats-officedocument.wordprocessingml.document,.docx,.doc"
              onChange={onImport}
              style={{ display: "none" }}
            />
            </label>
          </div>
        </div>

        <div className="start-footer">
          <p>💡 Tip: You can import markdown, HTML, PDF, Word, or text files</p>
          <button
            className="start-guide-link"
            type="button"
            onClick={() => onSelectDocument(quickstartGuide)}
          >
            New here? Open the Quickstart Guide (export to PDF when ready)
          </button>
        </div>
      </div>

      {showPasteModal ? (
        <div className="start-modal-backdrop" role="dialog" aria-modal="true">
          <div className="start-modal">
            <div className="start-modal-header">
              <h2>Paste Markdown, HTML, or Text</h2>
              <p>
                Paste markdown, HTML, plain text, or a link to an HTML page.
              </p>
            </div>
            <textarea
              className="start-modal-textarea"
              value={markdownText}
              onChange={(event) => setMarkdownText(event.target.value)}
              placeholder="Paste markdown, HTML, plain text, or an HTML link here..."
              rows={14}
            />
            {markdownError ? (
              <div className="start-modal-error">{markdownError}</div>
            ) : null}
            <div className="start-modal-actions">
              <button
                className="start-modal-button secondary"
                type="button"
                onClick={() => setShowPasteModal(false)}
              >
                Cancel
              </button>
              <button
                className="start-modal-button primary"
                type="button"
                onClick={handlePasteContinue}
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {showThemeModal ? (
        <div className="start-modal-backdrop" role="dialog" aria-modal="true">
          <div className="start-modal">
            <div className="start-modal-header">
              <h2>Choose Paper Theme</h2>
              <p>Select a background before opening your document.</p>
            </div>
            <div className="start-theme-grid">
              <button
                className="start-theme-card"
                type="button"
                onClick={() => handleThemeSelect("light")}
              >
                <span className="theme-swatch theme-swatch-light" />
                <span>Light</span>
              </button>
              <button
                className="start-theme-card"
                type="button"
                onClick={() => handleThemeSelect("dark")}
              >
                <span className="theme-swatch theme-swatch-dark" />
                <span>Dark</span>
              </button>
            </div>
            <div className="start-modal-actions">
              <button
                className="start-modal-button secondary"
                type="button"
                onClick={() => {
                  setShowThemeModal(false);
                  setShowPasteModal(true);
                }}
              >
                Back
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <div className={`start-assistant ${assistantOpen ? "open" : ""}`}>
        {assistantOpen ? (
          <div className="assistant-panel">
            <div className="assistant-header">
              <div>
                <strong>Paper Guide</strong>
                <span>What do you want to make?</span>
              </div>
              <button
                className="assistant-close"
                type="button"
                onClick={() => setAssistantOpen(false)}
                aria-label="Close guide"
              >
                ✕
              </button>
            </div>
            <div className="assistant-actions">
              <button
                type="button"
                onClick={() => handleSelectFromAssistant(createBlankDocument())}
              >
                Blank Document
              </button>
              <button
                type="button"
                onClick={() => handleSelectFromAssistant(samplePaper)}
              >
                Sample Paper
              </button>
              <button
                type="button"
                onClick={() => handleSelectFromAssistant(templates.apa)}
              >
                APA Template
              </button>
              <button
                type="button"
                onClick={() => handleSelectFromAssistant(templates.mla)}
              >
                MLA Template
              </button>
              <button
                type="button"
                onClick={() => handleSelectFromAssistant(templates.chicago)}
              >
                Chicago Template
              </button>
              <button
                type="button"
                onClick={() => handleSelectFromAssistant(quickstartGuide)}
              >
                Quickstart Guide
              </button>
            </div>
            <div className="assistant-footer">
              <button
                className="assistant-secondary"
                type="button"
                onClick={() => {
                  setAssistantOpen(false);
                  openPasteModal();
                }}
              >
                Paste Text
              </button>
              <button
                className="assistant-secondary"
                type="button"
                onClick={() => {
                  setAssistantOpen(false);
                  openImportPicker();
                }}
              >
                Upload File
              </button>
            </div>
          </div>
        ) : null}
        <button
          className="assistant-toggle"
          type="button"
          onClick={() => setAssistantOpen((prev) => !prev)}
        >
          Need help?
        </button>
      </div>
    </div>
  );
}
