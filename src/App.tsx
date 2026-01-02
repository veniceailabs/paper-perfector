import { useEffect, useState } from "react";
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
  const [doc, setDoc] = useState<Document | null>(() => {
    // Check for shared document in URL first
    const shared = getSharedDocumentFromUrl();
    if (shared) return shared;

    // Otherwise load auto-saved document
    return loadAutoSavedDocument();
  });
  const [editMode, setEditMode] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [printHash, setPrintHash] = useState<string>("");

  // Auto-save document
  useAutoSave(doc);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setStatus(`Importing ${file.name}...`);

    try {
      const result = await importDocumentFromFile(file);
      setDoc(result.document);
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

  const handleEmail = () => {
    if (!doc) return;

    setStatus("Opening email client...");
    emailDocument(doc);
    setTimeout(() => setStatus(null), 2000);
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
          onSelectDocument={setDoc}
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
              setDoc(null);
              setEditMode(false);
            }}
            title="Back to start screen"
          >
            Home
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
            onClick={() => setEditMode(!editMode)}
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
        <DocumentEditor doc={doc} onSave={(updatedDoc) => {
          setDoc(updatedDoc);
          setStatus("Document saved!");
          setTimeout(() => setStatus(null), 2000);
        }} />
      ) : (
        <DocumentRenderer doc={doc} printHash={printHash || undefined} />
      )}
      {showShareModal && doc ? (
        <ShareModal doc={doc} onClose={() => setShowShareModal(false)} />
      ) : null}
    </div>
  );
}
