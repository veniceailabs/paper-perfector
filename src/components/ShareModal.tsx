import { useMemo, useRef, useState } from "react";
import type { Document } from "../models/DocumentSchema";
import { encodeDocumentToUrl, emailDocument } from "../utils/share";
import { downloadTextFile } from "../utils/download";
import { serializePaperDoc } from "../utils/paperDoc";
import { useFocusTrap } from "../hooks/useFocusTrap";
import "../styles/ShareModal.css";

type ShareModalProps = {
  doc: Document;
  docId?: string | null;
  onClose: () => void;
};

function supportsNativeShare() {
  return typeof navigator !== "undefined" && "share" in navigator;
}

async function copyToClipboard(text: string) {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // Fall through to legacy copy method.
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

export function ShareModal({ doc, docId, onClose }: ShareModalProps) {
  const modalRef = useRef<HTMLDivElement | null>(null);
  const shareUrl = useMemo(() => encodeDocumentToUrl(doc), [doc]);
  const [copyStatus, setCopyStatus] = useState<string | null>(null);
  const [emailStatus, setEmailStatus] = useState<string | null>(null);
  const [isEmailing, setIsEmailing] = useState(false);
  const canNativeShare = supportsNativeShare();

  const shareText = `Paper Perfector - ${doc.title}`;
  const shareTooLong = shareUrl.length > 1800;

  const sanitizeFileName = (name: string) =>
    name.replace(/[/\\?%*:|"<>]/g, "-").trim() || "document";

  const handleDownload = () => {
    const fileName = `${sanitizeFileName(doc.title)}.ppdoc`;
    downloadTextFile(serializePaperDoc(doc, docId ?? undefined), fileName);
  };

  const handleCopy = async () => {
    const success = await copyToClipboard(shareUrl);
    setCopyStatus(success ? "Link copied." : "Copy failed. Select and copy manually.");
    if (success) {
      setTimeout(() => setCopyStatus(null), 2000);
    }
  };

  const handleNativeShare = async () => {
    if (!canNativeShare) {
      return;
    }
    try {
      await navigator.share({
        title: doc.title,
        text: shareText,
        url: shareUrl,
      });
    } catch {
      // User dismissed share sheet.
    }
  };

  const handleEmail = async () => {
    setIsEmailing(true);
    setEmailStatus("Preparing PDF...");
    const result = await emailDocument(doc);
    if (result === "shared") {
      setEmailStatus("Share sheet opened.");
    } else if (result === "downloaded") {
      setEmailStatus("PDF downloaded. Attach it in your email.");
    } else {
      setEmailStatus("Opening email with link.");
    }
    setIsEmailing(false);
    setTimeout(() => setEmailStatus(null), 3000);
  };

  const openShareWindow = (url: string) => {
    window.open(url, "_blank", "noopener,noreferrer");
  };

  useFocusTrap(modalRef, onClose);

  return (
    <div className="share-modal-backdrop" role="dialog" aria-modal="true" onClick={onClose}>
      <div
        className="share-modal"
        ref={modalRef}
        tabIndex={-1}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="share-modal-header">
          <div>
            <h2>Share Paper</h2>
            <p>Send a link or post it to your platform.</p>
          </div>
          <button
            className="share-modal-close"
            type="button"
            onClick={onClose}
            data-tip="Close the share dialog."
          >
            X
          </button>
        </div>

        <div className="share-link">
          <label htmlFor="share-link-input">Share link</label>
          <div className="share-link-row">
            <input
              id="share-link-input"
              className="share-link-input"
              type="text"
              value={shareUrl}
              readOnly
              onFocus={(event) => event.currentTarget.select()}
            />
            <button
              className="share-link-button"
              type="button"
              onClick={handleCopy}
              data-tip="Copy the share link to your clipboard."
            >
              Copy
            </button>
          </div>
          {shareTooLong ? (
            <div className="share-warning">
              Share links can be too long for some apps. Use a .ppdoc file instead.
            </div>
          ) : null}
          {copyStatus ? <div className="share-status">{copyStatus}</div> : null}
        </div>

        <button
          className="share-native"
          type="button"
          onClick={handleDownload}
          data-tip="Download a Paper Perfector document file."
        >
          Download .ppdoc
        </button>

        {canNativeShare ? (
          <button
            className="share-native"
            type="button"
            onClick={handleNativeShare}
            data-tip="Open your device share sheet."
          >
            Share via device
          </button>
        ) : null}

        <div className="share-grid">
          <button
            className="share-action"
            type="button"
            onClick={handleEmail}
            disabled={isEmailing}
            data-tip="Generate a PDF and open an email draft."
          >
            Email PDF
          </button>
          <button
            className="share-action"
            type="button"
            onClick={() =>
              openShareWindow(
                `https://twitter.com/intent/tweet?text=${encodeURIComponent(
                  shareText
                )}&url=${encodeURIComponent(shareUrl)}`
              )
            }
            data-tip="Share on X (Twitter)."
          >
            X Post
          </button>
          <button
            className="share-action"
            type="button"
            onClick={() =>
              openShareWindow(
                `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
                  shareUrl
                )}`
              )
            }
            data-tip="Share on LinkedIn."
          >
            in LinkedIn
          </button>
          <button
            className="share-action"
            type="button"
            onClick={() =>
              openShareWindow(
                `https://api.whatsapp.com/send?text=${encodeURIComponent(
                  `${shareText} ${shareUrl}`
                )}`
              )
            }
            data-tip="Share on WhatsApp."
          >
            WhatsApp
          </button>
        </div>
        {emailStatus ? <div className="share-status">{emailStatus}</div> : null}
      </div>
    </div>
  );
}
