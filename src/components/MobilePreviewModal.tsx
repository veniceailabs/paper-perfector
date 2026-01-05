import { useEffect, useRef, useState } from "react";
import type { Document } from "../models/DocumentSchema";
import { DocumentRenderer } from "../renderer/DocumentRenderer";
import { useFocusTrap } from "../hooks/useFocusTrap";
import "../styles/MobilePreviewModal.css";

type DeviceType = "iphone" | "android";

interface MobilePreviewModalProps {
  doc: Document;
  onClose: () => void;
}

export function MobilePreviewModal({ doc, onClose }: MobilePreviewModalProps) {
  const modalRef = useRef<HTMLDivElement | null>(null);
  const [device, setDevice] = useState<DeviceType>("iphone");

  useEffect(() => {
    const ua = navigator.userAgent.toLowerCase();
    if (ua.includes("android")) {
      setDevice("android");
    } else if (ua.includes("iphone") || ua.includes("ipad")) {
      setDevice("iphone");
    }
  }, []);

  useFocusTrap(modalRef, onClose);

  return (
    <div className="mobile-preview-backdrop" role="dialog" aria-modal="true" onClick={onClose}>
      <div
        className="mobile-preview-modal"
        ref={modalRef}
        tabIndex={-1}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mobile-preview-header">
          <div>
            <h2>Mobile Preview</h2>
            <p>Check the document layout on a phone before export.</p>
          </div>
          <button
            className="mobile-preview-close"
            type="button"
            onClick={onClose}
            data-tip="Close the mobile preview."
          >
            ✕
          </button>
        </div>

        <div className="mobile-preview-controls">
          <button
            className={`mobile-preview-toggle ${device === "iphone" ? "active" : ""}`}
            type="button"
            onClick={() => setDevice("iphone")}
            data-tip="Preview on an iPhone-sized frame."
          >
            iPhone
          </button>
          <button
            className={`mobile-preview-toggle ${device === "android" ? "active" : ""}`}
            type="button"
            onClick={() => setDevice("android")}
            data-tip="Preview on an Android-sized frame."
          >
            Android
          </button>
        </div>

        <div className={`mobile-preview-frame ${device}`}>
          <div className="mobile-preview-screen">
            <div className="mobile-preview-content">
              <DocumentRenderer doc={doc} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
