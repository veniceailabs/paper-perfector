import { useMemo, useRef, useState } from "react";
import type { Document } from "../models/DocumentSchema";
import { encodeDocumentToUrl, emailDocument } from "../utils/share";
import { downloadTextFile } from "../utils/download";
import { serializePaperDoc } from "../utils/paperDoc";
import { useFocusTrap } from "../hooks/useFocusTrap";
import {
  IconAccessCode,
  IconCopyLink,
  IconEmailInvite,
  IconIntegrity,
} from "./icons/CustomIcons";
import "../styles/ShareModal.css";

type ShareModalProps = {
  doc: Document;
  docId?: string | null;
  onClose: () => void;
};

function generateAccessCode() {
  return `DOC-${Math.floor(1000 + Math.random() * 9000)}`;
}

async function copyToClipboard(text: string) {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // Fallback below.
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
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteStatus, setInviteStatus] = useState<string | null>(null);
  const [copyStatus, setCopyStatus] = useState<string | null>(null);
  const [emailStatus, setEmailStatus] = useState<string | null>(null);
  const [isEmailing, setIsEmailing] = useState(false);
  const [accessCode, setAccessCode] = useState(generateAccessCode());

  const sanitizeFileName = (name: string) =>
    name.replace(/[/\\?%*:|"<>]/g, "-").trim() || "document";

  const handleDownload = () => {
    const fileName = `${sanitizeFileName(doc.title)}.ppdoc`;
    downloadTextFile(serializePaperDoc(doc, docId ?? undefined), fileName);
  };

  const handleSendInvite = () => {
    const email = inviteEmail.trim();
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      setInviteStatus("Enter a valid reviewer email address.");
      return;
    }
    setInviteStatus(`Invite prepared for ${email}.`);
    setInviteEmail("");
    setTimeout(() => setInviteStatus(null), 2500);
  };

  const handleCopyCode = async () => {
    const success = await copyToClipboard(accessCode);
    setCopyStatus(success ? "Code copied." : "Unable to copy code.");
    setTimeout(() => setCopyStatus(null), 2000);
  };

  const handleCopyLink = async () => {
    const success = await copyToClipboard(shareUrl);
    setCopyStatus(success ? "Link copied." : "Unable to copy link.");
    setTimeout(() => setCopyStatus(null), 2000);
  };

  const handleEmailPdf = async () => {
    setIsEmailing(true);
    setEmailStatus("Preparing PDF...");
    const result = await emailDocument(doc);
    if (result === "shared") {
      setEmailStatus("Share sheet opened.");
    } else if (result === "downloaded") {
      setEmailStatus("PDF downloaded. Attach it to your email.");
    } else {
      setEmailStatus("Opening email with link.");
    }
    setIsEmailing(false);
    setTimeout(() => setEmailStatus(null), 3000);
  };

  useFocusTrap(modalRef, onClose);

  return (
    <div
      className="share-modal-backdrop"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="share-modal"
        ref={modalRef}
        tabIndex={-1}
        onClick={(event) => event.stopPropagation()}
      >
        <header className="share-modal-header">
          <div className="share-title-block">
            <IconIntegrity size={22} color="var(--accent)" />
            <div>
              <h2>Collaborate & Review</h2>
              <p>Invite reviewers and share controlled access to this paper.</p>
            </div>
          </div>
          <button
            className="share-modal-close"
            type="button"
            onClick={onClose}
            aria-label="Close share modal"
          >
            X
          </button>
        </header>

        <section className="share-section">
          <label>Invite Peer Reviewers</label>
          <div className="share-input-group">
            <span className="share-input-icon">
              <IconEmailInvite size={17} />
            </span>
            <input
              type="email"
              placeholder="colleague@university.edu"
              value={inviteEmail}
              onChange={(event) => setInviteEmail(event.target.value)}
            />
            <button className="share-btn-primary" type="button" onClick={handleSendInvite}>
              Send Invite
            </button>
          </div>
          {inviteStatus ? <div className="share-status">{inviteStatus}</div> : null}
        </section>

        <section className="share-section share-code-box">
          <div className="share-section-header">
            <div className="share-label-with-icon">
              <IconAccessCode size={17} />
              <span>One-Time Access Code</span>
            </div>
            <button
              className="share-btn-ghost"
              type="button"
              onClick={() => setAccessCode(generateAccessCode())}
            >
              Generate New
            </button>
          </div>

          <div className="share-code-display">
            <span className="share-code-value">{accessCode}</span>
            <button
              className="share-btn-icon"
              type="button"
              onClick={handleCopyCode}
              aria-label="Copy access code"
            >
              <IconCopyLink size={16} />
            </button>
          </div>
          <p className="share-code-expiry">Expires in 24 hours • View-only access</p>
        </section>

        <section className="share-section">
          <label>Document link</label>
          <div className="share-link-box">{shareUrl}</div>
        </section>

        <footer className="share-footer">
          <button className="share-btn-link" type="button" onClick={handleCopyLink}>
            <IconCopyLink size={16} />
            Copy Document Link
          </button>
          <button
            className="share-btn-link"
            type="button"
            onClick={handleEmailPdf}
            disabled={isEmailing}
          >
            <IconEmailInvite size={16} />
            Email PDF
          </button>
          <button className="share-btn-link" type="button" onClick={handleDownload}>
            Download .ppdoc
          </button>
          <button className="share-btn-secondary" type="button" onClick={onClose}>
            Close
          </button>
        </footer>

        {copyStatus ? <div className="share-status">{copyStatus}</div> : null}
        {emailStatus ? <div className="share-status">{emailStatus}</div> : null}
      </div>
    </div>
  );
}
