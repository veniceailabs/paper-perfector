import type { ReactNode } from "react";

const inlineRegex = /(\*\*[^*]+\*\*|`[^`]+`|\*[^*]+\*|_[^_]+_)/;

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
  return token;
}

function renderInlineMarkdownLine(text: string, keyPrefix: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  let remaining = text;
  let tokenIndex = 0;

  while (remaining.length > 0) {
    const match = remaining.match(inlineRegex);
    if (!match || match.index === undefined) {
      nodes.push(remaining);
      break;
    }

    if (match.index > 0) {
      nodes.push(remaining.slice(0, match.index));
    }

    const token = match[0];
    const content = stripWrapping(token);
    const key = `${keyPrefix}-${tokenIndex}`;

    if (token.startsWith("**")) {
      nodes.push(<strong key={key}>{content}</strong>);
    } else if (token.startsWith("`")) {
      nodes.push(<code key={key}>{content}</code>);
    } else {
      nodes.push(<em key={key}>{content}</em>);
    }

    remaining = remaining.slice(match.index + token.length);
    tokenIndex += 1;
  }

  return nodes;
}

export function renderInlineMarkdown(text: string, keyPrefix: string): ReactNode[] {
  const lines = text.split("\n");
  const nodes: ReactNode[] = [];

  lines.forEach((line, lineIndex) => {
    if (lineIndex > 0) {
      nodes.push(<br key={`${keyPrefix}-br-${lineIndex}`} />);
    }
    nodes.push(...renderInlineMarkdownLine(line, `${keyPrefix}-line-${lineIndex}`));
  });

  return nodes;
}
