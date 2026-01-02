export default function MonoBlock({ content }: { content: string }) {
  return (
    <pre className="mono">
      <code>{content}</code>
    </pre>
  );
}
