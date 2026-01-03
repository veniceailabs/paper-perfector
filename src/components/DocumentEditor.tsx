import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import type { Document, DocumentFormat } from "../models/DocumentSchema";
import type { SearchScope } from "../models/Search";
import { TableOfContents } from "./TableOfContents";
import { FormatControls } from "./FormatControls";
import { importFromMarkdownText } from "../utils/markdownImport";
import { documentToMarkdown } from "../utils/markdownExport";
import { resolveFormat } from "../utils/formatting";
import { replaceInDocument, replaceInText } from "../utils/search";
import "../styles/DocumentEditor.css";

export type DocumentEditorHandle = {
  save: () => boolean;
  setFormat: (format: DocumentFormat) => void;
  getFormat: () => DocumentFormat | undefined;
  replaceAll: (query: string, replacement: string, scope: SearchScope) => number;
  replaceNext: (query: string, replacement: string, scope: SearchScope) => number;
};

interface DocumentEditorProps {
  doc: Document;
  onSave: (doc: Document) => void;
  onDirtyChange?: (isDirty: boolean) => void;
}

export const DocumentEditor = forwardRef<DocumentEditorHandle, DocumentEditorProps>(
  function DocumentEditor({ doc, onSave, onDirtyChange }: DocumentEditorProps, ref) {
  const [title, setTitle] = useState(doc.title);
  const [subtitle, setSubtitle] = useState(doc.subtitle || "");
  const [metadata, setMetadata] = useState(doc.metadata);
  const [sections, setSections] = useState(doc.sections);
  const [currentSectionId, setCurrentSectionId] = useState<string>(
    sections[0]?.id || ""
  );
  const [format, setFormat] = useState<DocumentFormat>(resolveFormat(doc));
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
  const markdownTextareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    setTitle(doc.title);
    setSubtitle(doc.subtitle || "");
    setMetadata(doc.metadata);
    setSections(doc.sections);
    setCurrentSectionId(doc.sections[0]?.id || "");
    setFormat(resolveFormat(doc));
    setIsDirty(false);
    setMarkdownError(null);
  }, [doc]);

  useEffect(() => {
    onDirtyChange?.(isDirty);
  }, [isDirty, onDirtyChange]);

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
    format,
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
    setFormat(parsed.format ?? format);
  };

  const handleSave = () => {
    if (editorMode === "markdown") {
      const parsed = parseMarkdownDraft();
      if (!parsed) {
        return false;
      }
      const withFormat = {
        ...parsed,
        format: parsed.format ?? format,
      };
      applyParsedDoc(withFormat);
      onSave(withFormat);
      setIsDirty(false);
      return true;
    }

    onSave(buildStructuredDoc());
    setIsDirty(false);
    return true;
  };

  useImperativeHandle(
    ref,
    () => ({
      save: handleSave,
      setFormat: (nextFormat) => {
        setFormat(nextFormat);
        setIsDirty(true);
      },
      getFormat: () => format,
      replaceAll: (query, replacement, scope) =>
        runReplace(query, replacement, scope, true),
      replaceNext: (query, replacement, scope) =>
        runReplace(query, replacement, scope, false),
    }),
    [handleSave, format, markdownDraft, editorMode]
  );

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
  const wrapSelection = (
    value: string,
    start: number,
    end: number,
    before: string,
    after: string
  ) => {
    const selected = value.slice(start, end);
    const insertText = `${before}${selected}${after}`;
    return {
      nextValue: `${value.slice(0, start)}${insertText}${value.slice(end)}`,
      selectionStart: start + before.length,
      selectionEnd: start + before.length + selected.length,
    };
  };

  const applyFormatToParagraph = (
    sectionId: string,
    index: number,
    before: string,
    after = before
  ) => {
    const textarea = document.getElementById(
      `paragraph-${sectionId}-${index}`
    ) as HTMLTextAreaElement | null;
    if (!textarea) {
      return;
    }

    const start = textarea.selectionStart ?? 0;
    const end = textarea.selectionEnd ?? 0;
    const { nextValue, selectionStart, selectionEnd } = wrapSelection(
      textarea.value,
      start,
      end,
      before,
      after
    );
    handleSectionBodyChange(sectionId, index, nextValue);
    requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(selectionStart, selectionEnd);
    });
  };

  const applyFormatToMarkdown = (before: string, after = before) => {
    const textarea = markdownTextareaRef.current;
    if (!textarea) {
      return;
    }

    const start = textarea.selectionStart ?? 0;
    const end = textarea.selectionEnd ?? 0;
    const { nextValue, selectionStart, selectionEnd } = wrapSelection(
      textarea.value,
      start,
      end,
      before,
      after
    );
    setMarkdownDraft(nextValue);
    setIsDirty(true);
    requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(selectionStart, selectionEnd);
    });
  };

  const renderFormatToolbar = (onApply: (before: string, after?: string) => void) => (
    <div className="format-toolbar">
      <span className="format-toolbar-label">Style</span>
      <button
        type="button"
        className="format-toolbar-button"
        onClick={() => onApply("**")}
        aria-label="Bold"
        title="Bold"
      >
        <span className="format-toolbar-bold">B</span>
      </button>
      <button
        type="button"
        className="format-toolbar-button"
        onClick={() => onApply("*")}
        aria-label="Italic"
        title="Italic"
      >
        <span className="format-toolbar-italic">I</span>
      </button>
      <button
        type="button"
        className="format-toolbar-button"
        onClick={() => onApply("<u>", "</u>")}
        aria-label="Underline"
        title="Underline"
      >
        <span className="format-toolbar-underline">U</span>
      </button>
      <button
        type="button"
        className="format-toolbar-button"
        onClick={() => onApply("~~")}
        aria-label="Strikethrough"
        title="Strikethrough"
      >
        <span className="format-toolbar-strike">S</span>
      </button>
    </div>
  );

  const handleFormatShortcut = (
    event: KeyboardEvent<HTMLTextAreaElement>,
    onApply: (before: string, after?: string) => void
  ) => {
    if (!event.metaKey && !event.ctrlKey) {
      return;
    }

    const key = event.key.toLowerCase();
    if (key === "b") {
      event.preventDefault();
      onApply("**");
    } else if (key === "i") {
      event.preventDefault();
      onApply("*");
    } else if (key === "u") {
      event.preventDefault();
      onApply("<u>", "</u>");
    } else if (key === "x" && event.shiftKey) {
      event.preventDefault();
      onApply("~~");
    }
  };

  const runReplace = (
    query: string,
    replacement: string,
    scope: SearchScope,
    replaceAll: boolean
  ) => {
    if (editorMode === "markdown") {
      const result = replaceInText(
        markdownDraft,
        query,
        replacement,
        replaceAll
      );
      if (result.count > 0) {
        setMarkdownDraft(result.value);
        setIsDirty(true);
      }
      return result.count;
    }

    const result = replaceInDocument(
      buildStructuredDoc(),
      query,
      replacement,
      scope,
      replaceAll
    );
    if (result.count > 0) {
      applyParsedDoc(result.doc);
      setIsDirty(true);
    }
    return result.count;
  };

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
            <div className="editor-header" id="editor-top">
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
                        {renderFormatToolbar((before, after) =>
                          applyFormatToParagraph(section.id, idx, before, after)
                        )}
                        <textarea
                          id={`paragraph-${section.id}-${idx}`}
                          value={paragraph}
                          onChange={(e) =>
                            handleSectionBodyChange(
                              section.id,
                              idx,
                              e.target.value
                            )
                          }
                          onKeyDown={(event) =>
                            handleFormatShortcut(event, (before, after) =>
                              applyFormatToParagraph(section.id, idx, before, after)
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
            {renderFormatToolbar(applyFormatToMarkdown)}
            <textarea
              className="editor-markdown-textarea"
              ref={markdownTextareaRef}
              value={markdownDraft}
              onChange={(event) => {
                setMarkdownDraft(event.target.value);
                setIsDirty(true);
              }}
              onKeyDown={(event) =>
                handleFormatShortcut(event, applyFormatToMarkdown)
              }
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
            <div className="editor-format-panel compact">
              <h4>Formatting</h4>
              <FormatControls
                format={format}
                onChange={(nextFormat) => {
                  setFormat(nextFormat);
                  setIsDirty(true);
                }}
                compact={true}
              />
            </div>
          </div>
        )}
      </div>

      {editorMode === "structured" ? (
        <div className="editor-sidebar editor-sidebar-right">
          <button className="save-btn" onClick={handleSave}>
            💾 Save Changes
          </button>
          <div className="editor-format-panel">
            <h4>Formatting</h4>
            <FormatControls
              format={format}
              onChange={(nextFormat) => {
                setFormat(nextFormat);
                setIsDirty(true);
              }}
              compact={true}
            />
          </div>
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
);

DocumentEditor.displayName = "DocumentEditor";
