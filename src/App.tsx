import { useEffect, useMemo, useRef, useState } from "react";
import { DocumentRenderer } from "./renderer/DocumentRenderer";
import { DocumentEditor, type DocumentEditorHandle } from "./components/DocumentEditor";
import { StartScreen } from "./components/StartScreen";
import { ShareModal } from "./components/ShareModal";
import { MobilePreviewModal } from "./components/MobilePreviewModal";
import { FormatModal } from "./components/FormatModal";
import { SearchPanel } from "./components/SearchPanel";
import type { Document, DocumentFormat, Source } from "./models/DocumentSchema";
import type { ScholarResult } from "./models/Scholar";
import {
  defaultSearchScope,
  type SearchResult,
  type SearchScope,
} from "./models/Search";
import { importDocumentFromFile } from "./utils/importers";
import { exportToPdf } from "./utils/export";
import { hashDocument } from "./utils/hash";
import { useAutoSave, loadAutoSavedDocument } from "./hooks/useAutoSave";
import {
  getSharedDocumentFromUrl,
} from "./utils/share";
import {
  loadSavedFormatDefaults,
  resolveFormat,
  saveFormatDefaults,
} from "./utils/formatting";
import { replaceInDocument } from "./utils/search";
import { fetchScholarResults } from "./utils/scholar";
import { calculateDocumentStats } from "./utils/documentStats";
import { PaperScoreModal } from "./components/PaperScoreModal";
import { TrustCenterModal } from "./components/TrustCenterModal";
import { quickstartGuide } from "./documents/quickstartGuide";

export default function App() {
  const sharedDoc = getSharedDocumentFromUrl();
  const initialDoc = sharedDoc ?? null;

  const [doc, setDoc] = useState<Document | null>(initialDoc);
  const [resumeDoc, setResumeDoc] = useState<Document | null>(() =>
    sharedDoc ? null : loadAutoSavedDocument()
  );
  const [history, setHistory] = useState<Document[]>(() =>
    initialDoc ? [initialDoc] : []
  );
  const [historyIndex, setHistoryIndex] = useState(initialDoc ? 0 : -1);
  const [editMode, setEditMode] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showFormatModal, setShowFormatModal] = useState(false);
  const [showMobilePreview, setShowMobilePreview] = useState(false);
  const [showScoreModal, setShowScoreModal] = useState(false);
  const [showTrustCenter, setShowTrustCenter] = useState(false);
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [printHash, setPrintHash] = useState<string>("");
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [formatModalValue, setFormatModalValue] = useState<DocumentFormat | null>(
    null
  );
  const [savedFormatDefaults, setSavedFormatDefaults] =
    useState<DocumentFormat | null>(() => loadSavedFormatDefaults());
  const [showSearchPanel, setShowSearchPanel] = useState(false);
  const [showHelpAssistant, setShowHelpAssistant] = useState(false);
  const [findQuery, setFindQuery] = useState("");
  const [replaceValue, setReplaceValue] = useState("");
  const [searchScope, setSearchScope] = useState<SearchScope>(defaultSearchScope);
  const [scholarQuery, setScholarQuery] = useState("");
  const [scholarResults, setScholarResults] = useState<ScholarResult[]>([]);
  const [scholarStatus, setScholarStatus] = useState<"idle" | "loading" | "error">(
    "idle"
  );
  const [scholarError, setScholarError] = useState<string | null>(null);
  const [selectedScholarId, setSelectedScholarId] = useState<string | null>(null);

  const historyRef = useRef(history);
  const historyIndexRef = useRef(historyIndex);
  const editorRef = useRef<DocumentEditorHandle | null>(null);
  const importInputRef = useRef<HTMLInputElement | null>(null);
  const scholarRequestRef = useRef(0);

  const searchResults = useMemo<SearchResult[]>(() => {
    const trimmedQuery = findQuery.trim();
    if (!doc || !trimmedQuery) {
      return [];
    }

    const normalized = trimmedQuery.toLowerCase();
    const results: SearchResult[] = [];
    const addResult = (result: SearchResult) => {
      if (results.length < 20) {
        results.push(result);
      }
    };

    if (searchScope.title) {
      if (doc.title.toLowerCase().includes(normalized)) {
        addResult({
          sectionId: "document-top",
          title: "Document Title",
          snippet: doc.title,
          matchType: "title",
        });
      }
      if (doc.subtitle && doc.subtitle.toLowerCase().includes(normalized)) {
        addResult({
          sectionId: "document-top",
          title: "Subtitle",
          snippet: doc.subtitle,
          matchType: "title",
        });
      }
    }

    if (searchScope.metadata) {
      Object.entries(doc.metadata).forEach(([key, value]) => {
        if (results.length >= 20) {
          return;
        }
        const combined = `${key} ${value}`.toLowerCase();
        if (combined.includes(normalized)) {
          addResult({
            sectionId: "document-top",
            title: `Metadata: ${key}`,
            snippet: value,
            matchType: "metadata",
          });
        }
      });
    }

    doc.sections.forEach((section) => {
      if (results.length >= 20) {
        return;
      }

      if (searchScope.title) {
        const titleMatch = section.title.toLowerCase().includes(normalized);
        if (titleMatch) {
          addResult({
            sectionId: section.id,
            title: section.title,
            snippet: section.title,
            matchType: "title",
          });
        }
      }

      if (!searchScope.body || results.length >= 20) {
        return;
      }

      const checkLine = (line: string) => {
        const normalizedLine = line.replace(/\s+/g, " ").trim();
        if (!normalizedLine) {
          return false;
        }
        const lineLower = normalizedLine.toLowerCase();
        if (lineLower.includes(normalized)) {
          const matchIndex = lineLower.indexOf(normalized);
          const start = Math.max(matchIndex - 40, 0);
          const end = Math.min(
            matchIndex + normalized.length + 60,
            normalizedLine.length
          );
          addResult({
            sectionId: section.id,
            title: section.title,
            snippet: normalizedLine.slice(start, end),
            matchType: "body",
          });
          return true;
        }
        return false;
      };

      for (const paragraph of section.body) {
        if (checkLine(paragraph)) {
          break;
        }
      }

      if (section.monoBlocks?.length) {
        for (const block of section.monoBlocks) {
          if (checkLine(block)) {
            break;
          }
        }
      }
    });

    return results;
  }, [doc, findQuery, searchScope]);

  const docStats = useMemo(() => {
    if (!doc) {
      return null;
    }
    const format = resolveFormat(doc);
    return calculateDocumentStats(doc, format.lineHeight ?? 1.5);
  }, [doc]);

  const appActions = useMemo(
    () => [
      { id: "home", label: "Home", description: "Start screen" },
      {
        id: "back",
        label: "Back",
        description: "Previous state",
        disabled: historyIndex <= 0,
      },
      {
        id: "forward",
        label: "Forward",
        description: "Next state",
        disabled: historyIndex >= history.length - 1,
      },
      {
        id: "edit",
        label: editMode ? "View Mode" : "Edit Mode",
        description: editMode ? "Return to viewer" : "Open editor",
      },
      { id: "format", label: "Format", description: "Fonts & spacing" },
      { id: "mobile", label: "Mobile Preview", description: "Device frame" },
      { id: "share", label: "Share", description: "Link + email" },
      { id: "trust", label: "Trust Center", description: "Integrity tools" },
      { id: "import", label: "Import", description: "PDF, DOCX, Markdown" },
      { id: "export", label: "Export PDF", description: "Print-ready" },
      {
        id: "theme",
        label: theme === "dark" ? "Light Mode" : "Dark Mode",
        description: "Toggle theme",
      },
    ],
    [editMode, history.length, historyIndex, theme]
  );

  // Auto-save document
  useAutoSave(doc);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  useEffect(() => {
    historyRef.current = history;
  }, [history]);

  useEffect(() => {
    historyIndexRef.current = historyIndex;
  }, [historyIndex]);

  useEffect(() => {
    if (!doc) {
      setResumeDoc(loadAutoSavedDocument());
    }
  }, [doc]);

  useEffect(() => {
    if (!scholarQuery.trim()) {
      setScholarResults([]);
      setScholarStatus("idle");
      setScholarError(null);
      setSelectedScholarId(null);
      return;
    }

    const timeout = window.setTimeout(() => {
      runScholarSearch(scholarQuery);
    }, 500);

    return () => window.clearTimeout(timeout);
  }, [scholarQuery]);

  const pushHistory = (nextDoc: Document) => {
    setHistory((prev) => {
      const baseIndex = Math.max(historyIndexRef.current, -1);
      const trimmed = prev.slice(0, baseIndex + 1);
      trimmed.push(nextDoc);
      return trimmed;
    });
    setHistoryIndex((prev) => Math.max(prev, historyIndexRef.current) + 1);
  };

  const applyDocument = (nextDoc: Document, fromHistory: boolean = false) => {
    setDoc(nextDoc);
    if (!fromHistory) {
      pushHistory(nextDoc);
    }
  };

  const applySavedFormatDefaults = (nextDoc: Document) => {
    if (!savedFormatDefaults) {
      return nextDoc;
    }
    const preset = nextDoc.format?.preset;
    if (preset && preset !== "default" && preset !== "custom") {
      return nextDoc;
    }
    const overrides = { ...(nextDoc.format ?? {}) };
    if (!preset || preset === "default" || preset === "custom") {
      delete overrides.preset;
    }
    return {
      ...nextDoc,
      format: {
        ...savedFormatDefaults,
        ...overrides,
      },
    };
  };

  const goToHistory = (index: number) => {
    const entry = historyRef.current[index];
    if (!entry) {
      return;
    }
    setDoc(entry);
    setHistoryIndex(index);
  };

  const notifySaveError = () => {
    setStatus("Fix errors before leaving.");
    setTimeout(() => setStatus(null), 3000);
  };

  const handleToggleEditMode = () => {
    if (editMode) {
      const success = editorRef.current?.save();
      if (success === false) {
        notifySaveError();
        return;
      }
      setHasUnsavedChanges(false);
      setEditMode(false);
    } else {
      setEditMode(true);
    }
  };

  const openFormatModal = () => {
    if (!doc) {
      return;
    }
    if (editMode) {
      const editorFormat = editorRef.current?.getFormat();
      setFormatModalValue(editorFormat ?? resolveFormat(doc));
    } else {
      setFormatModalValue(resolveFormat(doc));
    }
    setShowFormatModal(true);
  };

  const handleFormatChange = (nextFormat: DocumentFormat) => {
    if (!doc) {
      return;
    }
    setFormatModalValue(nextFormat);
    if (editMode) {
      editorRef.current?.setFormat(nextFormat);
      setHasUnsavedChanges(true);
      return;
    }
    applyDocument({
      ...doc,
      format: nextFormat,
    });
  };

  const requestSafeNavigation = (action: () => void) => {
    if (!editMode || !hasUnsavedChanges) {
      action();
      return;
    }

    const shouldSave = window.confirm(
      "You have unsaved changes. Save before leaving?"
    );
    if (shouldSave) {
      const success = editorRef.current?.save();
      if (success === false) {
        notifySaveError();
        return;
      }
      setHasUnsavedChanges(false);
      action();
      return;
    }

    const discard = window.confirm("Discard changes and continue?");
    if (!discard) {
      return;
    }

    setHasUnsavedChanges(false);
    action();
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const processImport = async () => {
      setStatus(`Importing ${file.name}...`);

      try {
        const result = await importDocumentFromFile(file);
        applyDocument(applySavedFormatDefaults(result.document));
        if (result.warnings.length > 0) {
          setStatus(result.warnings.join(" "));
        } else {
          setStatus(`Imported ${result.source}.`);
        }
      } catch (error) {
        setStatus(
          error instanceof Error
            ? error.message
            : "Import failed. Check the file format."
        );
      } finally {
        event.target.value = "";
      }
    };

    requestSafeNavigation(processImport);
  };

  const handleExportPdf = async () => {
    if (!doc) return;

    try {
      const hash = await hashDocument(doc);
      setPrintHash(hash);
      requestAnimationFrame(() => {
        exportToPdf(doc.title, () => setPrintHash(""));
      });
    } catch {
      setPrintHash("");
      exportToPdf(doc.title);
    }
  };

  const upsertSource = (current: Source[], source: Source) => {
    const exists = current.some(
      (item) =>
        item.id === source.id || (item.title === source.title && item.year === source.year)
    );
    if (exists) {
      return current;
    }
    return [...current, source];
  };

  const handleSaveSource = (source: Source) => {
    if (!doc) {
      return;
    }
    if (editMode && editorRef.current) {
      editorRef.current.addSource(source);
      setHasUnsavedChanges(true);
      setStatus("Source saved.");
      setTimeout(() => setStatus(null), 2000);
      return;
    }
    applyDocument({
      ...doc,
      sources: upsertSource(doc.sources ?? [], source),
    });
    setStatus("Source saved.");
    setTimeout(() => setStatus(null), 2000);
  };

  const handleRemoveSource = (sourceId: string) => {
    if (!doc) {
      return;
    }
    if (editMode && editorRef.current) {
      editorRef.current.removeSource(sourceId);
      setHasUnsavedChanges(true);
      return;
    }
    applyDocument({
      ...doc,
      sources: (doc.sources ?? []).filter((source) => source.id !== sourceId),
    });
  };

  const handleInsertCitation = (source: Source) => {
    if (!editMode || !editorRef.current) {
      setStatus("Open Edit mode and click inside your text to insert a citation.");
      setTimeout(() => setStatus(null), 2500);
      return;
    }
    const inserted = editorRef.current.insertCitation(source);
    if (!inserted) {
      setStatus("Click inside your text first, then try again.");
      setTimeout(() => setStatus(null), 2500);
    }
  };

  const handleInsertReference = (source: Source) => {
    if (!editMode || !editorRef.current) {
      setStatus("Open Edit mode to insert references.");
      setTimeout(() => setStatus(null), 2500);
      return;
    }
    editorRef.current.insertReference(source);
  };

  const handleDocSave = (updatedDoc: Document) => {
    applyDocument(updatedDoc);
    setStatus("Document saved!");
    setTimeout(() => setStatus(null), 2000);
  };

  const handleSaveDefaultFormat = (format: DocumentFormat) => {
    saveFormatDefaults(format);
    setSavedFormatDefaults(format);
    setStatus("Default format saved.");
    setTimeout(() => setStatus(null), 2000);
  };

  const handleBack = () => {
    if (historyIndexRef.current <= 0) {
      return;
    }
    requestSafeNavigation(() => goToHistory(historyIndexRef.current - 1));
  };

  const handleForward = () => {
    if (historyIndexRef.current >= historyRef.current.length - 1) {
      return;
    }
    requestSafeNavigation(() => goToHistory(historyIndexRef.current + 1));
  };

  const handleOpenImport = () => {
    importInputRef.current?.click();
  };

  const handleReplace = (replaceAll: boolean) => {
    if (!doc) {
      return;
    }
    if (!findQuery.trim()) {
      setStatus("Enter a search term first.");
      setTimeout(() => setStatus(null), 2000);
      return;
    }

    let count = 0;
    if (editMode && editorRef.current) {
      count = replaceAll
        ? editorRef.current.replaceAll(findQuery, replaceValue, searchScope)
        : editorRef.current.replaceNext(findQuery, replaceValue, searchScope);
    } else {
      const result = replaceInDocument(
        doc,
        findQuery,
        replaceValue,
        searchScope,
        replaceAll
      );
      count = result.count;
      if (count > 0) {
        applyDocument(result.doc);
      }
    }

    setStatus(
      count > 0
        ? `Replaced ${count} occurrence${count === 1 ? "" : "s"}.`
        : "No matches found."
    );
    setTimeout(() => setStatus(null), 2000);
  };

  const handleAppAction = (actionId: string) => {
    switch (actionId) {
      case "home":
        requestSafeNavigation(() => {
          setDoc(null);
          setEditMode(false);
        });
        break;
      case "back":
        handleBack();
        break;
      case "forward":
        handleForward();
        break;
      case "edit":
        handleToggleEditMode();
        break;
      case "share":
        setShowShareModal(true);
        break;
      case "trust":
        setShowTrustCenter(true);
        break;
      case "format":
        openFormatModal();
        break;
      case "mobile":
        setShowMobilePreview(true);
        break;
      case "theme":
        setTheme(theme === "dark" ? "light" : "dark");
        break;
      case "export":
        handleExportPdf();
        break;
      case "import":
        handleOpenImport();
        break;
      default:
        break;
    }
  };

  const handleSearchNavigate = (sectionId: string) => {
    if (sectionId === "document-top") {
      const topTarget = editMode
        ? document.getElementById("editor-top")
        : document.getElementById("document-top");
      if (topTarget) {
        topTarget.scrollIntoView({ behavior: "smooth", block: "start" });
        return;
      }
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    const editorTarget = document.getElementById(`editor-section-${sectionId}`);
    const viewTarget = document.getElementById(`section-${sectionId}`);
    const target = editorTarget ?? viewTarget;
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const runScholarSearch = async (query: string) => {
    const trimmedQuery = query.trim();
    if (!trimmedQuery) {
      setScholarResults([]);
      setScholarStatus("idle");
      setScholarError(null);
      setSelectedScholarId(null);
      return;
    }

    const requestId = scholarRequestRef.current + 1;
    scholarRequestRef.current = requestId;

    if (!query) {
      return;
    }
    setScholarStatus("loading");
    setScholarError(null);
    setSelectedScholarId(null);
    setScholarResults([]);
    try {
      const results = await fetchScholarResults(trimmedQuery);
      if (scholarRequestRef.current !== requestId) {
        return;
      }
      setScholarResults(results);
      setScholarStatus("idle");
      setSelectedScholarId(results[0]?.id ?? null);
    } catch (error) {
      if (scholarRequestRef.current !== requestId) {
        return;
      }
      setScholarStatus("error");
      setScholarError(error instanceof Error ? error.message : "Search failed.");
    }
  };

  const handleScholarSearch = async () => {
    await runScholarSearch(scholarQuery);
  };

  if (!doc) {
    return (
      <div className="app-shell">
        <div className="toolbar">
          <div className="toolbar-left">
            <button
              className="brand brand-button"
              type="button"
              onClick={() => setDoc(null)}
            >
              Paper Perfector
            </button>
            {resumeDoc ? (
              <button
                className="toolbar-button toolbar-resume"
                type="button"
                onClick={() => applyDocument(resumeDoc)}
              >
                ↩️ Resume
              </button>
            ) : null}
          </div>
          <div className="toolbar-actions">
            <button
              className="toolbar-button"
              type="button"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            >
              {theme === "dark" ? "☀️ Light" : "🌙 Dark"} Mode
            </button>
          </div>
        </div>
        <StartScreen
          onSelectDocument={(nextDoc) =>
            applyDocument(applySavedFormatDefaults(nextDoc))
          }
          onImport={handleImport}
          onThemeChange={setTheme}
        />
      </div>
    );
  }

  return (
    <div className="app-shell">
      <div className="toolbar">
        <div className="toolbar-left">
          <button
            className="brand brand-button"
            type="button"
            onClick={() => {
              requestSafeNavigation(() => {
                setDoc(null);
                setEditMode(false);
              });
            }}
          >
            Paper Perfector
          </button>
          <button
            className="toolbar-button toolbar-nav"
            type="button"
            onClick={handleBack}
            disabled={historyIndex <= 0}
            title="Back"
          >
            ← Back
          </button>
          <button
            className="toolbar-button toolbar-nav"
            type="button"
            onClick={handleForward}
            disabled={historyIndex >= history.length - 1}
            title="Forward"
          >
            Forward →
          </button>
          <button
            className="toolbar-button toolbar-nav"
            type="button"
            onClick={() => setShowSearchPanel(true)}
          >
            🔍 Search
          </button>
        </div>
        <div className="toolbar-actions">
          <button
            className="toolbar-button toolbar-home toolbar-nav"
            type="button"
            onClick={() => {
              requestSafeNavigation(() => {
                setDoc(null);
                setEditMode(false);
              });
            }}
            title="Back to start screen"
          >
            Home
          </button>
          <label className="file-upload">
            Import
            <input
              ref={importInputRef}
              type="file"
              accept="text/html,.html,.htm,application/pdf,.pdf,image/*,text/markdown,.md,text/plain,.txt,application/vnd.openxmlformats-officedocument.wordprocessingml.document,.docx,.doc"
              onChange={handleImport}
            />
          </label>
          <button
            className="toolbar-button"
            type="button"
            onClick={() => setShowShareModal(true)}
            title="Share this document"
          >
            🔗 Share
          </button>
          <button
            className={`toolbar-button ${editMode ? "active" : ""}`}
            type="button"
            onClick={handleToggleEditMode}
          >
            {editMode ? "👁️ View" : "✏️ Edit"}
          </button>
          <button
            className="toolbar-button"
            type="button"
            onClick={openFormatModal}
          >
            Aa Format
          </button>
          <button
            className="toolbar-button"
            type="button"
            onClick={() => setShowScoreModal(true)}
          >
            🎓 Score
          </button>
          <button
            className="toolbar-button"
            type="button"
            onClick={() => setShowTrustCenter(true)}
          >
            🛡️ Trust
          </button>
          <button
            className="toolbar-button"
            type="button"
            onClick={() => setShowMobilePreview(true)}
          >
            📱 Mobile
          </button>
          <button
            className="toolbar-button"
            type="button"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          >
            {theme === "dark" ? "☀️ Light" : "🌙 Dark"} Mode
          </button>
          <button
            className="toolbar-button"
            type="button"
            onClick={handleExportPdf}
          >
            📥 Export PDF
          </button>
        </div>
      </div>
      {status ? <div className="status">{status}</div> : null}
      {docStats ? (
        <div className="document-stats">
          <span>Words: {docStats.words.toLocaleString()}</span>
          <span>Characters: {docStats.characters.toLocaleString()}</span>
          <span>Pages (est.): {docStats.pages}</span>
          <span>Read time: {docStats.readMinutes} min</span>
        </div>
      ) : null}
      {editMode ? (
        <DocumentEditor
          ref={editorRef}
          doc={doc}
          onSave={handleDocSave}
          onDirtyChange={setHasUnsavedChanges}
          onSaveDefaults={handleSaveDefaultFormat}
        />
      ) : (
        <DocumentRenderer
          doc={doc}
          printHash={printHash || undefined}
          highlightQuery={findQuery}
          highlightScope={searchScope}
        />
      )}
      {showShareModal && doc ? (
        <ShareModal doc={doc} onClose={() => setShowShareModal(false)} />
      ) : null}
      {showFormatModal && formatModalValue ? (
        <FormatModal
          format={formatModalValue}
          onChange={handleFormatChange}
          onClose={() => setShowFormatModal(false)}
        />
      ) : null}
      {showMobilePreview && doc ? (
        <MobilePreviewModal doc={doc} onClose={() => setShowMobilePreview(false)} />
      ) : null}
      {showSearchPanel && doc ? (
        <SearchPanel
          findQuery={findQuery}
          onFindQueryChange={setFindQuery}
          replaceValue={replaceValue}
          onReplaceValueChange={setReplaceValue}
          searchScope={searchScope}
          onSearchScopeChange={setSearchScope}
          searchResults={searchResults}
          onNavigate={handleSearchNavigate}
          scholarQuery={scholarQuery}
          onScholarQueryChange={setScholarQuery}
          onScholarSearch={handleScholarSearch}
          scholarResults={scholarResults}
          scholarStatus={scholarStatus}
          scholarError={scholarError}
          selectedScholarId={selectedScholarId}
          onSelectScholar={setSelectedScholarId}
          savedSources={doc.sources ?? []}
          onSaveSource={handleSaveSource}
          onInsertCitation={handleInsertCitation}
          onInsertReference={handleInsertReference}
          onRemoveSource={handleRemoveSource}
          canInsert={editMode}
          onReplaceNext={() => handleReplace(false)}
          onReplaceAll={() => handleReplace(true)}
          actions={appActions}
          onAction={handleAppAction}
          onClose={() => setShowSearchPanel(false)}
        />
      ) : null}
      {showScoreModal && doc ? (
        <PaperScoreModal doc={doc} onClose={() => setShowScoreModal(false)} />
      ) : null}
      {showTrustCenter && doc ? (
        <TrustCenterModal doc={doc} onClose={() => setShowTrustCenter(false)} />
      ) : null}
      {doc ? (
        <div className={`start-assistant ${showHelpAssistant ? "open" : ""}`}>
          {showHelpAssistant ? (
            <div className="assistant-panel">
              <div className="assistant-header">
                <div>
                  <strong>Paper Guide</strong>
                  <span>What do you need right now?</span>
                </div>
                <button
                  className="assistant-close"
                  type="button"
                  onClick={() => setShowHelpAssistant(false)}
                  aria-label="Close guide"
                >
                  ✕
                </button>
              </div>
              <div className="assistant-actions">
                <button type="button" onClick={() => setShowScoreModal(true)}>
                  Score my paper
                </button>
                <button
                  type="button"
                  onClick={() =>
                    requestSafeNavigation(() => applyDocument(quickstartGuide))
                  }
                >
                  Open Quickstart Guide
                </button>
                <button type="button" onClick={() => setShowTrustCenter(true)}>
                  Trust Center
                </button>
                <button type="button" onClick={openFormatModal}>
                  Adjust format & spacing
                </button>
                <button
                  type="button"
                  onClick={() => setEditMode((prev) => !prev)}
                >
                  {editMode ? "Switch to view" : "Open editor"}
                </button>
                <button type="button" onClick={handleExportPdf}>
                  Export PDF
                </button>
              </div>
            </div>
          ) : null}
          <button
            className="assistant-toggle"
            type="button"
            onClick={() => setShowHelpAssistant((prev) => !prev)}
          >
            Need help?
          </button>
        </div>
      ) : null}
    </div>
  );
}
