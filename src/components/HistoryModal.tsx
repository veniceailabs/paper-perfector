import { useRef } from "react";
import type { Document } from "../models/DocumentSchema";
import type { SavedDocument } from "../utils/library";
import { useFocusTrap } from "../hooks/useFocusTrap";
import "../styles/HistoryModal.css";

type HistoryModalProps = {
  entry: SavedDocument;
  onRestore: (doc: Document) => void;
  onClose: () => void;
};

export function HistoryModal({ entry, onRestore, onClose }: HistoryModalProps) {
  const modalRef = useRef<HTMLDivElement | null>(null);
  const versions = [
    {
      id: "current",
      savedAt: entry.updatedAt,
      label: "Current version",
      doc: entry.doc,
      isCurrent: true,
    },
    ...entry.versions.map((version) => ({
      id: version.id,
      savedAt: version.savedAt,
      label: "Saved version",
      doc: version.doc,
      isCurrent: false,
    })),
  ];

  const formatSavedAt = (value: string) => {
    try {
      const date = new Date(value);
      return date.toLocaleString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return value;
    }
  };

  useFocusTrap(modalRef, onClose);

  return (
    <div className="history-modal-backdrop" role="dialog" aria-modal="true" onClick={onClose}>
      <div
        className="history-modal"
        ref={modalRef}
        tabIndex={-1}
        onClick={(event) => event.stopPropagation()}
      >
        <header className="history-modal-header">
          <div>
            <h2>Version History</h2>
            <p>Restore a prior save for "{entry.title}".</p>
          </div>
          <button
            className="history-modal-close"
            type="button"
            onClick={onClose}
            data-tip="Close version history."
          >
            ✕
          </button>
        </header>

        <div className="history-modal-list">
          {versions.length === 0 ? (
            <div className="history-modal-empty">No previous versions yet.</div>
          ) : (
            versions.map((version) => (
              <div key={version.id} className="history-modal-row">
                <div>
                  <strong>{version.label}</strong>
                  <span>{formatSavedAt(version.savedAt)}</span>
                </div>
                <button
                  type="button"
                  className="history-restore-button"
                  onClick={() => onRestore(version.doc)}
                  disabled={version.isCurrent}
                  data-tip={
                    version.isCurrent
                      ? "You are already on this version."
                      : "Restore this version in the editor."
                  }
                >
                  {version.isCurrent ? "Current" : "Restore"}
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
