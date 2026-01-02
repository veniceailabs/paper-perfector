import type { Document, Section } from "../models/DocumentSchema";

const headingMap: Record<string, Section["level"]> = {
  h2: 1,
  h3: 2,
  h4: 3,
  h1: 1,
};

function normalizeText(text: string) {
  return text.replace(/\s+/g, " ").trim();
}

function elementText(element: Element) {
  return normalizeText(element.textContent ?? "");
}

function listToParagraphs(list: HTMLUListElement | HTMLOListElement) {
  return Array.from(list.querySelectorAll("li"))
    .map((item) => elementText(item))
    .filter((text) => text.length > 0)
    .map((text) => `- ${text}`);
}

export async function importFromHtml(file: File): Promise<Document> {
  const html = await file.text();
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");
  const body = doc.body;

  const titleElement = body.querySelector("h1") ?? doc.querySelector("title");
  const title = elementText(titleElement ?? body) ||
    file.name.replace(/\.[^.]+$/, "");

  const subtitleElement = body.querySelector("h2");
  const subtitle = subtitleElement ? elementText(subtitleElement) : undefined;

  const metadata: Record<string, string> = { Source: file.name };
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
