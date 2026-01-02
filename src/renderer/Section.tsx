import type { Section as SectionType } from "../models/DocumentSchema";
import MonoBlock from "./MonoBlock";

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

  return (
    <section className="paper-section">
      <HeadingTag>{title}</HeadingTag>
      {body.map((paragraph, index) => (
        <p key={`${title}-${index}`}>{paragraph}</p>
      ))}
      {monoBlocks?.map((block, index) => (
        <MonoBlock content={block} key={`${title}-mono-${index}`} />
      ))}
    </section>
  );
}
