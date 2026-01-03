import type { Document } from "../models/DocumentSchema";

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

/**
 * Opens email client with pre-filled subject/body
 * Downloads PDF for user to attach
 */
export function emailDocument(doc: Document) {
  const subject = encodeURIComponent(`Paper Perfector - ${doc.title}`);
  const body = encodeURIComponent(
    `Hi,\n\nI've created a document using Paper Perfector: "${doc.title}"\n\nYou can view it at: ${window.location.origin}\n\nBest regards`
  );

  // Open email client with pre-filled content
  window.location.href = `mailto:?subject=${subject}&body=${body}`;
}
