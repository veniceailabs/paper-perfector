import { useEffect, useRef, useState } from "react";
import { DocumentRenderer } from "./renderer/DocumentRenderer";
import { DocumentEditor } from "./components/DocumentEditor";
import { StartScreen } from "./components/StartScreen";
import { ShareModal } from "./components/ShareModal";
import type { Document } from "./models/DocumentSchema";
import { importDocumentFromFile } from "./utils/importers";
import { exportToPdf } from "./utils/export";
import { hashDocument } from "./utils/hash";
import { useAutoSave, loadAutoSavedDocument, clearAutoSave } from "./hooks/useAutoSave";
import {
  getSharedDocumentFromUrl,
  emailDocument,
} from "./utils/share";

export default function App() {
  const initialDoc = (() => {
    const shared = getSharedDocumentFromUrl();
    if (shared) return shared;

    return loadAutoSavedDocument();
  })();

  const [doc, setDoc] = useState<Document | null>(initialDoc);
  const [history, setHistory] = useState<Document[]>(() =>
    initialDoc ? [initialDoc] : []
  );
  const [historyIndex, setHistoryIndex] = useState(initialDoc ? 0 : -1);
  const [editMode, setEditMode] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [printHash, setPrintHash] = useState<string>("");
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [saveSignal, setSaveSignal] = useState(0);

  const historyRef = useRef(history);
  const historyIndexRef = useRef(historyIndex);
  const pendingActionRef = useRef<null | (() => void)>(null);

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

  const goToHistory = (index: number) => {
    const entry = historyRef.current[index];
    if (!entry) {
      return;
    }
    setDoc(entry);
    setHistoryIndex(index);
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
      pendingActionRef.current = action;
      setSaveSignal((value) => value + 1);
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
        applyDocument(result.document);
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

  const handleEmail = async () => {
    if (!doc) return;

    setStatus("Preparing PDF...");
    const result = await emailDocument(doc);
    if (result === "shared") {
      setStatus("Share sheet opened.");
    } else if (result === "downloaded") {
      setStatus("PDF downloaded. Attach it to your email.");
    } else {
      setStatus("Opening email with link...");
    }
    setTimeout(() => setStatus(null), 3000);
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

  const handleDocSave = (updatedDoc: Document) => {
    applyDocument(updatedDoc);
    setStatus("Document saved!");
    setTimeout(() => setStatus(null), 2000);
  };

  const handleSaveResult = (success: boolean) => {
    if (!success) {
      setStatus("Fix errors before leaving.");
      setTimeout(() => setStatus(null), 3000);
      pendingActionRef.current = null;
      return;
    }

    setHasUnsavedChanges(false);
    if (pendingActionRef.current) {
      const action = pendingActionRef.current;
      pendingActionRef.current = null;
      action();
    }
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

  if (!doc) {
    return (
      <div className="app-shell">
        <div className="toolbar">
          <div className="brand">Paper Perfector</div>
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
          onSelectDocument={applyDocument}
          onImport={handleImport}
          onThemeChange={setTheme}
        />
      </div>
    );
  }

  return (
    <div className="app-shell">
      <div className="toolbar">
        <div className="brand">Paper Perfector</div>
        <div className="toolbar-actions">
          <button
            className="toolbar-button toolbar-home"
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
          <button
            className="toolbar-button"
            type="button"
            onClick={handleBack}
            disabled={historyIndex <= 0}
            title="Back"
          >
            ← Back
          </button>
          <button
            className="toolbar-button"
            type="button"
            onClick={handleForward}
            disabled={historyIndex >= history.length - 1}
            title="Forward"
          >
            Forward →
          </button>
          <label className="file-upload">
            Import
            <input
              type="file"
              accept="text/html,.html,.htm,application/pdf,.pdf,image/*,text/markdown,.md"
              onChange={handleImport}
            />
          </label>
          <button
            className={`toolbar-button ${editMode ? "active" : ""}`}
            type="button"
            onClick={() => {
              if (editMode) {
                requestSafeNavigation(() => setEditMode(false));
                return;
              }
              setEditMode(true);
            }}
          >
            {editMode ? "👁️ View" : "✏️ Edit"}
          </button>
          <button
            className="toolbar-button"
            type="button"
            onClick={() => setShowShareModal(true)}
            title="Share this document"
          >
            🔗 Share
          </button>
          <button
            className="toolbar-button"
            type="button"
            onClick={handleEmail}
            title="Download PDF and open email"
          >
            📧 Email
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
      {editMode ? (
        <DocumentEditor
          doc={doc}
          onSave={handleDocSave}
          onDirtyChange={setHasUnsavedChanges}
          saveSignal={saveSignal}
          onSaveResult={handleSaveResult}
        />
      ) : (
        <DocumentRenderer doc={doc} printHash={printHash || undefined} />
      )}
      {showShareModal && doc ? (
        <ShareModal doc={doc} onClose={() => setShowShareModal(false)} />
      ) : null}
    </div>
  );
}
