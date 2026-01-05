import { useRef } from "react";
import type { Document } from "../models/DocumentSchema";
import { auditCitationCoverage } from "../utils/citationAudit";
import { parsePageMargin, resolveFormat } from "../utils/formatting";
import { useFocusTrap } from "../hooks/useFocusTrap";
import "../styles/ExportChecklistModal.css";

type ExportChecklistModalProps = {
  doc: Document;
  onConfirm: () => void;
  onClose: () => void;
};

function findMetadataValue(
  metadata: Record<string, string>,
  keys: string[]
) {
  const lowerKeys = keys.map((key) => key.toLowerCase());
  for (const [key, value] of Object.entries(metadata)) {
    if (lowerKeys.includes(key.toLowerCase()) && value.trim()) {
      return value.trim();
    }
  }
  return "";
}

export function ExportChecklistModal({
  doc,
  onConfirm,
  onClose,
}: ExportChecklistModalProps) {
  const modalRef = useRef<HTMLDivElement | null>(null);
  const format = resolveFormat(doc);
  const marginValue = format.pageMargin ?? "24mm";
  const marginData = parsePageMargin(marginValue, marginValue);
  const marginOk = marginData.size > 0;
  const isAcademic =
    format.preset === "apa" || format.preset === "mla" || format.preset === "chicago";
  const pageNumbersEnabled = format.showPageNumbers ?? false;
  const pageNumbersOk = !isAcademic || pageNumbersEnabled;
  const citationAudit = auditCitationCoverage(doc, format);
  const citationsOk =
    citationAudit.totalSources === 0 || citationAudit.missingSources.length === 0;
  const author = findMetadataValue(doc.metadata, ["author"]);
  const date = findMetadataValue(doc.metadata, ["date"]);
  const missingFields: string[] = [];

  if (!author) {
    missingFields.push("Author");
  }
  if (!date) {
    missingFields.push("Date");
  }

  useFocusTrap(modalRef, onClose);

  return (
    <div
      className="export-modal-backdrop"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="export-modal"
        ref={modalRef}
        tabIndex={-1}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="export-modal-header">
          <div>
            <h2>Pre-Export Checklist</h2>
            <p>Confirm formatting before generating your PDF.</p>
          </div>
          <button
            className="export-modal-close"
            type="button"
            onClick={onClose}
            data-tip="Close the checklist."
          >
            X
          </button>
        </div>

        <ul className="export-checklist">
          <li className={marginOk ? "ok" : "warning"}>
            <span className="export-check-icon">{marginOk ? "✓" : "!"}</span>
            <div>
              <strong>Margins</strong>
              <span>{marginValue}</span>
            </div>
          </li>
          <li className={pageNumbersOk ? "ok" : "warning"}>
            <span className="export-check-icon">{pageNumbersOk ? "✓" : "!"}</span>
            <div>
              <strong>Page numbers</strong>
              <span>{pageNumbersEnabled ? "On" : "Off"}</span>
            </div>
          </li>
          <li className={citationsOk ? "ok" : "warning"}>
            <span className="export-check-icon">{citationsOk ? "✓" : "!"}</span>
            <div>
              <strong>Citations</strong>
              <span>
                {citationAudit.totalSources === 0
                  ? "No sources saved yet"
                  : citationsOk
                    ? "All sources referenced"
                    : `${citationAudit.missingSources.length} source${
                        citationAudit.missingSources.length === 1 ? "" : "s"
                      } missing in-text citations`}
              </span>
            </div>
          </li>
        </ul>

        {missingFields.length > 0 ? (
          <div className="export-warning">
            <strong>Missing metadata:</strong> {missingFields.join(", ")}. Add these
            before submitting.
          </div>
        ) : null}

        <div className="export-modal-actions">
          <button
            className="export-modal-button secondary"
            onClick={onClose}
            data-tip="Return to editing."
          >
            Back
          </button>
          <button
            className="export-modal-button primary"
            onClick={onConfirm}
            data-tip="Generate the PDF with current settings."
          >
            Export PDF
          </button>
        </div>
      </div>
    </div>
  );
}
