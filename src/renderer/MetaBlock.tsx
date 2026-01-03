import { renderHighlightedText } from "./inlineMarkdown";

export default function MetaBlock({
  data,
  highlightQuery,
}: {
  data: Record<string, string>;
  highlightQuery?: string;
}) {
  const entries = Object.entries(data);
  if (entries.length === 0) {
    return null;
  }

  return (
    <dl className="meta-block">
      {entries.map(([key, value]) => (
        <div className="meta-row" key={key}>
          <dt>{renderHighlightedText(key, `meta-key-${key}`, highlightQuery)}</dt>
          <dd>{renderHighlightedText(value, `meta-${key}`, highlightQuery)}</dd>
        </div>
      ))}
    </dl>
  );
}
