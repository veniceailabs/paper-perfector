import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import type { Document, DocumentFormat, Source } from "../models/DocumentSchema";
import type { SearchScope } from "../models/Search";
import { TableOfContents } from "./TableOfContents";
import { FormatControls } from "./FormatControls";
import { importFromMarkdownText } from "../utils/markdownImport";
import { documentToMarkdown } from "../utils/markdownExport";
import {
  formatPresetLabel,
  formatSummary,
  formatPresets,
  resolveFormat,
} from "../utils/formatting";
import {
  formatInTextCitation,
  formatReference,
  formatReferenceTitle,
} from "../utils/citations";
import { replaceInDocument, replaceInText } from "../utils/search";
import { auditCitationCoverage } from "../utils/citationAudit";
import { calculateDocumentStats } from "../utils/documentStats";
import "../styles/DocumentEditor.css";

export type DocumentEditorHandle = {
  save: () => boolean;
  setFormat: (format: DocumentFormat) => void;
  getFormat: () => DocumentFormat | undefined;
  replaceAll: (query: string, replacement: string, scope: SearchScope) => number;
  replaceNext: (query: string, replacement: string, scope: SearchScope) => number;
  addSource: (source: Source) => void;
  removeSource: (sourceId: string) => void;
  insertCitation: (source: Source) => boolean;
  insertReference: (source: Source) => void;
};

interface DocumentEditorProps {
  doc: Document;
  onSave: (doc: Document) => void;
  onDirtyChange?: (isDirty: boolean) => void;
  onSaveDefaults?: (format: DocumentFormat) => void;
}

export const DocumentEditor = forwardRef<DocumentEditorHandle, DocumentEditorProps>(
  function DocumentEditor(
    { doc, onSave, onDirtyChange, onSaveDefaults }: DocumentEditorProps,
    ref
  ) {
  const [title, setTitle] = useState(doc.title);
  const [subtitle, setSubtitle] = useState(doc.subtitle || "");
  const [metadata, setMetadata] = useState(doc.metadata);
  const [sections, setSections] = useState(doc.sections);
  const [sources, setSources] = useState<Source[]>(doc.sources ?? []);
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
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const markdownTextareaRef = useRef<HTMLTextAreaElement | null>(null);
  const lastFocusRef = useRef<
    | { type: "markdown"; element: HTMLTextAreaElement }
    | { type: "paragraph"; sectionId: string; index: number; element: HTMLTextAreaElement }
    | { type: "title"; element: HTMLInputElement }
    | { type: "subtitle"; element: HTMLInputElement }
    | { type: "metadata"; key: string; element: HTMLInputElement }
    | { type: "section-title"; sectionId: string; element: HTMLInputElement }
    | null
  >(null);

  useEffect(() => {
    setTitle(doc.title);
    setSubtitle(doc.subtitle || "");
    setMetadata(doc.metadata);
    setSections(doc.sections);
    setCurrentSectionId(doc.sections[0]?.id || "");
    setFormat(resolveFormat(doc));
    setSources(doc.sources ?? []);
    setIsDirty(false);
    setMarkdownError(null);
    setLastSavedAt(null);
  }, [doc]);

  useEffect(() => {
    onDirtyChange?.(isDirty);
  }, [isDirty, onDirtyChange]);

  const handleMetadataChange = (key: string, value: string) => {
    setMetadata((prev) => ({ ...prev, [key]: value }));
    setIsDirty(true);
  };

  const handleSectionBodyChange = (sectionId: string, bodyIndex: number, text: string) => {
    setSections((prev) =>
      prev.map((section) => {
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
    setSections((prev) =>
      prev.map((section) => {
        if (section.id === sectionId) {
          return { ...section, title: text };
        }
        return section;
      })
    );
    setIsDirty(true);
  };

  const addParagraphToSection = (sectionId: string) => {
    setSections((prev) =>
      prev.map((section) => {
        if (section.id === sectionId) {
          return { ...section, body: [...section.body, ""] };
        }
        return section;
      })
    );
    setIsDirty(true);
  };

  const removeParagraphFromSection = (sectionId: string, bodyIndex: number) => {
    setSections((prev) =>
      prev.map((section) => {
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
    setSections((prev) => [
      ...prev,
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
    setSections((prev) => prev.filter((section) => section.id !== sectionId));
    setIsDirty(true);
  };

  const buildStructuredDoc = (): Document => ({
    title,
    subtitle: subtitle || undefined,
    metadata,
    sections,
    format,
    sources,
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
    const mergedFormat = {
      ...format,
      ...(parsed.format ?? {}),
    };
    setTitle(parsed.title);
    setSubtitle(parsed.subtitle ?? "");
    setMetadata(parsed.metadata);
    setSections(parsed.sections);
    setCurrentSectionId(parsed.sections[0]?.id || "");
    setFormat(mergedFormat);
    setSources((prev) => parsed.sources ?? prev);
  };

  const handleResetFormat = () => {
    const preset = format.preset ?? "default";
    const defaults = formatPresets[preset] ?? formatPresets.default;
    setFormat(defaults);
    setIsDirty(true);
  };

  const handleSave = () => {
    if (editorMode === "markdown") {
      const parsed = parseMarkdownDraft();
      if (!parsed) {
        return false;
      }
      const mergedFormat = {
        ...format,
        ...(parsed.format ?? {}),
      };
      const withFormat = {
        ...parsed,
        format: mergedFormat,
        sources,
      };
      applyParsedDoc(withFormat);
      onSave(withFormat);
      setIsDirty(false);
      setLastSavedAt(new Date());
      return true;
    }

    onSave(buildStructuredDoc());
    setIsDirty(false);
    setLastSavedAt(new Date());
    return true;
  };

  useEffect(() => {
    const handleKeyDown = (event: globalThis.KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "s") {
        event.preventDefault();
        handleSave();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleSave]);

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
      addSource,
      removeSource,
      insertCitation,
      insertReference,
    }),
    [handleSave, format, markdownDraft, editorMode, sources]
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

  const insertTextAtCursor = (text: string) => {
    const activeField = lastFocusRef.current;
    if (!activeField) {
      return false;
    }

    const applyInsertion = (
      element: HTMLInputElement | HTMLTextAreaElement,
      value: string,
      apply: (nextValue: string) => void
    ) => {
      const start = element.selectionStart ?? value.length;
      const end = element.selectionEnd ?? value.length;
      const nextValue = `${value.slice(0, start)}${text}${value.slice(end)}`;
      apply(nextValue);
      requestAnimationFrame(() => {
        element.focus();
        const cursor = start + text.length;
        element.setSelectionRange(cursor, cursor);
      });
    };

    if (activeField.type === "markdown") {
      const textarea = activeField.element;
      if (!textarea) {
        return false;
      }
      applyInsertion(textarea, markdownDraft, (next) => {
        setMarkdownDraft(next);
        setIsDirty(true);
      });
      return true;
    }

    if (activeField.type === "paragraph") {
      const textarea = activeField.element;
      if (!textarea) {
        return false;
      }
      applyInsertion(textarea, textarea.value, (next) =>
        handleSectionBodyChange(activeField.sectionId, activeField.index, next)
      );
      return true;
    }

    if (activeField.type === "section-title") {
      const input = activeField.element;
      if (!input) {
        return false;
      }
      applyInsertion(input, input.value, (next) =>
        handleSectionTitleChange(activeField.sectionId, next)
      );
      return true;
    }

    if (activeField.type === "metadata") {
      const input = activeField.element;
      if (!input) {
        return false;
      }
      applyInsertion(input, input.value, (next) =>
        handleMetadataChange(activeField.key, next)
      );
      return true;
    }

    if (activeField.type === "title") {
      const input = activeField.element;
      if (!input) {
        return false;
      }
      applyInsertion(input, input.value, (next) => {
        setTitle(next);
        setIsDirty(true);
      });
      return true;
    }

    if (activeField.type === "subtitle") {
      const input = activeField.element;
      if (!input) {
        return false;
      }
      applyInsertion(input, input.value, (next) => {
        setSubtitle(next);
        setIsDirty(true);
      });
      return true;
    }

    return false;
  };

  const addSource = (source: Source) => {
    setSources((prev) => {
      const exists = prev.some(
        (item) =>
          item.id === source.id ||
          (item.title === source.title && item.year === source.year)
      );
      if (exists) {
        return prev;
      }
      return [...prev, source];
    });
    setIsDirty(true);
  };

  const removeSource = (sourceId: string) => {
    setSources((prev) => prev.filter((source) => source.id !== sourceId));
    setIsDirty(true);
  };

  const insertCitation = (source: Source) => {
    const citation = formatInTextCitation(source, citationStyle);
    return insertTextAtCursor(` ${citation} `);
  };

  const insertReference = (source: Source) => {
    const reference = formatReference(source, citationStyle);
    const referenceTitle = formatReferenceTitle(citationStyle);
    setSections((prev) => {
      const existingIndex = prev.findIndex((section) =>
        /references|bibliography|works cited/i.test(section.title)
      );
      if (existingIndex >= 0) {
        const next = [...prev];
        const target = next[existingIndex];
        const updatedBody = [...target.body, reference];
        next[existingIndex] = { ...target, body: updatedBody };
        return next;
      }
      return [
        ...prev,
        {
          id: `references-${Date.now()}`,
          level: 1,
          title: referenceTitle,
          body: [reference],
        },
      ];
    });
    setIsDirty(true);
  };

  const renderSourcesPanel = (compact: boolean) => (
    <div className={`editor-sources-panel ${compact ? "compact" : ""}`}>
      <h4>Sources</h4>
      {sources.length === 0 ? (
        <p className="editor-sources-empty">
          Save sources from Scholar search to cite them here.
        </p>
      ) : (
        <div className="editor-sources-list">
          {sources.map((source) => (
            <div key={source.id} className="editor-source-item">
              <div className="editor-source-meta">
                <strong>{source.title}</strong>
                <span>
                  {[source.authors[0], source.year, source.venue]
                    .filter(Boolean)
                    .join(" • ")}
                </span>
              </div>
              <div className="editor-source-actions">
                <button type="button" onClick={() => insertCitation(source)}>
                  Cite
                </button>
                <button type="button" onClick={() => insertReference(source)}>
                  Reference
                </button>
                <button
                  type="button"
                  className="danger"
                  onClick={() => removeSource(source.id)}
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      <p className="editor-sources-hint">
        Click inside your text first, then press Cite to insert an in-text citation.
      </p>
    </div>
  );

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
    event: ReactKeyboardEvent<HTMLTextAreaElement>,
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

  const activePreset = format.preset ?? "default";
  const showFormatLock =
    activePreset === "apa" ||
    activePreset === "mla" ||
    activePreset === "chicago";
  const citationStyle = activePreset;
  const formatLockLabel = formatPresetLabel(activePreset);
  const formatLockSummary = formatSummary(format);
  const saveStatus = isDirty
    ? "Unsaved changes"
    : lastSavedAt
      ? "All changes saved"
      : "Not saved yet";
  const savedTimeLabel = lastSavedAt
    ? `Saved ${lastSavedAt.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })}`
    : "Use Save Changes to update";

  const activeDocForNotes = (() => {
    if (editorMode === "markdown") {
      try {
        return importFromMarkdownText(markdownDraft);
      } catch {
        return null;
      }
    }
    return buildStructuredDoc();
  })();

  const citationAudit = activeDocForNotes
    ? auditCitationCoverage(activeDocForNotes, format)
    : null;
  const docStats = activeDocForNotes
    ? calculateDocumentStats(activeDocForNotes, format.lineHeight ?? 1.5)
    : null;
  const professorNotes = (() => {
    if (!activeDocForNotes) {
      return ["Finish a section to unlock guidance."];
    }
    const notes: string[] = [];
    const sectionsToCheck = activeDocForNotes.sections;
    const intro =
      sectionsToCheck.find((section) =>
        /introduction|overview/i.test(section.title)
      ) ?? sectionsToCheck[0];
    const introText = intro?.body.join(" ") ?? "";
    const hasThesis = /(thesis|argument|hypothesis|research question)/i.test(
      introText
    );
    const hasConclusion = sectionsToCheck.some((section) =>
      /conclusion/i.test(section.title)
    );

    if (!hasThesis) {
      notes.push("Add a clear thesis statement in your opening section.");
    }
    if (!hasConclusion) {
      notes.push("Include a conclusion section to synthesize your argument.");
    }
    if (docStats && docStats.words < 500) {
      notes.push("Draft is short; expand analysis and add supporting evidence.");
    }
    if (citationAudit && citationAudit.totalSources === 0) {
      notes.push("Add scholarly sources to support key claims.");
    }
    if (citationAudit && citationAudit.missingSources.length > 0) {
      notes.push("Some sources are missing in-text citations.");
    }

    if (notes.length === 0) {
      notes.push("Structure looks strong. Focus on clarity and flow.");
    }

    return notes;
  })();

  const missingCitationPreview = citationAudit
    ? citationAudit.missingSources
        .slice(0, 2)
        .map((source) => source.title || source.authors[0] || "Untitled source")
    : [];

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
          <div className="editor-toolbar-left">
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
          <div className="editor-toolbar-right">
            <div className={`save-status ${isDirty ? "dirty" : ""}`}>
              <span>{saveStatus}</span>
              <span>{savedTimeLabel}</span>
            </div>
            <button className="save-btn" type="button" onClick={handleSave}>
              💾 Save Changes
            </button>
          </div>
        </div>

        {editorMode === "structured" ? (
          <>
            <div className="editor-header" id="editor-top">
          <input
            id="editor-title"
            type="text"
            className="editor-title"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              setIsDirty(true);
            }}
            onFocus={(event) => {
              lastFocusRef.current = { type: "title", element: event.currentTarget };
            }}
            placeholder="Document Title"
          />
          <input
            id="editor-subtitle"
            type="text"
            className="editor-subtitle"
            value={subtitle}
            onChange={(e) => {
              setSubtitle(e.target.value);
              setIsDirty(true);
            }}
            onFocus={(event) => {
              lastFocusRef.current = { type: "subtitle", element: event.currentTarget };
            }}
            placeholder="Subtitle (optional)"
          />
          {showFormatLock ? (
            <div className="format-lock-row">
              <div className="format-lock">
                <span className="format-lock-label">Format Lock</span>
                <strong>{formatLockLabel}</strong>
                <span className="format-lock-meta">{formatLockSummary}</span>
              </div>
            </div>
          ) : null}
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
                      onFocus={(event) => {
                        lastFocusRef.current = {
                          type: "metadata",
                          key,
                          element: event.currentTarget,
                        };
                      }}
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
                      onFocus={(event) => {
                        lastFocusRef.current = {
                          type: "section-title",
                          sectionId: section.id,
                          element: event.currentTarget,
                        };
                      }}
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
                          onFocus={(event) => {
                            lastFocusRef.current = {
                              type: "paragraph",
                              sectionId: section.id,
                              index: idx,
                              element: event.currentTarget,
                            };
                          }}
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
            {showFormatLock ? (
              <div className="format-lock-row">
                <div className="format-lock">
                  <span className="format-lock-label">Format Lock</span>
                  <strong>{formatLockLabel}</strong>
                  <span className="format-lock-meta">{formatLockSummary}</span>
                </div>
              </div>
            ) : null}
            <textarea
              className="editor-markdown-textarea"
              ref={markdownTextareaRef}
              value={markdownDraft}
              onChange={(event) => {
                setMarkdownDraft(event.target.value);
                setIsDirty(true);
              }}
              onFocus={(event) => {
                lastFocusRef.current = { type: "markdown", element: event.currentTarget };
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
                onReset={handleResetFormat}
                onSaveDefaults={onSaveDefaults}
                compact={true}
              />
            </div>
            {citationAudit && citationAudit.totalSources > 0 ? (
              <div
                className={`editor-alert ${
                  citationAudit.missingSources.length > 0 ? "warning" : "ok"
                }`}
              >
                <strong>Citation check</strong>
                <span>
                  {citationAudit.missingSources.length > 0
                    ? `${citationAudit.missingSources.length} source${
                        citationAudit.missingSources.length === 1 ? "" : "s"
                      } missing in-text citations.`
                    : "All saved sources appear in the text."}
                </span>
                {missingCitationPreview.length > 0 ? (
                  <span className="editor-alert-detail">
                    Missing: {missingCitationPreview.join(", ")}
                  </span>
                ) : null}
              </div>
            ) : null}
            <div className="editor-notes-panel">
              <h4>Professor Notes</h4>
              <ul>
                {professorNotes.map((note) => (
                  <li key={note}>{note}</li>
                ))}
              </ul>
            </div>
            {renderSourcesPanel(true)}
          </div>
        )}
      </div>

      {editorMode === "structured" ? (
        <div className="editor-sidebar editor-sidebar-right">
          <button className="save-btn" onClick={handleSave}>
            💾 Save Changes
          </button>
          {citationAudit && citationAudit.totalSources > 0 ? (
            <div
              className={`editor-alert ${
                citationAudit.missingSources.length > 0 ? "warning" : "ok"
              }`}
            >
              <strong>Citation check</strong>
              <span>
                {citationAudit.missingSources.length > 0
                  ? `${citationAudit.missingSources.length} source${
                      citationAudit.missingSources.length === 1 ? "" : "s"
                    } missing in-text citations.`
                  : "All saved sources appear in the text."}
              </span>
              {missingCitationPreview.length > 0 ? (
                <span className="editor-alert-detail">
                  Missing: {missingCitationPreview.join(", ")}
                </span>
              ) : null}
            </div>
          ) : null}
          <div className="editor-format-panel">
            <h4>Formatting</h4>
            <FormatControls
              format={format}
              onChange={(nextFormat) => {
                setFormat(nextFormat);
                setIsDirty(true);
              }}
              onReset={handleResetFormat}
              onSaveDefaults={onSaveDefaults}
              compact={true}
            />
          </div>
          {renderSourcesPanel(false)}
          <div className="editor-notes-panel">
            <h4>Professor Notes</h4>
            <ul>
              {professorNotes.map((note) => (
                <li key={note}>{note}</li>
              ))}
            </ul>
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
