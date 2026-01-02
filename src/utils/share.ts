import type { Document } from "../models/DocumentSchema";

/**
 * Encodes a document to a shareable URL hash
 */
export function encodeDocumentToUrl(doc: Document): string {
  const encoded = btoa(JSON.stringify(doc));
  return `${window.location.origin}?shared=${encoded}`;
}

/**
 * Decodes a document from URL hash
 */
export function decodeDocumentFromUrl(encoded: string): Document | null {
  try {
    const decoded = atob(encoded);
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
