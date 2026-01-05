import { useEffect, useMemo, useState } from "react";
import type { Document } from "../models/DocumentSchema";
import { calculateDocumentStats } from "../utils/documentStats";
import { formatPresetLabel, resolveFormat } from "../utils/formatting";
import { formatReference, formatReferenceTitle } from "../utils/citations";
import { hashDocument } from "../utils/hash";
import "../styles/TrustCenterModal.css";

type TrustCenterModalProps = {
  doc: Document;
  onClose: () => void;
};

function downloadJson(data: unknown, filename: string) {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

async function copyToClipboard(text: string) {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // Ignore and fall back to legacy method.
  }

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "true");
  textarea.style.position = "absolute";
  textarea.style.left = "-9999px";
  document.body.appendChild(textarea);
  textarea.select();
  const success = document.execCommand("copy");
  document.body.removeChild(textarea);
  return success;
}

export function TrustCenterModal({ doc, onClose }: TrustCenterModalProps) {
  const [hash, setHash] = useState<string | null>(null);
  const [hashError, setHashError] = useState<string | null>(null);
  const [copyStatus, setCopyStatus] = useState<string | null>(null);
  const [aiStatement, setAiStatement] = useState(
    "I used Paper Perfector to organize structure, format citations, and export the final PDF. I did not use it to generate original content."
  );

  const resolvedFormat = resolveFormat(doc);
  const stats = calculateDocumentStats(doc, resolvedFormat.lineHeight ?? 1.5);
  const citationStyle = (resolvedFormat.preset ?? "default") as const;
  const referenceTitle = formatReferenceTitle(citationStyle);
  const formatLabel = formatPresetLabel(citationStyle);

  useEffect(() => {
    let active = true;
    hashDocument(doc)
      .then((value) => {
        if (active) {
          setHash(value);
        }
      })
      .catch(() => {
        if (active) {
          setHashError("Unable to compute document hash.");
        }
      });
    return () => {
      active = false;
    };
  }, [doc]);

  const sources = doc.sources ?? [];
  const proofPack = useMemo(() => {
    return {
      generatedAt: new Date().toISOString(),
      title: doc.title,
      subtitle: doc.subtitle ?? null,
      metadata: doc.metadata,
      format: {
        ...resolvedFormat,
      },
      stats,
      hash: hash ?? null,
      sources: sources.map((source) => ({
        ...source,
        formatted: formatReference(source, citationStyle),
      })),
      aiUseStatement: aiStatement,
    };
  }, [aiStatement, doc.metadata, doc.subtitle, doc.title, hash, resolvedFormat, sources, stats]);

  const handleCopyStatement = async () => {
    const success = await copyToClipboard(aiStatement);
    setCopyStatus(success ? "Statement copied." : "Copy failed.");
    setTimeout(() => setCopyStatus(null), 2000);
  };

  return (
    <div className="trust-center-backdrop" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="trust-center-modal" onClick={(event) => event.stopPropagation()}>
        <header className="trust-center-header">
          <div>
            <h2>Trust Center</h2>
            <p>Proof of process, integrity tooling, and exportable artifacts.</p>
          </div>
          <button className="trust-center-close" type="button" onClick={onClose}>
            ✕
          </button>
        </header>

        <section className="trust-center-section">
          <h3>Proof Pack</h3>
          <div className="trust-center-card">
            <div className="trust-center-metrics">
              <div>
                <span className="metric-label">Words</span>
                <strong>{stats.words.toLocaleString()}</strong>
              </div>
              <div>
                <span className="metric-label">Pages (est.)</span>
                <strong>{stats.pages}</strong>
              </div>
              <div>
                <span className="metric-label">Sources</span>
                <strong>{sources.length}</strong>
              </div>
              <div>
                <span className="metric-label">Format</span>
                <strong>{formatLabel.toUpperCase()}</strong>
              </div>
            </div>
            <div className="trust-center-hash">
              <span>Document Hash</span>
              <code>{hashError ?? hash ?? "Calculating..."}</code>
            </div>
            <button
              type="button"
              className="trust-center-button primary"
              onClick={() =>
                downloadJson(
                  proofPack,
                  `${doc.title.replace(/[/\\?%*:|"<>]/g, "-")}-proof-pack.json`
                )
              }
            >
              Download Proof Pack (JSON)
            </button>
          </div>
        </section>

        <section className="trust-center-section">
          <h3>Integrity Checklist</h3>
          <ul className="trust-center-list">
            <li>Evidence-backed citations stored in {referenceTitle}.</li>
            <li>Visible edit trail with autosave and manual saves.</li>
            <li>Document hash provides tamper-evident verification.</li>
          </ul>
        </section>

        <section className="trust-center-section">
          <h3>AI Use Statement</h3>
          <textarea
            className="trust-center-textarea"
            value={aiStatement}
            onChange={(event) => setAiStatement(event.target.value)}
            rows={4}
          />
          <div className="trust-center-actions">
            <button
              type="button"
              className="trust-center-button"
              onClick={handleCopyStatement}
            >
              Copy Statement
            </button>
            {copyStatus ? <span className="trust-center-status">{copyStatus}</span> : null}
          </div>
        </section>

        <section className="trust-center-section">
          <h3>Privacy Commitments</h3>
          <ul className="trust-center-list">
            <li>No model training on student papers.</li>
            <li>Local autosave for offline control.</li>
            <li>Exportable artifacts stay on your device.</li>
          </ul>
        </section>
      </div>
    </div>
  );
}
