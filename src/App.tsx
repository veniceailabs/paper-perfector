import { useEffect, useMemo, useRef, useState } from "react";
import { DocumentRenderer } from "./renderer/DocumentRenderer";
import { DocumentEditor, type DocumentEditorHandle } from "./components/DocumentEditor";
import { StartScreen } from "./components/StartScreen";
import { ShareModal } from "./components/ShareModal";
import { MobilePreviewModal } from "./components/MobilePreviewModal";
import { FormatModal } from "./components/FormatModal";
import { ExportChecklistModal } from "./components/ExportChecklistModal";
import { HoverTip } from "./components/HoverTip";
import { SearchPanel } from "./components/SearchPanel";
import { HistoryModal } from "./components/HistoryModal";
import { PdfImportDebugger } from "./components/debug/PdfImportDebugger";
import type { Document, DocumentFormat, Source } from "./models/DocumentSchema";
import type { ScholarResult } from "./models/Scholar";
import {
  defaultSearchOptions,
  defaultSearchScope,
  type SearchOptions,
  type SearchResult,
  type SearchScope,
} from "./models/Search";
import { importDocumentFromFile } from "./utils/importers";
import { exportToPdf } from "./utils/export";
import { hashDocument } from "./utils/hash";
import { openFeedbackEmail } from "./utils/feedback";
import { useAutoSave, loadAutoSavedDocument } from "./hooks/useAutoSave";
import {
  getSharedDocumentFromUrl,
} from "./utils/share";
import { downloadTextFile } from "./utils/download";
import { createId } from "./utils/id";
import type { SavedDocument } from "./utils/library";
import {
  deleteDocumentFromLibrary,
  loadLibrary,
  saveDocumentToLibrary,
} from "./utils/library";
import { loadLastDraft, type DraftPayload } from "./utils/draft";
import {
  loadSavedFormatDefaults,
  resolveFormat,
  saveFormatDefaults,
} from "./utils/formatting";
import {
  buildSearchRegex,
  replaceInDocument,
  replaceNextInDocument,
  type ReplaceCursor,
} from "./utils/search";
import { fetchScholarResults } from "./utils/scholar";
import { calculateDocumentStats } from "./utils/documentStats";
import { PaperScoreModal } from "./components/PaperScoreModal";
import { TrustCenterModal } from "./components/TrustCenterModal";
import { quickstartGuide } from "./documents/quickstartGuide";
import { serializePaperDoc } from "./utils/paperDoc";
import {
  IconDebug,
  IconDraft,
  IconEdit,
  IconExport,
  IconHistory,
  IconIntegrity,
  IconLightbulb,
  IconMobile,
  IconMoon,
  IconResume,
  IconSave,
  IconScore,
  IconSearch,
  IconShare,
  IconSun,
  IconView,
} from "./components/icons/CustomIcons";
import {
  getLastPdfImportDebugPages,
  type PdfImportDebugPage,
} from "./utils/pdfImport";

export default function App() {
  const sharedDoc = getSharedDocumentFromUrl();
  const initialDoc = sharedDoc ?? null;

  const [doc, setDoc] = useState<Document | null>(initialDoc);
  const [docId, setDocId] = useState<string | null>(() =>
    initialDoc ? createId("doc") : null
  );
  const [resumeDoc, setResumeDoc] = useState<Document | null>(() =>
    sharedDoc ? null : loadAutoSavedDocument()
  );
  const [resumeDraft, setResumeDraft] = useState<DraftPayload | null>(() =>
    sharedDoc ? null : loadLastDraft()
  );
  const [history, setHistory] = useState<Document[]>(() =>
    initialDoc ? [initialDoc] : []
  );
  const [historyIndex, setHistoryIndex] = useState(initialDoc ? 0 : -1);
  const [editMode, setEditMode] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showFormatModal, setShowFormatModal] = useState(false);
  const [showExportChecklist, setShowExportChecklist] = useState(false);
  const [showMobilePreview, setShowMobilePreview] = useState(false);
  const [showScoreModal, setShowScoreModal] = useState(false);
  const [showTrustCenter, setShowTrustCenter] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [tipsEnabled, setTipsEnabled] = useState(() => {
    try {
      const saved = localStorage.getItem("paper-perfector-tips");
      return saved ? saved === "true" : true;
    } catch {
      return true;
    }
  });
  const [printHash, setPrintHash] = useState<string>("");
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [formatModalValue, setFormatModalValue] = useState<DocumentFormat | null>(
    null
  );
  const [savedFormatDefaults, setSavedFormatDefaults] =
    useState<DocumentFormat | null>(() => loadSavedFormatDefaults());
  const [showSearchPanel, setShowSearchPanel] = useState(false);
  const [showHelpAssistant, setShowHelpAssistant] = useState(false);
  const [pdfDebugEnabled, setPdfDebugEnabled] = useState(false);
  const [showPdfDebugModal, setShowPdfDebugModal] = useState(false);
  const [pdfDebugPages, setPdfDebugPages] = useState<PdfImportDebugPage[]>([]);
  const [pdfDebugPageIndex, setPdfDebugPageIndex] = useState(0);
  const [findQuery, setFindQuery] = useState("");
  const [replaceValue, setReplaceValue] = useState("");
  const [replaceCursor, setReplaceCursor] = useState<ReplaceCursor | null>(null);
  const [searchScope, setSearchScope] = useState<SearchScope>(defaultSearchScope);
  const [searchOptions, setSearchOptions] =
    useState<SearchOptions>(defaultSearchOptions);
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
  const toolbarMenuRef = useRef<HTMLDivElement | null>(null);
  const replaceSignatureRef = useRef<string>("");
  const [showToolbarMenu, setShowToolbarMenu] = useState(false);
  const [library, setLibrary] = useState<SavedDocument[]>(() => loadLibrary());

  const trimmedFindQuery = findQuery.trim();
  const compiledSearchRegex = useMemo(
    () => buildSearchRegex(trimmedFindQuery, searchOptions),
    [trimmedFindQuery, searchOptions]
  );
  const isInvalidRegex =
    searchOptions.useRegex && trimmedFindQuery.length > 0 && !compiledSearchRegex;

  const searchResults = useMemo<SearchResult[]>(() => {
    if (!doc || !trimmedFindQuery || !compiledSearchRegex) {
      return [];
    }

    const searchRegex = compiledSearchRegex;
    const results: SearchResult[] = [];
    const addResult = (result: SearchResult) => {
      if (results.length < 20) {
        results.push(result);
      }
    };
    const hasMatch = (text: string) => {
      searchRegex.lastIndex = 0;
      return searchRegex.test(text);
    };
    const getSnippet = (text: string) => {
      const compact = text.replace(/\s+/g, " ").trim();
      if (!compact) {
        return null;
      }
      searchRegex.lastIndex = 0;
      const match = searchRegex.exec(compact);
      if (!match) {
        return null;
      }
      const start = Math.max(match.index - 40, 0);
      const end = Math.min(match.index + match[0].length + 60, compact.length);
      return compact.slice(start, end);
    };

    if (searchScope.title) {
      if (hasMatch(doc.title)) {
        addResult({
          sectionId: "document-top",
          title: "Document Title",
          snippet: doc.title,
          matchType: "title",
        });
      }
      if (doc.subtitle && hasMatch(doc.subtitle)) {
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
        if (hasMatch(`${key} ${value}`)) {
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
        if (hasMatch(section.title)) {
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
        const snippet = getSnippet(line);
        if (!snippet) {
          return false;
        }
        addResult({
          sectionId: section.id,
          title: section.title,
          snippet,
          matchType: "body",
        });
        return true;
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
  }, [compiledSearchRegex, doc, trimmedFindQuery, searchScope]);

  const docStats = useMemo(() => {
    if (!doc) {
      return null;
    }
    const format = resolveFormat(doc);
    return calculateDocumentStats(doc, format.lineHeight ?? 1.5);
  }, [doc]);
  const currentLibraryEntry = useMemo(
    () => (docId ? library.find((entry) => entry.id === docId) ?? null : null),
    [docId, library]
  );

  const refreshLibrary = () => {
    setLibrary(loadLibrary());
  };

  const openDocument = (nextDoc: Document, nextId?: string) => {
    const id = nextId ?? createId("doc");
    setDoc(nextDoc);
    setDocId(id);
    setHistory([nextDoc]);
    setHistoryIndex(0);
    setEditMode(false);
    setHasUnsavedChanges(false);
  };

  const handleResumeDraft = () => {
    if (!resumeDraft) {
      return;
    }
    openDocument(resumeDraft.doc, resumeDraft.docId);
    setEditMode(true);
  };

  const closeDocument = () => {
    setDoc(null);
    setDocId(null);
    setHistory([]);
    setHistoryIndex(-1);
    setEditMode(false);
    setHasUnsavedChanges(false);
    setShowHistoryModal(false);
  };

  const handleSaveToLibrary = () => {
    if (!doc) {
      return;
    }
    const saved = saveDocumentToLibrary(doc, docId ?? undefined);
    setDocId(saved.id);
    refreshLibrary();
    setStatus("Saved to library.");
    setTimeout(() => setStatus(null), 2000);
  };

  const handleExportPaperDoc = (docToExport: Document, docIdToExport?: string) => {
    const fileName = `${docToExport.title.replace(/[/\\?%*:|"<>]/g, "-")}.ppdoc`;
    downloadTextFile(serializePaperDoc(docToExport, docIdToExport), fileName);
  };

  const handleOpenSavedDocument = (entryId: string, versionId?: string) => {
    const entries = loadLibrary();
    const entry = entries.find((item) => item.id === entryId);
    if (!entry) {
      return;
    }
    const versionDoc = versionId
      ? entry.versions.find((version) => version.id === versionId)?.doc
      : null;
    const target = versionDoc ?? entry.doc;
    openDocument(target, entry.id);
  };

  const handleDeleteSavedDocument = (entryId: string) => {
    deleteDocumentFromLibrary(entryId);
    refreshLibrary();
    if (docId === entryId) {
      closeDocument();
    }
  };

  const appActions = useMemo(() => {
    const hasSavedEntry = docId
      ? library.some((entry) => entry.id === docId)
      : false;
    return [
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
      { id: "save-library", label: "Save", description: "Save to library" },
      {
        id: "history",
        label: "History",
        description: "Version history",
        disabled: !hasSavedEntry,
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
      {
        id: "tips",
        label: tipsEnabled ? "Tips Off" : "Tips On",
        description: "Toggle helpful tips",
      },
    ];
  }, [docId, editMode, history.length, historyIndex, library, theme, tipsEnabled]);

  // Auto-save document
  useAutoSave(doc);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  useEffect(() => {
    try {
      localStorage.setItem(
        "paper-perfector-tips",
        tipsEnabled ? "true" : "false"
      );
    } catch {
      // Ignore storage failures.
    }
  }, [tipsEnabled]);

  useEffect(() => {
    historyRef.current = history;
  }, [history]);

  useEffect(() => {
    historyIndexRef.current = historyIndex;
  }, [historyIndex]);

  useEffect(() => {
    if (!doc) {
      setResumeDoc(loadAutoSavedDocument());
      setResumeDraft(loadLastDraft());
      setShowToolbarMenu(false);
      setDocId(null);
    }
  }, [doc]);

  useEffect(() => {
    replaceSignatureRef.current = "";
    setReplaceCursor(null);
  }, [docId, findQuery, replaceValue, searchOptions, searchScope]);

  useEffect(() => {
    if (!showToolbarMenu) {
      return;
    }
    const handleClick = (event: MouseEvent) => {
      if (!toolbarMenuRef.current) {
        return;
      }
      if (!toolbarMenuRef.current.contains(event.target as Node)) {
        setShowToolbarMenu(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setShowToolbarMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [showToolbarMenu]);

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
    const isPdfFile =
      file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");

    const processImport = async () => {
      setStatus(`Importing ${file.name}...`);

      try {
        const result = await importDocumentFromFile(file, {
          pdfDebug: pdfDebugEnabled && isPdfFile,
        });
        openDocument(
          applySavedFormatDefaults(result.document),
          result.docId ?? undefined
        );
        if (pdfDebugEnabled && isPdfFile) {
          const pages = getLastPdfImportDebugPages();
          setPdfDebugPages(pages);
          setPdfDebugPageIndex(0);
          setShowPdfDebugModal(pages.length > 0);
        } else {
          setPdfDebugPages([]);
          setShowPdfDebugModal(false);
        }
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

    if (editMode && hasUnsavedChanges) {
      const shouldSave = window.confirm(
        "Save your latest edits before exporting?"
      );
      if (shouldSave) {
        const success = editorRef.current?.save();
        if (success === false) {
          notifySaveError();
          return;
        }
        setHasUnsavedChanges(false);
      }
    }

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

  const openExportChecklist = () => {
    if (editMode && hasUnsavedChanges) {
      const shouldSave = window.confirm(
        "Save your latest edits before reviewing the export checklist?"
      );
      if (shouldSave) {
        const success = editorRef.current?.save();
        if (success === false) {
          notifySaveError();
          return;
        }
        setHasUnsavedChanges(false);
      }
    }
    setShowExportChecklist(true);
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
    if (isInvalidRegex) {
      setStatus("Invalid regex syntax.");
      setTimeout(() => setStatus(null), 2000);
      return;
    }

    const trimmedQuery = findQuery.trim();
    const signature = JSON.stringify({
      query: trimmedQuery,
      replacement: replaceValue,
      scope: searchScope,
      options: searchOptions,
    });
    if (signature !== replaceSignatureRef.current) {
      replaceSignatureRef.current = signature;
      setReplaceCursor(null);
    }

    let count = 0;
    if (editMode && editorRef.current) {
      count = replaceAll
        ? editorRef.current.replaceAll(
            findQuery,
            replaceValue,
            searchScope,
            searchOptions
          )
        : editorRef.current.replaceNext(
            findQuery,
            replaceValue,
            searchScope,
            searchOptions
          );
    } else {
      if (replaceAll) {
        const result = replaceInDocument(
          doc,
          findQuery,
          replaceValue,
          searchScope,
          true,
          searchOptions
        );
        count = result.count;
        if (count > 0) {
          applyDocument(result.doc);
        }
        setReplaceCursor(null);
      } else {
        const result = replaceNextInDocument(
          doc,
          findQuery,
          replaceValue,
          searchScope,
          replaceCursor,
          searchOptions
        );
        count = result.count;
        if (count > 0) {
          applyDocument(result.doc);
          setReplaceCursor(result.cursor);
        } else {
          setReplaceCursor(null);
        }
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
          closeDocument();
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
      case "save-library":
        handleSaveToLibrary();
        break;
      case "history":
        if (!currentLibraryEntry) {
          setStatus("Save to your library to unlock history.");
          setTimeout(() => setStatus(null), 2000);
          break;
        }
        setShowHistoryModal(true);
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
      case "tips":
        setTipsEnabled((prev) => !prev);
        break;
      case "export":
        openExportChecklist();
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
  const currentPdfDebugPage = pdfDebugPages[pdfDebugPageIndex] ?? null;

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      if ((event.metaKey || event.ctrlKey) && key === "f" && doc) {
        event.preventDefault();
        setShowSearchPanel(true);
        return;
      }
      if ((event.metaKey || event.ctrlKey) && key === "h" && doc) {
        event.preventDefault();
        setShowSearchPanel(true);
        return;
      }
      if (key === "escape") {
        if (showSearchPanel) {
          setShowSearchPanel(false);
        } else if (showToolbarMenu) {
          setShowToolbarMenu(false);
        } else if (showHelpAssistant) {
          setShowHelpAssistant(false);
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [doc, showHelpAssistant, showSearchPanel, showToolbarMenu]);

  if (!doc) {
    return (
      <div className="app-shell">
        <div className="toolbar">
          <div className="toolbar-left">
            <button
              className="brand brand-button"
              type="button"
              onClick={closeDocument}
              data-tip="Return to the Paper Perfector home screen."
            >
              Paper Perfector
            </button>
            {resumeDoc ? (
              <button
                className="toolbar-button toolbar-resume"
                type="button"
                onClick={() => openDocument(resumeDoc)}
                data-tip="Resume your last auto-saved document."
              >
                <span className="icon-inline">
                  <IconResume size={16} />
                  Resume
                </span>
              </button>
            ) : null}
            {resumeDraft ? (
              <button
                className="toolbar-button toolbar-resume"
                type="button"
                onClick={handleResumeDraft}
                data-tip="Resume your latest unsaved draft."
              >
                <span className="icon-inline">
                  <IconDraft size={16} />
                  Draft
                </span>
              </button>
            ) : null}
          </div>
          <div className="toolbar-actions">
            <button
              className="toolbar-button"
              type="button"
              onClick={() => setPdfDebugEnabled((prev) => !prev)}
              data-tip="Capture PDF import geometry for visual debugging."
            >
              <span className="icon-inline">
                <IconDebug size={16} />
                {pdfDebugEnabled ? "Debug PDF On" : "Debug PDF Off"}
              </span>
            </button>
            <button
              className="toolbar-button"
              type="button"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              data-tip="Switch between light and dark background themes."
            >
              <span className="icon-inline">
                {theme === "dark" ? <IconSun size={16} /> : <IconMoon size={16} />}
                {theme === "dark" ? "Light" : "Dark"} Mode
              </span>
            </button>
            <button
              className="toolbar-button"
              type="button"
              onClick={() => setTipsEnabled((prev) => !prev)}
              data-tip="Turn hover tips on or off."
            >
              <span className="icon-inline">
                <IconLightbulb size={16} />
                {tipsEnabled ? "Tips On" : "Tips Off"}
              </span>
            </button>
          </div>
        </div>
      <StartScreen
        onSelectDocument={(nextDoc) =>
          openDocument(applySavedFormatDefaults(nextDoc))
        }
        savedDocuments={library}
        onOpenSavedDocument={handleOpenSavedDocument}
        onDeleteSavedDocument={handleDeleteSavedDocument}
        onExportSavedDocument={handleExportPaperDoc}
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
                closeDocument();
              });
            }}
            data-tip="Go back to the start screen."
          >
            Paper Perfector
          </button>
          <button
            className="toolbar-button toolbar-nav"
            type="button"
            onClick={handleBack}
            disabled={historyIndex <= 0}
            data-tip="Go back to the previous document state."
          >
            ← Back
          </button>
          <button
            className="toolbar-button toolbar-nav"
            type="button"
            onClick={handleForward}
            disabled={historyIndex >= history.length - 1}
            data-tip="Go forward to the next document state."
          >
            Forward →
          </button>
          <button
            className="toolbar-button toolbar-nav"
            type="button"
            onClick={() => setShowSearchPanel(true)}
            data-tip="Search the document or jump to app actions."
          >
            <span className="icon-inline">
              <IconSearch size={16} />
              Search
            </span>
          </button>
        </div>
        <div className="toolbar-actions">
          <button
            className="toolbar-button toolbar-home toolbar-nav"
            type="button"
            onClick={() => {
              requestSafeNavigation(() => {
                closeDocument();
              });
            }}
            data-tip="Return to the home screen."
          >
            Home
          </button>
          <label
            className="file-upload"
            data-tip="Import .ppdoc, HTML, PDF, Word, Markdown, text, or images."
          >
            Import
            <input
              ref={importInputRef}
              type="file"
              accept="text/html,.html,.htm,application/pdf,.pdf,image/*,text/markdown,.md,text/plain,.txt,application/vnd.openxmlformats-officedocument.wordprocessingml.document,.docx,.doc,.ppdoc"
              onChange={handleImport}
            />
          </label>
          <button
            className={`toolbar-button ${pdfDebugEnabled ? "active" : ""}`}
            type="button"
            onClick={() => setPdfDebugEnabled((prev) => !prev)}
            data-tip="Capture PDF import geometry and open a visual debugger after PDF import."
          >
            <span className="icon-inline">
              <IconDebug size={16} />
              {pdfDebugEnabled ? "Debug PDF On" : "Debug PDF Off"}
            </span>
          </button>
          <button
            className="toolbar-button"
            type="button"
            onClick={handleSaveToLibrary}
            data-tip="Save this document to your library."
          >
            <span className="icon-inline">
              <IconSave size={16} />
              Save
            </span>
          </button>
          <button
            className="toolbar-button"
            type="button"
            onClick={() => setShowShareModal(true)}
            data-tip="Share a link or send the PDF via email."
          >
            <span className="icon-inline">
              <IconShare size={16} />
              Share
            </span>
          </button>
          <button
            className={`toolbar-button ${editMode ? "active" : ""}`}
            type="button"
            onClick={handleToggleEditMode}
            data-tip={editMode ? "Return to view mode." : "Edit and format your paper."}
          >
            <span className="icon-inline">
              {editMode ? <IconView size={16} /> : <IconEdit size={16} />}
              {editMode ? "View" : "Edit"}
            </span>
          </button>
          <button
            className="toolbar-button"
            type="button"
            onClick={openFormatModal}
            data-tip="Adjust fonts, margins, spacing, and formatting."
          >
            Aa Format
          </button>
          <button
            className="toolbar-button"
            type="button"
            onClick={openExportChecklist}
            data-tip="Open the export checklist and generate a PDF."
          >
            <span className="icon-inline">
              <IconExport size={16} />
              Export PDF
            </span>
          </button>
          <div className="toolbar-menu" ref={toolbarMenuRef}>
            <button
              className="toolbar-button"
              type="button"
              onClick={() => setShowToolbarMenu((prev) => !prev)}
              data-tip="More tools and navigation."
            >
              ⋯ More
            </button>
            {showToolbarMenu ? (
              <div className="toolbar-menu-panel">
                <button
                  className="toolbar-menu-item"
                  type="button"
                  onClick={() => {
                    handleSaveToLibrary();
                    setShowToolbarMenu(false);
                  }}
                  data-tip="Save this document to your library."
                >
                  <span className="icon-inline">
                    <IconSave size={15} />
                    Save
                  </span>
                </button>
                <button
                  className="toolbar-menu-item"
                  type="button"
                  onClick={() => {
                    setShowHistoryModal(true);
                    setShowToolbarMenu(false);
                  }}
                  data-tip="Review saved versions."
                  disabled={!currentLibraryEntry}
                >
                  <span className="icon-inline">
                    <IconHistory size={15} />
                    History
                  </span>
                </button>
                <div className="toolbar-menu-divider" />
                <button
                  className="toolbar-menu-item"
                  type="button"
                  onClick={() => {
                    setShowScoreModal(true);
                    setShowToolbarMenu(false);
                  }}
                  data-tip="Get an academic score and feedback."
                >
                  <span className="icon-inline">
                    <IconScore size={15} />
                    Score
                  </span>
                </button>
                <button
                  className="toolbar-menu-item"
                  type="button"
                  onClick={() => {
                    setShowTrustCenter(true);
                    setShowToolbarMenu(false);
                  }}
                  data-tip="Open integrity and proof-of-process tools."
                >
                  <span className="icon-inline">
                    <IconIntegrity size={15} />
                    Trust
                  </span>
                </button>
                <button
                  className="toolbar-menu-item"
                  type="button"
                  onClick={() => {
                    setShowMobilePreview(true);
                    setShowToolbarMenu(false);
                  }}
                  data-tip="Preview the document inside a mobile device frame."
                >
                  <span className="icon-inline">
                    <IconMobile size={15} />
                    Mobile
                  </span>
                </button>
                <div className="toolbar-menu-divider" />
                <button
                  className="toolbar-menu-item"
                  type="button"
                  onClick={() => {
                    setTheme(theme === "dark" ? "light" : "dark");
                    setShowToolbarMenu(false);
                  }}
                  data-tip="Switch between light and dark background themes."
                >
                  <span className="icon-inline">
                    {theme === "dark" ? <IconSun size={15} /> : <IconMoon size={15} />}
                    {theme === "dark" ? "Light Mode" : "Dark Mode"}
                  </span>
                </button>
                <button
                  className="toolbar-menu-item"
                  type="button"
                  onClick={() => {
                    setTipsEnabled((prev) => !prev);
                    setShowToolbarMenu(false);
                  }}
                  data-tip="Turn hover tips on or off."
                >
                  <span className="icon-inline">
                    <IconLightbulb size={15} />
                    {tipsEnabled ? "Tips On" : "Tips Off"}
                  </span>
                </button>
              </div>
            ) : null}
          </div>
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
          docId={docId}
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
        <ShareModal doc={doc} docId={docId} onClose={() => setShowShareModal(false)} />
      ) : null}
      {showExportChecklist && doc ? (
        <ExportChecklistModal
          doc={doc}
          onClose={() => setShowExportChecklist(false)}
          onConfirm={() => {
            setShowExportChecklist(false);
            handleExportPdf();
          }}
        />
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
          searchOptions={searchOptions}
          onSearchOptionsChange={setSearchOptions}
          isInvalidRegex={isInvalidRegex}
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
      {showHistoryModal && currentLibraryEntry ? (
        <HistoryModal
          entry={currentLibraryEntry}
          onRestore={(restored) => {
            applyDocument(restored);
            setShowHistoryModal(false);
            setStatus("Version restored.");
            setTimeout(() => setStatus(null), 2000);
          }}
          onClose={() => setShowHistoryModal(false)}
        />
      ) : null}
      {showTrustCenter && doc ? (
        <TrustCenterModal doc={doc} onClose={() => setShowTrustCenter(false)} />
      ) : null}
      {showPdfDebugModal && currentPdfDebugPage ? (
        <div className="pdf-debug-backdrop" role="presentation">
          <section className="pdf-debug-modal" role="dialog" aria-modal="true">
            <header className="pdf-debug-header">
              <div>
                <h3>PDF Import Debugger</h3>
                <p>
                  Page {currentPdfDebugPage.pageIndex} of {pdfDebugPages.length}
                </p>
              </div>
              <button
                type="button"
                className="search-panel-close"
                onClick={() => setShowPdfDebugModal(false)}
                aria-label="Close PDF debugger"
              >
                ✕
              </button>
            </header>
            <div className="pdf-debug-controls">
              <button
                type="button"
                className="toolbar-button"
                onClick={() =>
                  setPdfDebugPageIndex((prev) => Math.max(0, prev - 1))
                }
                disabled={pdfDebugPageIndex <= 0}
              >
                Previous
              </button>
              <button
                type="button"
                className="toolbar-button"
                onClick={() =>
                  setPdfDebugPageIndex((prev) =>
                    Math.min(pdfDebugPages.length - 1, prev + 1)
                  )
                }
                disabled={pdfDebugPageIndex >= pdfDebugPages.length - 1}
              >
                Next
              </button>
              <span>
                Items: {currentPdfDebugPage.items.length} | Columns:{" "}
                {currentPdfDebugPage.columns.length}
              </span>
            </div>
            <div className="pdf-debug-canvas-wrap">
              <PdfImportDebugger
                items={currentPdfDebugPage.items}
                columns={currentPdfDebugPage.columns}
                pageWidth={currentPdfDebugPage.pageWidth}
                pageHeight={currentPdfDebugPage.pageHeight}
              />
            </div>
          </section>
        </div>
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
                <button
                  type="button"
                  onClick={() => setShowScoreModal(true)}
                  data-tip="Get an academic score and feedback."
                >
                  Score my paper
                </button>
                <button
                  type="button"
                  onClick={() =>
                    requestSafeNavigation(() => openDocument(quickstartGuide))
                  }
                  data-tip="Open the quickstart guide."
                >
                  Open Quickstart Guide
                </button>
                <button
                  type="button"
                  onClick={() => setShowTrustCenter(true)}
                  data-tip="Open integrity and proof-of-process tools."
                >
                  Trust Center
                </button>
                <button
                  type="button"
                  onClick={openFormatModal}
                  data-tip="Adjust fonts, spacing, margins, and formatting."
                >
                  Adjust format & spacing
                </button>
                <button
                  type="button"
                  onClick={() => setEditMode((prev) => !prev)}
                  data-tip={editMode ? "Return to view mode." : "Open the editor."}
                >
                  {editMode ? "Switch to view" : "Open editor"}
                </button>
                <button
                  type="button"
                  onClick={handleExportPdf}
                  data-tip="Export the current document as PDF."
                >
                  Export PDF
                </button>
                <button
                  type="button"
                  onClick={openFeedbackEmail}
                  data-tip="Send product feedback."
                >
                  Send feedback
                </button>
              </div>
            </div>
          ) : null}
          <button
            className="assistant-toggle"
            type="button"
            onClick={() => setShowHelpAssistant((prev) => !prev)}
            data-tip="Open the help assistant for quick actions."
          >
            Need help?
          </button>
        </div>
      ) : null}
      <HoverTip enabled={tipsEnabled} />
    </div>
  );
}
