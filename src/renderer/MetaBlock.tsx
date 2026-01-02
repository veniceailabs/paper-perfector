export default function MetaBlock({
  data,
}: {
  data: Record<string, string>;
}) {
  const entries = Object.entries(data);
  if (entries.length === 0) {
    return null;
  }

  return (
    <dl className="meta-block">
      {entries.map(([key, value]) => (
        <div className="meta-row" key={key}>
          <dt>{key}</dt>
          <dd>{value}</dd>
        </div>
      ))}
    </dl>
  );
}
