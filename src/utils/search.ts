import type { Document } from "../models/DocumentSchema";
import type { SearchScope } from "../models/Search";

type ReplaceTextResult = {
  value: string;
  count: number;
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
