import type { ReactNode } from "react";

const inlineRegex =
  /(\[[^\]]+\]\([^)]+\)|\*\*[^*]+\*\*|`[^`]+`|\*[^*]+\*|_[^_]+_|~~[^~]+~~|<u>[^<]+<\/u>|<s>[^<]+<\/s>|<del>[^<]+<\/del>)/;

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function stripWrapping(token: string) {
  if (token.startsWith("**") && token.endsWith("**")) {
    return token.slice(2, -2);
  }
  if (token.startsWith("`") && token.endsWith("`")) {
    return token.slice(1, -1);
  }
  if ((token.startsWith("*") && token.endsWith("*")) ||
    (token.startsWith("_") && token.endsWith("_"))) {
    return token.slice(1, -1);
  }
  if (token.startsWith("~~") && token.endsWith("~~")) {
    return token.slice(2, -2);
  }
  if (token.startsWith("<u>") && token.endsWith("</u>")) {
    return token.slice(3, -4);
  }
  if (token.startsWith("<s>") && token.endsWith("</s>")) {
    return token.slice(3, -4);
  }
  if (token.startsWith("<del>") && token.endsWith("</del>")) {
    return token.slice(5, -6);
  }
  return token;
}

function sanitizeHref(rawHref: string) {
  const trimmed = rawHref.trim();
  if (!trimmed) {
    return null;
  }
  if (trimmed.startsWith("#") || trimmed.startsWith("/")) {
    return trimmed;
  }
  try {
    const base =
      typeof window !== "undefined" ? window.location.origin : "https://example.com";
    const url = new URL(trimmed, base);
    const protocol = url.protocol.toLowerCase();
    if (protocol === "http:" || protocol === "https:" || protocol === "mailto:" || protocol === "tel:") {
      return url.href;
    }
  } catch {
    return null;
  }
  return null;
}

export function renderHighlightedText(
  text: string,
  keyPrefix: string,
  highlightQuery?: string
): ReactNode[] {
  const trimmedQuery = highlightQuery?.trim();
  if (!trimmedQuery) {
    return [text];
  }

  const regex = new RegExp(escapeRegExp(trimmedQuery), "gi");
  const nodes: ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let index = 0;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(text.slice(lastIndex, match.index));
    }
    nodes.push(<mark key={`${keyPrefix}-mark-${index}`}>{match[0]}</mark>);
    lastIndex = match.index + match[0].length;
    index += 1;
  }

  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }

  return nodes.length ? nodes : [text];
}

function renderInlineMarkdownLine(
  text: string,
  keyPrefix: string,
  highlightQuery?: string
): ReactNode[] {
  const nodes: ReactNode[] = [];
  let remaining = text;
  let tokenIndex = 0;

  while (remaining.length > 0) {
    const match = remaining.match(inlineRegex);
    if (!match || match.index === undefined) {
      nodes.push(
        ...renderHighlightedText(
          remaining,
          `${keyPrefix}-plain-${tokenIndex}`,
          highlightQuery
        )
      );
      break;
    }

    if (match.index > 0) {
      nodes.push(
        ...renderHighlightedText(
          remaining.slice(0, match.index),
          `${keyPrefix}-plain-${tokenIndex}`,
          highlightQuery
        )
      );
    }

    const token = match[0];
    const content = stripWrapping(token);
    const key = `${keyPrefix}-${tokenIndex}`;
    const highlightedContent = renderHighlightedText(
      content,
      `${keyPrefix}-token-${tokenIndex}`,
      highlightQuery
    );

    if (token.startsWith("[") && token.includes("](")) {
      const linkMatch = token.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
      if (linkMatch) {
        const [, label, href] = linkMatch;
        const safeHref = sanitizeHref(href);
        const linkLabel = label || href;
        if (safeHref) {
          nodes.push(
            <a key={key} href={safeHref} target="_blank" rel="noreferrer">
              {renderHighlightedText(
                linkLabel,
                `${keyPrefix}-link-${tokenIndex}`,
                highlightQuery
              )}
            </a>
          );
        } else {
          nodes.push(
            ...renderHighlightedText(
              linkLabel,
              `${keyPrefix}-link-${tokenIndex}`,
              highlightQuery
            )
          );
        }
      } else {
        nodes.push(
          ...renderHighlightedText(
            token,
            `${keyPrefix}-plain-${tokenIndex}`,
            highlightQuery
          )
        );
      }
    } else if (token.startsWith("**")) {
      nodes.push(<strong key={key}>{highlightedContent}</strong>);
    } else if (token.startsWith("`")) {
      nodes.push(<code key={key}>{content}</code>);
    } else if (token.startsWith("~~")) {
      nodes.push(<del key={key}>{highlightedContent}</del>);
    } else if (token.startsWith("<u>")) {
      nodes.push(<u key={key}>{highlightedContent}</u>);
    } else if (token.startsWith("<s>")) {
      nodes.push(<s key={key}>{highlightedContent}</s>);
    } else if (token.startsWith("<del>")) {
      nodes.push(<del key={key}>{highlightedContent}</del>);
    } else {
      nodes.push(<em key={key}>{highlightedContent}</em>);
    }

    remaining = remaining.slice(match.index + token.length);
    tokenIndex += 1;
  }

  return nodes;
}

export function renderInlineMarkdown(
  text: string,
  keyPrefix: string,
  highlightQuery?: string
): ReactNode[] {
  const lines = text.split("\n");
  const nodes: ReactNode[] = [];

  lines.forEach((line, lineIndex) => {
    if (lineIndex > 0) {
      nodes.push(<br key={`${keyPrefix}-br-${lineIndex}`} />);
    }
    nodes.push(
      ...renderInlineMarkdownLine(
        line,
        `${keyPrefix}-line-${lineIndex}`,
        highlightQuery
      )
    );
  });

  return nodes;
}

export function renderPlainText(
  text: string,
  keyPrefix: string,
  highlightQuery?: string
): ReactNode[] {
  const lines = text.split("\n");
  const nodes: ReactNode[] = [];

  lines.forEach((line, lineIndex) => {
    if (lineIndex > 0) {
      nodes.push(<br key={`${keyPrefix}-br-${lineIndex}`} />);
    }
    nodes.push(
      ...renderHighlightedText(
        line,
        `${keyPrefix}-plain-${lineIndex}`,
        highlightQuery
      )
    );
  });

  return nodes;
}
