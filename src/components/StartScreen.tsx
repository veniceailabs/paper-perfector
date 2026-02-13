import { useMemo, useRef, useState } from "react";
import { Document } from "../models/DocumentSchema";
import { templates } from "../documents/templates";
import { quickstartGuide } from "../documents/quickstartGuide";
import { dataBlasterOneSheet } from "../documents/dataBlasterOneSheet";
import { paperPerfectorOneSheet } from "../documents/paperPerfectorOneSheet";
import { importFromMarkdownText } from "../utils/markdownImport";
import { importFromHtmlText } from "../utils/htmlImport";
import type { SavedDocument } from "../utils/library";
import { useFocusTrap } from "../hooks/useFocusTrap";
import { openFeedbackEmail } from "../utils/feedback";
import {
  IconImport,
  IconNewPaper,
  IconScholar,
} from "./icons/CustomIcons";
import "../styles/StartScreen.css";

interface StartScreenProps {
  onSelectDocument: (doc: Document) => void;
  onImport: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onThemeChange: (theme: "light" | "dark") => void;
  savedDocuments: SavedDocument[];
  onOpenSavedDocument: (id: string) => void;
  onDeleteSavedDocument: (id: string) => void;
  onExportSavedDocument: (doc: Document, docId?: string) => void;
}

export function StartScreen({
  onSelectDocument,
  onImport,
  onThemeChange,
  savedDocuments,
  onOpenSavedDocument,
  onDeleteSavedDocument,
  onExportSavedDocument,
}: StartScreenProps) {
  const [showPasteModal, setShowPasteModal] = useState(false);
  const [showThemeModal, setShowThemeModal] = useState(false);
  const [workspaceView, setWorkspaceView] = useState<
    "recent" | "library" | "templates" | "shared"
  >("recent");
  const [libraryQuery, setLibraryQuery] = useState("");
  const [markdownText, setMarkdownText] = useState("");
  const [markdownError, setMarkdownError] = useState<string | null>(null);
  const [pendingDoc, setPendingDoc] = useState<Document | null>(null);
  const [assistantOpen, setAssistantOpen] = useState(false);
  const importInputRef = useRef<HTMLInputElement>(null);
  const pasteModalRef = useRef<HTMLDivElement | null>(null);
  const themeModalRef = useRef<HTMLDivElement | null>(null);

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

  const orderedSavedDocuments = [...savedDocuments].sort((a, b) =>
    b.updatedAt.localeCompare(a.updatedAt)
  );
  const filteredSavedDocuments = useMemo(() => {
    const query = libraryQuery.trim().toLowerCase();
    if (!query) {
      return orderedSavedDocuments;
    }
    return orderedSavedDocuments.filter((entry) =>
      `${entry.title} ${entry.doc.subtitle ?? ""}`.toLowerCase().includes(query)
    );
  }, [libraryQuery, orderedSavedDocuments]);
  const recentDocuments = filteredSavedDocuments.slice(0, 8);

  const formatSavedAt = (value: string) => {
    try {
      const date = new Date(value);
      return date.toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return value;
    }
  };

  const handleDeleteSaved = (entry: SavedDocument) => {
    const confirmed = window.confirm(
      `Delete "${entry.title}" from your library? This cannot be undone.`
    );
    if (!confirmed) {
      return;
    }
    onDeleteSavedDocument(entry.id);
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

  useFocusTrap(pasteModalRef, () => setShowPasteModal(false));
  useFocusTrap(themeModalRef, () => setShowThemeModal(false));

  return (
    <div className="start-screen">
      <div className="start-workspace">
        <aside className="start-sidebar">
          <div className="start-brand">
            <h1>Paper Perfector</h1>
            <p>Academic workspace and library</p>
          </div>
          <button
            className="start-primary-action"
            type="button"
            onClick={() => onSelectDocument(createBlankDocument())}
            data-tip="Start a new blank document."
          >
            <span className="icon-inline">
              <IconNewPaper size={16} />
              New Paper
            </span>
          </button>
          <div className="start-quick-actions">
            <button
              type="button"
              onClick={openPasteModal}
              data-tip="Paste markdown, HTML, or plain text."
            >
              Paste Content
            </button>
            <button
              type="button"
              onClick={openImportPicker}
              data-tip="Import .ppdoc, HTML, PDF, Word, Markdown, or text files."
            >
              <span className="icon-inline">
                <IconImport size={15} />
                Import File
              </span>
            </button>
            <button
              type="button"
              onClick={() => onSelectDocument(quickstartGuide)}
              data-tip="Open the quickstart guide."
            >
              Quickstart Guide
            </button>
          </div>
          <input
            ref={importInputRef}
            type="file"
            accept="text/html,.html,.htm,application/pdf,.pdf,image/*,text/markdown,.md,text/plain,.txt,application/vnd.openxmlformats-officedocument.wordprocessingml.document,.docx,.doc,.ppdoc"
            onChange={onImport}
            style={{ display: "none" }}
          />
          <div className="start-library-search">
            <label htmlFor="workspace-search">Search Library</label>
            <input
              id="workspace-search"
              type="search"
              value={libraryQuery}
              onChange={(event) => setLibraryQuery(event.target.value)}
              placeholder="Find by title..."
            />
          </div>
          <nav className="start-nav">
            <button
              type="button"
              className={workspaceView === "recent" ? "active" : ""}
              onClick={() => setWorkspaceView("recent")}
            >
              Recent
              <span>{Math.min(8, filteredSavedDocuments.length)}</span>
            </button>
            <button
              type="button"
              className={workspaceView === "library" ? "active" : ""}
              onClick={() => setWorkspaceView("library")}
            >
              My Library
              <span>{filteredSavedDocuments.length}</span>
            </button>
            <button
              type="button"
              className={workspaceView === "templates" ? "active" : ""}
              onClick={() => setWorkspaceView("templates")}
            >
              Templates
              <span>3</span>
            </button>
            <button
              type="button"
              className={workspaceView === "shared" ? "active" : ""}
              onClick={() => setWorkspaceView("shared")}
            >
              Shared with Me
              <span>0</span>
            </button>
          </nav>
        </aside>
        <main className="start-stage">
          <header className="start-stage-header">
            <div>
              <h2>
                {workspaceView === "recent"
                  ? "Recent Work"
                  : workspaceView === "library"
                    ? "Document Library"
                    : workspaceView === "templates"
                      ? "Academic Templates"
                      : "Shared Workspace"}
              </h2>
              <p>
                {workspaceView === "templates"
                  ? "Start from pre-formatted standards and one-click guides."
                  : "Open work quickly, continue where you left off, and keep your exports consistent."}
              </p>
            </div>
            <div className="start-theme-toggle">
              <button
                type="button"
                onClick={() => onThemeChange("dark")}
                data-tip="Switch workspace visuals to dark mode."
              >
                Dark
              </button>
              <button
                type="button"
                onClick={() => onThemeChange("light")}
                data-tip="Switch workspace visuals to light mode."
              >
                Light
              </button>
            </div>
          </header>

          {(workspaceView === "recent" || workspaceView === "library") && (
            <section className="start-panel">
              {filteredSavedDocuments.length > 0 ? (
                <div className="start-doc-grid">
                  {(workspaceView === "recent"
                    ? recentDocuments
                    : filteredSavedDocuments
                  ).map((entry) => (
                    <article key={entry.id} className="start-doc-card">
                      <div className="start-doc-head">
                        <h3>{entry.title}</h3>
                        <span>{entry.versions.length} versions</span>
                      </div>
                      <p>
                        Updated {formatSavedAt(entry.updatedAt)} · Created{" "}
                        {formatSavedAt(entry.createdAt)}
                      </p>
                      <div className="saved-card-actions">
                        <button
                          type="button"
                          onClick={() => onOpenSavedDocument(entry.id)}
                          data-tip="Open this saved document."
                        >
                          Open
                        </button>
                        <button
                          type="button"
                          onClick={() => onExportSavedDocument(entry.doc, entry.id)}
                          data-tip="Export this document as .ppdoc."
                        >
                          Export
                        </button>
                        <button
                          type="button"
                          className="danger"
                          onClick={() => handleDeleteSaved(entry)}
                          data-tip="Delete this document from your library."
                        >
                          Delete
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="start-empty">
                  <h3>No saved papers yet</h3>
                  <p>
                    Create your first document or import a PDF/Word file to start
                    building your library.
                  </p>
                  <div className="start-empty-actions">
                    <button
                      type="button"
                      onClick={() => onSelectDocument(createBlankDocument())}
                    >
                      New Blank Paper
                    </button>
                    <button type="button" onClick={openImportPicker}>
                      Import Existing File
                    </button>
                  </div>
                </div>
              )}
            </section>
          )}

          {workspaceView === "templates" && (
            <section className="start-panel">
              <div className="start-template-grid">
                <article className="start-template-card">
                  <div>
                    <h3 className="icon-inline">
                      <IconScholar size={16} />
                      APA Format
                    </h3>
                    <p>7th Edition · Running head and references ready</p>
                  </div>
                  <button type="button" onClick={() => onSelectDocument(templates.apa)}>
                    Use Template
                  </button>
                </article>
                <article className="start-template-card">
                  <div>
                    <h3 className="icon-inline">
                      <IconScholar size={16} />
                      MLA Format
                    </h3>
                    <p>9th Edition · Works cited aligned and spaced</p>
                  </div>
                  <button type="button" onClick={() => onSelectDocument(templates.mla)}>
                    Use Template
                  </button>
                </article>
                <article className="start-template-card">
                  <div>
                    <h3 className="icon-inline">
                      <IconScholar size={16} />
                      Chicago Style
                    </h3>
                    <p>17th Edition · Notes and bibliography baseline</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onSelectDocument(templates.chicago)}
                  >
                    Use Template
                  </button>
                </article>
              </div>
            </section>
          )}

          {workspaceView === "shared" && (
            <section className="start-panel">
              <div className="start-empty">
                <h3>No shared documents yet</h3>
                <p>
                  Shared links and collaborative drops will appear here when they
                  are opened in this workspace.
                </p>
              </div>
            </section>
          )}

          <section className="start-panel start-panel-secondary">
            <div className="start-one-sheet-grid">
              <button
                type="button"
                onClick={() => onSelectDocument(dataBlasterOneSheet)}
                data-tip="Open the Data Blaster one-sheet overview."
              >
                Data Blaster One Sheet
              </button>
              <button
                type="button"
                onClick={() => onSelectDocument(paperPerfectorOneSheet)}
                data-tip="Open the Paper Perfector one-sheet overview."
              >
                Paper Perfector One Sheet
              </button>
              <button
                type="button"
                onClick={openFeedbackEmail}
                data-tip="Send product feedback."
              >
                Send Feedback
              </button>
            </div>
          </section>
        </main>
      </div>

      {showPasteModal ? (
        <div className="start-modal-backdrop" role="dialog" aria-modal="true">
          <div className="start-modal" ref={pasteModalRef} tabIndex={-1}>
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
              data-tip="Paste content here. Use plain text for exact spacing."
            />
            {markdownError ? (
              <div className="start-modal-error">{markdownError}</div>
            ) : null}
            <div className="start-modal-actions">
              <button
                className="start-modal-button secondary"
                type="button"
                onClick={() => setShowPasteModal(false)}
                data-tip="Close without importing."
              >
                Cancel
              </button>
              <button
                className="start-modal-button primary"
                type="button"
                onClick={handlePasteContinue}
                data-tip="Convert the pasted content into a new paper."
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {showThemeModal ? (
        <div className="start-modal-backdrop" role="dialog" aria-modal="true">
          <div className="start-modal" ref={themeModalRef} tabIndex={-1}>
            <div className="start-modal-header">
              <h2>Choose Paper Theme</h2>
              <p>Select a background before opening your document.</p>
            </div>
            <div className="start-theme-grid">
              <button
                className="start-theme-card"
                type="button"
                onClick={() => handleThemeSelect("light")}
                data-tip="Choose a light background for printing or reading."
              >
                <span className="theme-swatch theme-swatch-light" />
                <span>Light</span>
              </button>
              <button
                className="start-theme-card"
                type="button"
                onClick={() => handleThemeSelect("dark")}
                data-tip="Choose a dark background for screen review."
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
                data-tip="Go back to edit the pasted content."
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
                data-tip="Start a new blank document."
              >
                Blank Document
              </button>
              <button
                type="button"
                onClick={() => handleSelectFromAssistant(templates.apa)}
                data-tip="Open APA 7th Edition template."
              >
                APA Template
              </button>
              <button
                type="button"
                onClick={() => handleSelectFromAssistant(templates.mla)}
                data-tip="Open MLA 9th Edition template."
              >
                MLA Template
              </button>
              <button
                type="button"
                onClick={() => handleSelectFromAssistant(templates.chicago)}
                data-tip="Open Chicago 17th Edition template."
              >
                Chicago Template
              </button>
              <button
                type="button"
                onClick={() => handleSelectFromAssistant(quickstartGuide)}
                data-tip="Open the quickstart guide."
              >
                Quickstart Guide
              </button>
              <button
                type="button"
                onClick={() => handleSelectFromAssistant(dataBlasterOneSheet)}
                data-tip="Open the Data Blaster one-sheet overview."
              >
                Data Blaster One Sheet
              </button>
              <button
                type="button"
                onClick={() => handleSelectFromAssistant(paperPerfectorOneSheet)}
                data-tip="Open the Paper Perfector one-sheet overview."
              >
                Paper Perfector One Sheet
              </button>
              <button
                type="button"
                onClick={openFeedbackEmail}
                data-tip="Send product feedback."
              >
                Send feedback
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
                data-tip="Paste markdown, HTML, or text."
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
                data-tip="Upload a file to import."
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
          data-tip="Open the guide to choose a starting point."
        >
          Need help?
        </button>
      </div>
    </div>
  );
}
