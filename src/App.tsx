import { useEffect, useRef, useState } from "react";
import { DocumentRenderer } from "./renderer/DocumentRenderer";
import { DocumentEditor, type DocumentEditorHandle } from "./components/DocumentEditor";
import { StartScreen } from "./components/StartScreen";
import { ShareModal } from "./components/ShareModal";
import { MobilePreviewModal } from "./components/MobilePreviewModal";
import type { Document } from "./models/DocumentSchema";
import { importDocumentFromFile } from "./utils/importers";
import { exportToPdf } from "./utils/export";
import { hashDocument } from "./utils/hash";
import { useAutoSave, loadAutoSavedDocument } from "./hooks/useAutoSave";
import {
  getSharedDocumentFromUrl,
} from "./utils/share";

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
  const [showMobilePreview, setShowMobilePreview] = useState(false);
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [printHash, setPrintHash] = useState<string>("");
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const historyRef = useRef(history);
  const historyIndexRef = useRef(historyIndex);
  const editorRef = useRef<DocumentEditorHandle | null>(null);

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

  const notifySaveError = () => {
    setStatus("Fix errors before leaving.");
    setTimeout(() => setStatus(null), 3000);
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
          <div className="toolbar-left">
            <div className="brand">Paper Perfector</div>
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
            onClick={() => {
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
            }}
          >
            {editMode ? "👁️ View" : "✏️ Edit"}
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
      {editMode ? (
        <DocumentEditor
          ref={editorRef}
          doc={doc}
          onSave={handleDocSave}
          onDirtyChange={setHasUnsavedChanges}
        />
      ) : (
        <DocumentRenderer doc={doc} printHash={printHash || undefined} />
      )}
      {showShareModal && doc ? (
        <ShareModal doc={doc} onClose={() => setShowShareModal(false)} />
      ) : null}
      {showMobilePreview && doc ? (
        <MobilePreviewModal doc={doc} onClose={() => setShowMobilePreview(false)} />
      ) : null}
    </div>
  );
}
