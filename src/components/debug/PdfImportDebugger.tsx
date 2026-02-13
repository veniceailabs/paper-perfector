import type { CSSProperties } from "react";

type DebugItem = {
  text: string;
  x: number;
  y: number;
  width: number;
  size: number;
};

type DebugColumn = {
  start: number;
  end: number;
};

type PdfImportDebuggerProps = {
  items: DebugItem[];
  columns: DebugColumn[];
  pageWidth: number;
  pageHeight: number;
};

export function PdfImportDebugger({
  items,
  columns,
  pageWidth,
  pageHeight,
}: PdfImportDebuggerProps) {
  const rootStyle: CSSProperties = {
    position: "relative",
    width: pageWidth,
    height: pageHeight,
    border: "1px solid #94a3b8",
    background: "#f8fafc",
    overflow: "hidden",
  };

  return (
    <div style={rootStyle}>
      {columns.map((column, index) => (
        <div
          key={`col-${index}`}
          style={{
            position: "absolute",
            left: column.start,
            width: Math.max(1, column.end - column.start),
            top: 0,
            bottom: 0,
            background:
              index % 2 === 0 ? "rgba(34,197,94,0.12)" : "rgba(59,130,246,0.12)",
            border: "1px dashed rgba(15,23,42,0.4)",
            pointerEvents: "none",
          }}
        >
          <span
            style={{
              fontSize: 10,
              color: "#0f172a",
              background: "rgba(255,255,255,0.9)",
              padding: "1px 4px",
            }}
          >
            Col {index + 1}
          </span>
        </div>
      ))}

      {items.map((item, index) => (
        <div
          key={`item-${index}`}
          title={item.text}
          style={{
            position: "absolute",
            left: item.x,
            top: pageHeight - item.y - item.size,
            width: Math.max(1, item.width),
            height: Math.max(1, item.size),
            border: "1px solid rgba(239,68,68,0.7)",
            fontSize: 7,
            lineHeight: "1",
            color: "#7f1d1d",
            background: "rgba(254,226,226,0.5)",
            overflow: "hidden",
            whiteSpace: "nowrap",
            pointerEvents: "none",
          }}
        >
          {item.text}
        </div>
      ))}
    </div>
  );
}
