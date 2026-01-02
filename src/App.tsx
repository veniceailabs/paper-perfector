import { useEffect, useState } from "react";
import { DocumentRenderer } from "./renderer/DocumentRenderer";
import { DocumentEditor } from "./components/DocumentEditor";
import { StartScreen } from "./components/StartScreen";
import type { Document } from "./models/DocumentSchema";
import { importDocumentFromFile } from "./utils/importers";
import { exportToPdf } from "./utils/export";
import { hashDocument } from "./utils/hash";
import { useAutoSave, loadAutoSavedDocument, clearAutoSave } from "./hooks/useAutoSave";
import {
  getSharedDocumentFromUrl,
  copyShareLink,
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
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [hash, setHash] = useState<string>("");

  // Auto-save document
  useAutoSave(doc);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  useEffect(() => {
    if (!doc) {
      setHash("");
      return;
    }

    let active = true;
    hashDocument(doc)
      .then((value) => {
        if (active) {
          setHash(value);
        }
      })
      .catch(() => {
        if (active) {
          setHash("");
        }
      });

    return () => {
      active = false;
    };
  }, [doc]);

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

  const handleShare = async () => {
    if (!doc) return;

    const copied = await copyShareLink(doc);
    if (copied) {
      setStatus("Share link copied to clipboard! 🔗");
      setTimeout(() => setStatus(null), 3000);
    } else {
      setStatus("Failed to copy share link");
    }
  };

  const handleEmail = () => {
    if (!doc) return;

    setStatus("Opening email client...");
    emailDocument(doc);
    setTimeout(() => setStatus(null), 2000);
  };

  if (!doc) {
    return (
      <>
        <div className="toolbar" style={{ position: "fixed", top: 0, width: "100%", zIndex: 100 }}>
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
        <StartScreen onSelectDocument={setDoc} onImport={handleImport} />
      </>
    );
  }

  return (
    <div className="app-shell">
      <div className="toolbar">
        <div className="brand">
          <button
            className="toolbar-button toolbar-home"
            type="button"
            onClick={() => {
              setDoc(null);
              setEditMode(false);
            }}
            title="Back to start screen"
          >
            ⌂
          </button>
          Paper Perfector
        </div>
        <div className="toolbar-actions">
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
            onClick={handleShare}
            title="Copy shareable link to clipboard"
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
            onClick={() => exportToPdf(doc.title)}
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
        <DocumentRenderer doc={doc} />
      )}
      {hash ? (
        <div className="hash-footnote">Document hash: {hash}</div>
      ) : null}
    </div>
  );
}
