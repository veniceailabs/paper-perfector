import type { Document } from "../models/DocumentSchema";

export type DraftPayload = {
  docId: string;
  savedAt: string;
  mode: "structured" | "markdown";
  doc: Document;
  markdown?: string;
};

const DRAFT_PREFIX = "paper-perfector-draft:";
const LAST_DRAFT_KEY = "paper-perfector-last-draft";

function draftKey(docId: string) {
  return `${DRAFT_PREFIX}${docId}`;
}

export function loadDraft(docId: string): DraftPayload | null {
  try {
    const raw = localStorage.getItem(draftKey(docId));
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw) as DraftPayload;
    if (!parsed || typeof parsed !== "object") {
      return null;
    }
    if (!parsed.doc || typeof parsed.doc !== "object") {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function loadLastDraft(): DraftPayload | null {
  try {
    const raw = localStorage.getItem(LAST_DRAFT_KEY);
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw) as DraftPayload;
    if (!parsed || typeof parsed !== "object") {
      return null;
    }
    if (!parsed.doc || typeof parsed.doc !== "object") {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function saveDraft(payload: DraftPayload) {
  try {
    localStorage.setItem(draftKey(payload.docId), JSON.stringify(payload));
    localStorage.setItem(LAST_DRAFT_KEY, JSON.stringify(payload));
  } catch {
    // Ignore storage failures.
  }
}

export function clearDraft(docId: string) {
  try {
    localStorage.removeItem(draftKey(docId));
    const lastDraft = loadLastDraft();
    if (lastDraft?.docId === docId) {
      localStorage.removeItem(LAST_DRAFT_KEY);
    }
  } catch {
    // Ignore storage failures.
  }
}
