import type { Section as SectionType } from "../models/DocumentSchema";
import MonoBlock from "./MonoBlock";
import Divider from "./Divider";
import { renderInlineMarkdown, renderPlainText } from "./inlineMarkdown";

const headingTags = {
  1: "h2",
  2: "h3",
  3: "h4",
} as const;

export default function Section({
  level,
  title,
  body,
  monoBlocks,
  highlightQuery,
  renderMarkdown = true,
}: SectionType & { highlightQuery?: string; renderMarkdown?: boolean }) {
  const HeadingTag = headingTags[level];
  const listItemRegex = /^[-*+]\s+(.+)$/;
  const orderedItemRegex = /^\d+\.\s+(.+)$/;
  const dividerRegex = /^---$|^\*\*\*$|^___$/;
  const blockQuoteRegex = /^>\s?/;
  const renderText = (text: string, keyPrefix: string) =>
    renderMarkdown
      ? renderInlineMarkdown(text, keyPrefix, highlightQuery)
      : renderPlainText(text, keyPrefix, highlightQuery);

  const renderedBody = () => {
    if (!renderMarkdown) {
      return body.map((paragraph, index) => {
        if (!paragraph.trim()) {
          return <div className="paper-spacer" key={`${title}-spacer-${index}`} />;
        }
        return (
          <p key={`${title}-${index}`}>
            {renderText(paragraph, `${title}-${index}`)}
          </p>
        );
      });
    }

    const blocks: JSX.Element[] = [];
    let listBuffer: { type: "ul" | "ol"; items: string[] } | null = null;

    const flushList = (keyIndex: number) => {
      if (!listBuffer) {
        return;
      }
      const items = listBuffer.items.map((item, itemIndex) => (
        <li key={`list-${keyIndex}-${itemIndex}`}>
          {renderText(item, `list-${keyIndex}-${itemIndex}`)}
        </li>
      ));
      blocks.push(
        listBuffer.type === "ol" ? (
          <ol key={`list-${keyIndex}`}>{items}</ol>
        ) : (
          <ul key={`list-${keyIndex}`}>{items}</ul>
        )
      );
      listBuffer = null;
    };

    body.forEach((paragraph, index) => {
      const trimmed = paragraph.trim();

      if (!trimmed) {
        flushList(index);
        blocks.push(<div className="paper-spacer" key={`${title}-spacer-${index}`} />);
        return;
      }

      const isDivider = dividerRegex.test(trimmed);
      const unorderedMatch = trimmed.match(listItemRegex);
      const orderedMatch = trimmed.match(orderedItemRegex);
      const isBlockQuote = blockQuoteRegex.test(trimmed);

      if (isDivider) {
        flushList(index);
        blocks.push(<Divider key={`divider-${index}`} />);
        return;
      }

      if (unorderedMatch) {
        if (!listBuffer || listBuffer.type !== "ul") {
          flushList(index);
          listBuffer = { type: "ul", items: [] };
        }
        listBuffer.items.push(unorderedMatch[1]);
        return;
      }

      if (orderedMatch) {
        if (!listBuffer || listBuffer.type !== "ol") {
          flushList(index);
          listBuffer = { type: "ol", items: [] };
        }
        listBuffer.items.push(orderedMatch[1]);
        return;
      }

      if (isBlockQuote) {
        flushList(index);
        const cleaned = paragraph
          .split("\n")
          .map((line) => line.replace(blockQuoteRegex, ""))
          .join("\n")
          .trim();
        blocks.push(
          <blockquote key={`blockquote-${index}`}>
            {renderText(cleaned, `${title}-quote-${index}`)}
          </blockquote>
        );
        return;
      }

      flushList(index);
      blocks.push(
        <p key={`${title}-${index}`}>
          {renderText(paragraph, `${title}-${index}`)}
        </p>
      );
    });

    flushList(body.length);
    return blocks;
  };

  return (
    <section className={`paper-section level-${level}`}>
      <HeadingTag>
        {renderText(title, `heading-${title}`)}
      </HeadingTag>
      {renderedBody()}
      {monoBlocks?.map((block, index) => (
        <MonoBlock content={block} key={`${title}-mono-${index}`} />
      ))}
    </section>
  );
}
