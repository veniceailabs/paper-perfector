import type { Document, Section } from "../models/DocumentSchema";

const headingMap: Record<string, Section["level"]> = {
  h2: 1,
  h3: 2,
  h4: 3,
  h1: 1,
};

function normalizeText(text: string) {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function serializeNode(node: Node): string {
  if (node.nodeType === Node.TEXT_NODE) {
    return node.textContent ?? "";
  }

  if (node.nodeType !== Node.ELEMENT_NODE) {
    return "";
  }

  const element = node as Element;
  const tag = element.tagName.toLowerCase();

  if (tag === "a") {
    const href = element.getAttribute("href") ?? "";
    const label = element.textContent?.trim() ?? "";
    if (!href) {
      return label;
    }
    const display = label || href;
    return `[${display}](${href})`;
  }

  if (tag === "br") {
    return "\n";
  }

  let content = "";
  element.childNodes.forEach((child) => {
    content += serializeNode(child);
  });
  return content;
}

function elementText(element: Element) {
  return normalizeText(serializeNode(element));
}

function listToParagraphs(list: HTMLUListElement | HTMLOListElement) {
  return Array.from(list.querySelectorAll("li"))
    .map((item) => elementText(item))
    .filter((text) => text.length > 0)
    .map((text) => `- ${text}`);
}

type HtmlImportOptions = {
  sourceLabel?: string;
  fileName?: string;
};

function importFromHtmlText(
  html: string,
  options: HtmlImportOptions = {}
): Document {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");
  const body = doc.body;

  const titleElement = body.querySelector("h1") ?? doc.querySelector("title");
  const fallbackTitle =
    options.fileName?.replace(/\.[^.]+$/, "") ?? "Untitled Document";
  const title = elementText(titleElement ?? body) || fallbackTitle;

  const subtitleElement = body.querySelector("h2");
  const subtitle = subtitleElement ? elementText(subtitleElement) : undefined;

  const metadata: Record<string, string> = {};
  if (options.sourceLabel) {
    metadata.Source = options.sourceLabel;
  }
  doc.querySelectorAll("meta[name][content]").forEach((meta) => {
    metadata[meta.getAttribute("name") ?? ""] =
      meta.getAttribute("content") ?? "";
  });

  const sections: Section[] = [];
  let currentSection: Section | null = null;

  const ensureSection = () => {
    if (!currentSection) {
      currentSection = {
        id: `section-${sections.length + 1}`,
        level: 1,
        title: "Overview",
        body: [],
      };
    }
  };

  const pushSection = () => {
    if (currentSection) {
      sections.push(currentSection);
      currentSection = null;
    }
  };

  const elements = Array.from(
    body.querySelectorAll("h1, h2, h3, h4, p, pre, code, ul, ol")
  );

  elements.forEach((element) => {
    const tag = element.tagName.toLowerCase();
    const text = elementText(element);

    if (tag.startsWith("h")) {
      if (text.length === 0) {
        return;
      }
      pushSection();
      currentSection = {
        id: `section-${sections.length + 1}`,
        level: headingMap[tag] ?? 1,
        title: text,
        body: [],
      };
      return;
    }

    if (tag === "ul" || tag === "ol") {
      ensureSection();
      currentSection?.body.push(...listToParagraphs(element as HTMLUListElement));
      return;
    }

    if (tag === "pre" || tag === "code") {
      ensureSection();
      if (!currentSection) {
        return;
      }
      currentSection.monoBlocks = currentSection.monoBlocks ?? [];
      currentSection.monoBlocks.push(text);
      return;
    }

    if (tag === "p") {
      if (text.length === 0) {
        return;
      }
      ensureSection();
      currentSection?.body.push(text);
    }
  });

  pushSection();

  return {
    title,
    subtitle,
    metadata,
    sections,
  };
}

export async function importFromHtml(file: File): Promise<Document> {
  const html = await file.text();
  return importFromHtmlText(html, {
    sourceLabel: file.name,
    fileName: file.name,
  });
}

export { importFromHtmlText };
