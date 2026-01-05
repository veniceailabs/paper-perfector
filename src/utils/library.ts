import type { Document } from "../models/DocumentSchema";
import { createId } from "./id";

export type SavedDocumentVersion = {
  id: string;
  savedAt: string;
  doc: Document;
};

export type SavedDocument = {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  doc: Document;
  versions: SavedDocumentVersion[];
};

const LIBRARY_KEY = "paper-perfector-library";
const DEFAULT_MAX_VERSIONS = 10;

function loadRawLibrary(): SavedDocument[] {
  try {
    const raw = localStorage.getItem(LIBRARY_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw) as SavedDocument[];
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed.filter((entry) => entry && typeof entry.id === "string");
  } catch {
    return [];
  }
}

function saveRawLibrary(entries: SavedDocument[]) {
  try {
    localStorage.setItem(LIBRARY_KEY, JSON.stringify(entries));
  } catch {
    // Ignore storage failures.
  }
}

export function loadLibrary(): SavedDocument[] {
  return loadRawLibrary();
}

export function saveDocumentToLibrary(
  doc: Document,
  docId?: string,
  options: { maxVersions?: number } = {}
) {
  const entries = loadRawLibrary();
  const now = new Date().toISOString();
  const id = docId ?? createId("doc");
  const maxVersions = options.maxVersions ?? DEFAULT_MAX_VERSIONS;
  const existingIndex = entries.findIndex((entry) => entry.id === id);

  if (existingIndex >= 0) {
    const existing = entries[existingIndex];
    const nextVersions = [
      { id: createId("version"), savedAt: now, doc: existing.doc },
      ...existing.versions,
    ].slice(0, maxVersions);
    const updated: SavedDocument = {
      ...existing,
      title: doc.title,
      updatedAt: now,
      doc,
      versions: nextVersions,
    };
    const nextEntries = [...entries];
    nextEntries[existingIndex] = updated;
    saveRawLibrary(nextEntries);
    return updated;
  }

  const created: SavedDocument = {
    id,
    title: doc.title,
    createdAt: now,
    updatedAt: now,
    doc,
    versions: [],
  };
  const nextEntries = [created, ...entries];
  saveRawLibrary(nextEntries);
  return created;
}

export function deleteDocumentFromLibrary(id: string) {
  const entries = loadRawLibrary();
  const nextEntries = entries.filter((entry) => entry.id !== id);
  saveRawLibrary(nextEntries);
  return nextEntries;
}

export function getSavedDocument(id: string) {
  const entries = loadRawLibrary();
  return entries.find((entry) => entry.id === id) ?? null;
}
