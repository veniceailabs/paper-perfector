import { useEffect } from "react";
import type { Document } from "../models/DocumentSchema";
import { saveDraft } from "../utils/draft";

type DraftAutoSaveOptions = {
  docId: string | null | undefined;
  doc: Document;
  mode: "structured" | "markdown";
  markdown?: string;
  enabled: boolean;
  debounceMs?: number;
};

export function useDraftAutoSave({
  docId,
  doc,
  mode,
  markdown,
  enabled,
  debounceMs = 1000,
}: DraftAutoSaveOptions) {
  useEffect(() => {
    if (!docId || !enabled) {
      return;
    }

    const timer = window.setTimeout(() => {
      saveDraft({
        docId,
        savedAt: new Date().toISOString(),
        mode,
        doc,
        markdown,
      });
    }, debounceMs);

    return () => window.clearTimeout(timer);
  }, [debounceMs, doc, docId, enabled, markdown, mode]);
}
