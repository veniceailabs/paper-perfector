import type { Section as SectionType } from "../models/DocumentSchema";
import MonoBlock from "./MonoBlock";
import Divider from "./Divider";
import { renderInlineMarkdown } from "./inlineMarkdown";

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
}: SectionType) {
  const HeadingTag = headingTags[level];
  const listItemRegex = /^[-*+]\s+(.+)$/;
  const orderedItemRegex = /^\d+\.\s+(.+)$/;
  const dividerRegex = /^---$|^\*\*\*$|^___$/;

  const renderedBody = () => {
    const blocks: JSX.Element[] = [];
    let listBuffer: { type: "ul" | "ol"; items: string[] } | null = null;

    const flushList = (keyIndex: number) => {
      if (!listBuffer) {
        return;
      }
      const items = listBuffer.items.map((item, itemIndex) => (
        <li key={`list-${keyIndex}-${itemIndex}`}>
          {renderInlineMarkdown(item, `list-${keyIndex}-${itemIndex}`)}
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
      const isDivider = dividerRegex.test(trimmed);
      const unorderedMatch = trimmed.match(listItemRegex);
      const orderedMatch = trimmed.match(orderedItemRegex);

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

      flushList(index);
      blocks.push(
        <p key={`${title}-${index}`}>
          {renderInlineMarkdown(paragraph, `${title}-${index}`)}
        </p>
      );
    });

    flushList(body.length);
    return blocks;
  };

  return (
    <section className="paper-section">
      <HeadingTag>{title}</HeadingTag>
      {renderedBody()}
      {monoBlocks?.map((block, index) => (
        <MonoBlock content={block} key={`${title}-mono-${index}`} />
      ))}
    </section>
  );
}
