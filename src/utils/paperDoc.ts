import type { Document } from "../models/DocumentSchema";

export type PaperDocFile = {
  version: 1;
  id?: string;
  savedAt: string;
  doc: Document;
};

export function serializePaperDoc(doc: Document, id?: string) {
  const payload: PaperDocFile = {
    version: 1,
    id,
    savedAt: new Date().toISOString(),
    doc,
  };
  return JSON.stringify(payload, null, 2);
}

export function parsePaperDoc(raw: string): PaperDocFile | null {
  try {
    const parsed = JSON.parse(raw) as Partial<PaperDocFile>;
    if (!parsed || typeof parsed !== "object") {
      return null;
    }
    if (!parsed.doc || typeof parsed.doc !== "object") {
      if ("title" in parsed && "sections" in parsed && "metadata" in parsed) {
        return {
          version: 1,
          savedAt: new Date().toISOString(),
          doc: parsed as unknown as Document,
        };
      }
      return null;
    }
    return {
      version: 1,
      id: typeof parsed.id === "string" ? parsed.id : undefined,
      savedAt: typeof parsed.savedAt === "string" ? parsed.savedAt : new Date().toISOString(),
      doc: parsed.doc as Document,
    };
  } catch {
    return null;
  }
}
