import { useEffect, useState } from "react";
import type { Document } from "../models/DocumentSchema";
import { TableOfContents } from "./TableOfContents";
import { importFromMarkdownText } from "../utils/markdownImport";
import { documentToMarkdown } from "../utils/markdownExport";
import "../styles/DocumentEditor.css";

interface DocumentEditorProps {
  doc: Document;
  onSave: (doc: Document) => void;
  onDirtyChange?: (isDirty: boolean) => void;
  saveSignal?: number;
  onSaveResult?: (success: boolean) => void;
}

export function DocumentEditor({
  doc,
  onSave,
  onDirtyChange,
  saveSignal,
  onSaveResult,
}: DocumentEditorProps) {
  const [title, setTitle] = useState(doc.title);
  const [subtitle, setSubtitle] = useState(doc.subtitle || "");
  const [metadata, setMetadata] = useState(doc.metadata);
  const [sections, setSections] = useState(doc.sections);
  const [currentSectionId, setCurrentSectionId] = useState<string>(
    sections[0]?.id || ""
  );
  const [isDirty, setIsDirty] = useState(false);
  const [editorMode, setEditorMode] = useState<"structured" | "markdown">(
    "structured"
  );
  const [markdownDraft, setMarkdownDraft] = useState("");
  const [markdownError, setMarkdownError] = useState<string | null>(null);
  const [expandedParagraph, setExpandedParagraph] = useState<{
    sectionId: string;
    index: number;
  } | null>(null);
  const [expandedText, setExpandedText] = useState("");
  const [saveTrigger, setSaveTrigger] = useState(0);

  useEffect(() => {
    setTitle(doc.title);
    setSubtitle(doc.subtitle || "");
    setMetadata(doc.metadata);
    setSections(doc.sections);
    setCurrentSectionId(doc.sections[0]?.id || "");
    setIsDirty(false);
    setMarkdownError(null);
  }, [doc]);

  useEffect(() => {
    onDirtyChange?.(isDirty);
  }, [isDirty, onDirtyChange]);

  useEffect(() => {
    if (saveSignal === undefined || saveSignal === saveTrigger) {
      return;
    }
    setSaveTrigger(saveSignal);
    const success = handleSave();
    onSaveResult?.(success);
  }, [saveSignal, saveTrigger]);

  const handleMetadataChange = (key: string, value: string) => {
    setMetadata({ ...metadata, [key]: value });
    setIsDirty(true);
  };

  const handleSectionBodyChange = (sectionId: string, bodyIndex: number, text: string) => {
    setSections(
      sections.map((section) => {
        if (section.id === sectionId) {
          const newBody = [...section.body];
          newBody[bodyIndex] = text;
          return { ...section, body: newBody };
        }
        return section;
      })
    );
    setIsDirty(true);
  };

  const handleSectionTitleChange = (sectionId: string, text: string) => {
    setSections(
      sections.map((section) => {
        if (section.id === sectionId) {
          return { ...section, title: text };
        }
        return section;
      })
    );
    setIsDirty(true);
  };

  const addParagraphToSection = (sectionId: string) => {
    setSections(
      sections.map((section) => {
        if (section.id === sectionId) {
          return { ...section, body: [...section.body, ""] };
        }
        return section;
      })
    );
    setIsDirty(true);
  };

  const removeParagraphFromSection = (sectionId: string, bodyIndex: number) => {
    setSections(
      sections.map((section) => {
        if (section.id === sectionId) {
          return { ...section, body: section.body.filter((_, i) => i !== bodyIndex) };
        }
        return section;
      })
    );
    setIsDirty(true);
  };

  const addSection = () => {
    const newId = `section-${Date.now()}`;
    setSections([
      ...sections,
      {
        id: newId,
        level: 2,
        title: "New Section",
        body: ["Start typing here..."],
        monoBlocks: [],
      },
    ]);
    setIsDirty(true);
  };

  const removeSection = (sectionId: string) => {
    setSections(sections.filter((s) => s.id !== sectionId));
    setIsDirty(true);
  };

  const buildStructuredDoc = (): Document => ({
    title,
    subtitle: subtitle || undefined,
    metadata,
    sections,
  });

  const syncMarkdownDraft = () => {
    const snapshot = buildStructuredDoc();
    setMarkdownDraft(documentToMarkdown(snapshot));
    setMarkdownError(null);
  };

  const parseMarkdownDraft = () => {
    try {
      const parsed = importFromMarkdownText(markdownDraft);
      setMarkdownError(null);
      return parsed;
    } catch (error) {
      setMarkdownError(
        error instanceof Error ? error.message : "Failed to parse markdown."
      );
      return null;
    }
  };

  const applyParsedDoc = (parsed: Document) => {
    setTitle(parsed.title);
    setSubtitle(parsed.subtitle ?? "");
    setMetadata(parsed.metadata);
    setSections(parsed.sections);
    setCurrentSectionId(parsed.sections[0]?.id || "");
  };

  const handleSave = () => {
    if (editorMode === "markdown") {
      const parsed = parseMarkdownDraft();
      if (!parsed) {
        return false;
      }
      applyParsedDoc(parsed);
      onSave(parsed);
      setIsDirty(false);
      return true;
    }

    onSave(buildStructuredDoc());
    setIsDirty(false);
    return true;
  };

  const handleSectionClick = (sectionId: string) => {
    setCurrentSectionId(sectionId);
    // Scroll to section in the editor
    const element = document.getElementById(`editor-section-${sectionId}`);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  const openParagraphExpand = (
    sectionId: string,
    index: number,
    text: string
  ) => {
    setExpandedParagraph({ sectionId, index });
    setExpandedText(text);
  };

  const closeParagraphExpand = () => {
    setExpandedParagraph(null);
    setExpandedText("");
  };

  const applyExpandedText = () => {
    if (!expandedParagraph) {
      return;
    }
    handleSectionBodyChange(
      expandedParagraph.sectionId,
      expandedParagraph.index,
      expandedText
    );
    closeParagraphExpand();
  };

  const isMarkdownMode = editorMode === "markdown";

  return (
    <div className={`editor-container ${isMarkdownMode ? "markdown" : ""}`}>
      <aside className="editor-sidebar editor-sidebar-left">
        <TableOfContents
          sections={sections}
          currentSectionId={currentSectionId}
          onSectionClick={handleSectionClick}
          isCompact={true}
        />
      </aside>

      <div className="editor-main">
        <div className="editor-toolbar">
          <div className="editor-mode-toggle">
            <button
              type="button"
              className={`editor-mode-button ${
                editorMode === "structured" ? "active" : ""
              }`}
              onClick={() => {
                if (editorMode === "structured") {
                  return;
                }
                const parsed = parseMarkdownDraft();
                if (!parsed) {
                  return;
                }
                applyParsedDoc(parsed);
                setEditorMode("structured");
              }}
            >
              Structured
            </button>
            <button
              type="button"
              className={`editor-mode-button ${
                editorMode === "markdown" ? "active" : ""
              }`}
              onClick={() => {
                if (editorMode === "markdown") {
                  return;
                }
                syncMarkdownDraft();
                setEditorMode("markdown");
              }}
            >
              Freeform
            </button>
          </div>
          <span className="editor-mode-hint">
            {editorMode === "markdown"
              ? "Edit markdown freely and add blank lines for spacing."
              : "Edit sections or switch to Freeform for full markdown control."}
          </span>
        </div>

        {editorMode === "structured" ? (
          <>
            <div className="editor-header">
          <input
            type="text"
            className="editor-title"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              setIsDirty(true);
            }}
            placeholder="Document Title"
          />
          <input
            type="text"
            className="editor-subtitle"
            value={subtitle}
            onChange={(e) => {
              setSubtitle(e.target.value);
              setIsDirty(true);
            }}
            placeholder="Subtitle (optional)"
          />
            </div>

            <div className="editor-metadata">
              <h3>Metadata</h3>
              <div className="metadata-grid">
                {Object.entries(metadata).map(([key, value]) => (
                  <div key={key} className="metadata-field">
                    <label>{key}</label>
                    <input
                      type="text"
                      value={value}
                      onChange={(e) => handleMetadataChange(key, e.target.value)}
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="editor-sections">
              <h3>Sections</h3>
              {sections.map((section) => (
                <div
                  key={section.id}
                  id={`editor-section-${section.id}`}
                  className={`section-editor level-${section.level} ${
                    currentSectionId === section.id ? "active" : ""
                  }`}
                  onMouseEnter={() => setCurrentSectionId(section.id)}
                >
                  <div className="section-header">
                    <input
                      type="text"
                      className="section-title-input"
                      value={section.title}
                      onChange={(e) =>
                        handleSectionTitleChange(section.id, e.target.value)
                      }
                      placeholder="Section Title"
                    />
                    <button
                      className="remove-section-btn"
                      onClick={() => removeSection(section.id)}
                      title="Remove section"
                    >
                      ✕
                    </button>
                  </div>

                  <div className="section-body">
                    {section.body.map((paragraph, idx) => (
                      <div key={idx} className="paragraph-editor">
                        <textarea
                          value={paragraph}
                          onChange={(e) =>
                            handleSectionBodyChange(
                              section.id,
                              idx,
                              e.target.value
                            )
                          }
                          placeholder="Enter paragraph text..."
                          rows={Math.max(2, Math.ceil(paragraph.length / 60))}
                        />
                        <div className="paragraph-actions">
                          <button
                            className="expand-paragraph-btn"
                            type="button"
                            onClick={() =>
                              openParagraphExpand(section.id, idx, paragraph)
                            }
                          >
                            Expand
                          </button>
                          {section.body.length > 1 && (
                            <button
                              className="remove-paragraph-btn"
                              onClick={() =>
                                removeParagraphFromSection(section.id, idx)
                              }
                              title="Remove paragraph"
                            >
                              Remove
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  <button
                    className="add-paragraph-btn"
                    onClick={() => addParagraphToSection(section.id)}
                  >
                    + Add Paragraph
                  </button>
                </div>
              ))}

              <button className="add-section-btn" onClick={addSection}>
                + Add Section
              </button>
            </div>
          </>
        ) : (
          <div className="editor-markdown">
            <textarea
              className="editor-markdown-textarea"
              value={markdownDraft}
              onChange={(event) => {
                setMarkdownDraft(event.target.value);
                setIsDirty(true);
              }}
              placeholder="# Title\n\n## Subtitle\n\n**Author:** Name\n\n## Section\n\nWrite freely here..."
              rows={22}
            />
            {markdownError ? (
              <div className="editor-markdown-error">{markdownError}</div>
            ) : null}
            <div className="editor-markdown-actions">
              <button className="save-btn" onClick={handleSave}>
                💾 Save Changes
              </button>
              <button
                className="editor-secondary-btn"
                type="button"
                onClick={() => {
                  const parsed = parseMarkdownDraft();
                  if (!parsed) {
                    return;
                  }
                  applyParsedDoc(parsed);
                  setEditorMode("structured");
                }}
              >
                Switch to Structured
              </button>
            </div>
          </div>
        )}
      </div>

      {editorMode === "structured" ? (
        <div className="editor-sidebar editor-sidebar-right">
          <button className="save-btn" onClick={handleSave}>
            💾 Save Changes
          </button>
          <div className="editor-tips">
            <h4>Tips</h4>
            <ul>
              <li>Click "Save Changes" to update the document</li>
              <li>Add paragraphs within sections</li>
              <li>Add new sections as needed</li>
              <li>Edit metadata to track version, author, etc.</li>
            </ul>
          </div>
        </div>
      ) : null}

      {expandedParagraph ? (
        <div
          className="editor-modal-backdrop"
          role="dialog"
          aria-modal="true"
          onClick={closeParagraphExpand}
        >
          <div
            className="editor-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="editor-modal-header">
              <h3>Expanded Paragraph</h3>
              <button
                className="editor-modal-close"
                type="button"
                onClick={closeParagraphExpand}
              >
                X
              </button>
            </div>
            <textarea
              className="editor-modal-textarea"
              value={expandedText}
              onChange={(event) => setExpandedText(event.target.value)}
              rows={16}
            />
            <div className="editor-modal-actions">
              <button
                className="editor-modal-button secondary"
                type="button"
                onClick={closeParagraphExpand}
              >
                Cancel
              </button>
              <button
                className="editor-modal-button primary"
                type="button"
                onClick={applyExpandedText}
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
