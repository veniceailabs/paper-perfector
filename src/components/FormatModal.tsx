import type { DocumentFormat } from "../models/DocumentSchema";
import { FormatControls } from "./FormatControls";
import "../styles/FormatModal.css";

interface FormatModalProps {
  format: DocumentFormat;
  onChange: (next: DocumentFormat) => void;
  onClose: () => void;
}

export function FormatModal({ format, onChange, onClose }: FormatModalProps) {
  return (
    <div className="format-modal-backdrop" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="format-modal" onClick={(event) => event.stopPropagation()}>
        <div className="format-modal-header">
          <div>
            <h2>Document Formatting</h2>
            <p>Choose a format preset or customize typography.</p>
          </div>
          <button
            className="format-modal-close"
            type="button"
            onClick={onClose}
            data-tip="Close the format panel."
          >
            ✕
          </button>
        </div>
        <FormatControls format={format} onChange={onChange} />
        <div className="format-modal-footer">
          Changes apply immediately.
        </div>
      </div>
    </div>
  );
}
