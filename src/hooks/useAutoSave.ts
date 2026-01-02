import { useEffect } from "react";
import type { Document } from "../models/DocumentSchema";

const STORAGE_KEY = "paper-perfector-autosave";

export function useAutoSave(doc: Document | null) {
  useEffect(() => {
    if (!doc) return;

    // Save to localStorage every time doc changes
    const timer = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(doc));
        console.log("✓ Document auto-saved");
      } catch (error) {
        console.error("Failed to save document:", error);
      }
    }, 1000); // Wait 1 second after last change before saving

    return () => clearTimeout(timer);
  }, [doc]);
}

export function loadAutoSavedDocument(): Document | null {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : null;
  } catch {
    return null;
  }
}

export function clearAutoSave() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore
  }
}
