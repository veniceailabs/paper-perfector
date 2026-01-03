import type { Document } from "../models/DocumentSchema";
import { exportToPdfBlob } from "./export";

function toBase64Url(bytes: Uint8Array) {
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  const base64 = btoa(binary);
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function fromBase64Url(encoded: string) {
  let base64 = encoded.replace(/-/g, "+").replace(/_/g, "/");
  const padLength = base64.length % 4;
  if (padLength) {
    base64 += "=".repeat(4 - padLength);
  }
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Encodes a document to a shareable URL hash
 */
export function encodeDocumentToUrl(doc: Document): string {
  const json = JSON.stringify(doc);
  const bytes = new TextEncoder().encode(json);
  const encoded = toBase64Url(bytes);
  return `${window.location.origin}?shared=${encoded}`;
}

/**
 * Decodes a document from URL hash
 */
export function decodeDocumentFromUrl(encoded: string): Document | null {
  try {
    const bytes = fromBase64Url(encoded);
    const decoded = new TextDecoder().decode(bytes);
    return JSON.parse(decoded);
  } catch {
    return null;
  }
}

/**
 * Gets the shared document from URL parameters
 */
export function getSharedDocumentFromUrl(): Document | null {
  const params = new URLSearchParams(window.location.search);
  const shared = params.get("shared");
  return shared ? decodeDocumentFromUrl(shared) : null;
}

/**
 * Copies share link to clipboard
 */
export async function copyShareLink(doc: Document): Promise<boolean> {
  try {
    const url = encodeDocumentToUrl(doc);
    await navigator.clipboard.writeText(url);
    return true;
  } catch {
    return false;
  }
}

function sanitizeFileName(name: string) {
  return name.replace(/[/\\?%*:|"<>]/g, "-").trim() || "document";
}

function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function shareLinkForEmail(doc: Document) {
  const shareUrl = encodeDocumentToUrl(doc);
  if (shareUrl.length <= 1800) {
    return shareUrl;
  }
  return window.location.origin;
}

/**
 * Opens email client with pre-filled subject/body
 * Downloads PDF for user to attach
 */
export async function emailDocument(
  doc: Document
): Promise<"shared" | "downloaded" | "link"> {
  const subject = encodeURIComponent(`Paper Perfector - ${doc.title}`);

  try {
    const pdfBlob = await exportToPdfBlob(doc.title);
    const fileName = `${sanitizeFileName(doc.title)}.pdf`;
    const file = new File([pdfBlob], fileName, { type: "application/pdf" });

    const shareData = {
      title: doc.title,
      text: "Paper Perfector PDF attached.",
      files: [file],
    };

    if (navigator.share && (!navigator.canShare || navigator.canShare(shareData))) {
      await navigator.share(shareData);
      return "shared";
    }

    downloadBlob(pdfBlob, fileName);

    const body = encodeURIComponent(
      `Hi,\n\nAttached is the PDF for "${doc.title}".\n\nIf you do not see it, attach "${fileName}" from your downloads.\n\n`
    );
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
    return "downloaded";
  } catch {
    const fallbackLink = shareLinkForEmail(doc);
    const body = encodeURIComponent(
      `Hi,\n\nHere is the document: "${doc.title}"\n\n${fallbackLink}\n\n`
    );
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
    return "link";
  }
}
