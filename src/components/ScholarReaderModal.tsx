import "../styles/ScholarReaderModal.css";

type ScholarReaderModalProps = {
  title: string;
  url: string;
  onClose: () => void;
};

export function ScholarReaderModal({ title, url, onClose }: ScholarReaderModalProps) {
  return (
    <div className="scholar-reader-backdrop" role="dialog" aria-modal="true">
      <div className="scholar-reader-modal">
        <header className="scholar-reader-header">
          <div>
            <h2>{title}</h2>
            <p>Previewing external source inside Paper Perfector.</p>
          </div>
          <div className="scholar-reader-actions">
            <a
              className="scholar-reader-link"
              href={url}
              target="_blank"
              rel="noopener noreferrer"
            >
              Open in New Tab
            </a>
            <button
              className="scholar-reader-close"
              type="button"
              onClick={onClose}
            >
              ✕
            </button>
          </div>
        </header>
        <div className="scholar-reader-frame">
          <iframe
            src={url}
            title={title}
            loading="lazy"
            referrerPolicy="no-referrer"
          />
          <div className="scholar-reader-fallback">
            If the document does not load, open it in a new tab.
          </div>
        </div>
      </div>
    </div>
  );
}
