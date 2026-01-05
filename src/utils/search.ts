import type { Document } from "../models/DocumentSchema";
import type { SearchScope } from "../models/Search";

type ReplaceTextResult = {
  value: string;
  count: number;
};

export type ReplaceCursor = {
  kind:
    | "title"
    | "subtitle"
    | "metadata"
    | "section-title"
    | "section-body"
    | "section-mono";
  sectionIndex?: number;
  entryIndex?: number;
  metaKey?: string;
  offset: number;
};

type ReplaceNextResult = {
  doc: Document;
  count: number;
  cursor: ReplaceCursor | null;
};

export function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function replaceInText(
  text: string,
  query: string,
  replacement: string,
  replaceAll: boolean
): ReplaceTextResult {
  const trimmedQuery = query.trim();
  if (!trimmedQuery) {
    return { value: text, count: 0 };
  }

  const regex = new RegExp(escapeRegExp(trimmedQuery), replaceAll ? "gi" : "i");
  const matches = text.match(regex);
  if (!matches) {
    return { value: text, count: 0 };
  }

  const nextValue = text.replace(regex, replacement);
  return { value: nextValue, count: replaceAll ? matches.length : 1 };
}

export function replaceNextInText(
  text: string,
  query: string,
  replacement: string,
  cursorOffset: number | null
) {
  const trimmedQuery = query.trim();
  if (!trimmedQuery) {
    return { value: text, count: 0, cursorOffset: null };
  }

  const lowerText = text.toLowerCase();
  const lowerQuery = trimmedQuery.toLowerCase();
  const startIndex = cursorOffset ?? 0;
  const matchIndex = lowerText.indexOf(lowerQuery, startIndex);
  if (matchIndex === -1) {
    return { value: text, count: 0, cursorOffset: null };
  }

  const nextValue =
    text.slice(0, matchIndex) +
    replacement +
    text.slice(matchIndex + trimmedQuery.length);
  return {
    value: nextValue,
    count: 1,
    cursorOffset: matchIndex + replacement.length,
  };
}

function kindInScope(kind: ReplaceCursor["kind"], scope: SearchScope) {
  if (kind === "title" || kind === "subtitle" || kind === "section-title") {
    return scope.title;
  }
  if (kind === "metadata") {
    return scope.metadata;
  }
  return scope.body;
}

function matchesCursor(target: ReplaceCursor, cursor: ReplaceCursor) {
  return (
    target.kind === cursor.kind &&
    target.sectionIndex === cursor.sectionIndex &&
    target.entryIndex === cursor.entryIndex &&
    target.metaKey === cursor.metaKey
  );
}

export function replaceNextInDocument(
  doc: Document,
  query: string,
  replacement: string,
  scope: SearchScope,
  cursor: ReplaceCursor | null
): ReplaceNextResult {
  const trimmedQuery = query.trim();
  if (!trimmedQuery) {
    return { doc, count: 0, cursor: null };
  }

  const effectiveCursor =
    cursor && kindInScope(cursor.kind, scope) ? cursor : null;

  const attemptReplace = (
    text: string,
    targetCursor: ReplaceCursor,
    startOffset: number
  ) => {
    const lowerText = text.toLowerCase();
    const lowerQuery = trimmedQuery.toLowerCase();
    const matchIndex = lowerText.indexOf(lowerQuery, startOffset);
    if (matchIndex === -1) {
      return null;
    }
    return {
      value:
        text.slice(0, matchIndex) +
        replacement +
        text.slice(matchIndex + trimmedQuery.length),
      cursor: {
        ...targetCursor,
        offset: matchIndex + replacement.length,
      },
    };
  };

  const scan = (startFromCursor: boolean): ReplaceNextResult | null => {
    let reachedCursor = !startFromCursor;

    if (scope.title) {
      const titleCursor: ReplaceCursor = { kind: "title", offset: 0 };
      if (!reachedCursor && effectiveCursor && matchesCursor(titleCursor, effectiveCursor)) {
        reachedCursor = true;
      }
      if (reachedCursor) {
        const startOffset =
          effectiveCursor && matchesCursor(titleCursor, effectiveCursor)
            ? effectiveCursor.offset
            : 0;
        const result = attemptReplace(doc.title, titleCursor, startOffset);
        if (result) {
          return {
            doc: { ...doc, title: result.value },
            count: 1,
            cursor: result.cursor,
          };
        }
      }

      if (doc.subtitle) {
        const subtitleCursor: ReplaceCursor = { kind: "subtitle", offset: 0 };
        if (!reachedCursor && effectiveCursor && matchesCursor(subtitleCursor, effectiveCursor)) {
          reachedCursor = true;
        }
        if (reachedCursor) {
          const startOffset =
            effectiveCursor && matchesCursor(subtitleCursor, effectiveCursor)
              ? effectiveCursor.offset
              : 0;
          const result = attemptReplace(doc.subtitle, subtitleCursor, startOffset);
          if (result) {
            return {
              doc: { ...doc, subtitle: result.value },
              count: 1,
              cursor: result.cursor,
            };
          }
        }
      }
    }

    if (scope.metadata) {
      const keys = Object.keys(doc.metadata ?? {}).sort();
      for (const key of keys) {
        const text = doc.metadata[key] ?? "";
        const metaCursor: ReplaceCursor = { kind: "metadata", metaKey: key, offset: 0 };
        if (!reachedCursor && effectiveCursor && matchesCursor(metaCursor, effectiveCursor)) {
          reachedCursor = true;
        }
        if (!reachedCursor) {
          continue;
        }
        const startOffset =
          effectiveCursor && matchesCursor(metaCursor, effectiveCursor)
            ? effectiveCursor.offset
            : 0;
        const result = attemptReplace(text, metaCursor, startOffset);
        if (result) {
          return {
            doc: {
              ...doc,
              metadata: {
                ...doc.metadata,
                [key]: result.value,
              },
            },
            count: 1,
            cursor: result.cursor,
          };
        }
      }
    }

    const sections = doc.sections;
    for (let sectionIndex = 0; sectionIndex < sections.length; sectionIndex += 1) {
      const section = sections[sectionIndex];

      if (scope.title) {
        const sectionTitleCursor: ReplaceCursor = {
          kind: "section-title",
          sectionIndex,
          offset: 0,
        };
        if (!reachedCursor && effectiveCursor && matchesCursor(sectionTitleCursor, effectiveCursor)) {
          reachedCursor = true;
        }
        if (reachedCursor) {
          const startOffset =
            effectiveCursor && matchesCursor(sectionTitleCursor, effectiveCursor)
              ? effectiveCursor.offset
              : 0;
          const result = attemptReplace(section.title, sectionTitleCursor, startOffset);
          if (result) {
            const nextSections = [...sections];
            nextSections[sectionIndex] = { ...section, title: result.value };
            return {
              doc: { ...doc, sections: nextSections },
              count: 1,
              cursor: result.cursor,
            };
          }
        }
      }

      if (!scope.body) {
        continue;
      }

      for (let bodyIndex = 0; bodyIndex < section.body.length; bodyIndex += 1) {
        const paragraph = section.body[bodyIndex];
        const paragraphCursor: ReplaceCursor = {
          kind: "section-body",
          sectionIndex,
          entryIndex: bodyIndex,
          offset: 0,
        };
        if (!reachedCursor && effectiveCursor && matchesCursor(paragraphCursor, effectiveCursor)) {
          reachedCursor = true;
        }
        if (!reachedCursor) {
          continue;
        }
        const startOffset =
          effectiveCursor && matchesCursor(paragraphCursor, effectiveCursor)
            ? effectiveCursor.offset
            : 0;
        const result = attemptReplace(paragraph, paragraphCursor, startOffset);
        if (result) {
          const nextSections = [...sections];
          const nextBody = [...section.body];
          nextBody[bodyIndex] = result.value;
          nextSections[sectionIndex] = { ...section, body: nextBody };
          return {
            doc: { ...doc, sections: nextSections },
            count: 1,
            cursor: result.cursor,
          };
        }
      }

      if (section.monoBlocks?.length) {
        for (let monoIndex = 0; monoIndex < section.monoBlocks.length; monoIndex += 1) {
          const block = section.monoBlocks[monoIndex];
          const blockCursor: ReplaceCursor = {
            kind: "section-mono",
            sectionIndex,
            entryIndex: monoIndex,
            offset: 0,
          };
          if (!reachedCursor && effectiveCursor && matchesCursor(blockCursor, effectiveCursor)) {
            reachedCursor = true;
          }
          if (!reachedCursor) {
            continue;
          }
          const startOffset =
            effectiveCursor && matchesCursor(blockCursor, effectiveCursor)
              ? effectiveCursor.offset
              : 0;
          const result = attemptReplace(block, blockCursor, startOffset);
          if (result) {
            const nextSections = [...sections];
            const nextMono = [...section.monoBlocks];
            nextMono[monoIndex] = result.value;
            nextSections[sectionIndex] = { ...section, monoBlocks: nextMono };
            return {
              doc: { ...doc, sections: nextSections },
              count: 1,
              cursor: result.cursor,
            };
          }
        }
      }
    }

    return null;
  };

  const firstPass = scan(true);
  if (firstPass) {
    return firstPass;
  }

  if (effectiveCursor) {
    const secondPass = scan(false);
    if (secondPass) {
      return secondPass;
    }
  }

  return { doc, count: 0, cursor: effectiveCursor ?? null };
}

export function replaceInDocument(
  doc: Document,
  query: string,
  replacement: string,
  scope: SearchScope,
  replaceAll: boolean
) {
  const trimmedQuery = query.trim();
  if (!trimmedQuery) {
    return { doc, count: 0 };
  }

  let count = 0;
  let replaced = false;

  const applyReplace = (text: string) => {
    if (!replaceAll && replaced) {
      return { value: text, count: 0 };
    }
    const result = replaceInText(text, trimmedQuery, replacement, replaceAll);
    if (!replaceAll && result.count > 0) {
      replaced = true;
    }
    count += result.count;
    return result.value;
  };

  let nextTitle = doc.title;
  let nextSubtitle = doc.subtitle;
  if (scope.title) {
    nextTitle = applyReplace(doc.title);
    if (doc.subtitle) {
      nextSubtitle = applyReplace(doc.subtitle);
    }
  }

  let nextMetadata = doc.metadata;
  if (scope.metadata && Object.keys(doc.metadata).length > 0) {
    let changed = false;
    const updated: Record<string, string> = {};
    Object.entries(doc.metadata).forEach(([key, value]) => {
      const nextValue = applyReplace(value);
      if (nextValue !== value) {
        changed = true;
      }
      updated[key] = nextValue;
    });
    if (changed) {
      nextMetadata = updated;
    }
  }

  let nextSections = doc.sections;
  if (scope.title || scope.body) {
    let sectionsChanged = false;
    nextSections = doc.sections.map((section) => {
      let sectionChanged = false;
      let nextSectionTitle = section.title;
      if (scope.title) {
        const updatedTitle = applyReplace(section.title);
        if (updatedTitle !== section.title) {
          sectionChanged = true;
          nextSectionTitle = updatedTitle;
        }
      }

      let nextBody = section.body;
      if (scope.body && section.body.length > 0) {
        let bodyChanged = false;
        nextBody = section.body.map((paragraph) => {
          const updatedParagraph = applyReplace(paragraph);
          if (updatedParagraph !== paragraph) {
            bodyChanged = true;
          }
          return updatedParagraph;
        });
        if (bodyChanged) {
          sectionChanged = true;
        }
      }

      let nextMonoBlocks = section.monoBlocks;
      if (scope.body && section.monoBlocks?.length) {
        let monoChanged = false;
        nextMonoBlocks = section.monoBlocks.map((block) => {
          const updatedBlock = applyReplace(block);
          if (updatedBlock !== block) {
            monoChanged = true;
          }
          return updatedBlock;
        });
        if (monoChanged) {
          sectionChanged = true;
        }
      }

      if (sectionChanged) {
        sectionsChanged = true;
        return {
          ...section,
          title: nextSectionTitle,
          body: nextBody,
          monoBlocks: nextMonoBlocks,
        };
      }

      return section;
    });

    if (!sectionsChanged) {
      nextSections = doc.sections;
    }
  }

  if (count === 0) {
    return { doc, count };
  }

  return {
    doc: {
      ...doc,
      title: nextTitle,
      subtitle: nextSubtitle,
      metadata: nextMetadata,
      sections: nextSections,
    },
    count,
  };
}
