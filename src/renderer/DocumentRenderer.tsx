import { useState, useEffect, type CSSProperties } from "react";
import type { Document } from "../models/DocumentSchema";
import { TableOfContents } from "../components/TableOfContents";
import Divider from "./Divider";
import MetaBlock from "./MetaBlock";
import Section from "./Section";
import { resolveFormat } from "../utils/formatting";
import "../styles/DocumentLayout.css";

export function DocumentRenderer({
  doc,
  printHash,
}: {
  doc: Document;
  printHash?: string;
}) {
  const [currentSectionId, setCurrentSectionId] = useState<string | undefined>();
  const resolvedFormat = resolveFormat(doc);
  const formatClass =
    resolvedFormat.preset !== "default" && resolvedFormat.preset !== "custom"
      ? `format-${resolvedFormat.preset}`
      : "";
  const formatStyle: CSSProperties = {
    "--paper-font-family": resolvedFormat.fontFamily,
    "--paper-font-size": resolvedFormat.fontSize,
    "--paper-line-height": resolvedFormat.lineHeight?.toString(),
  } as CSSProperties;

  // Track current section as user scrolls
  useEffect(() => {
    const handleScroll = () => {
      const sections = document.querySelectorAll("[data-section-id]");
      let current: string | undefined;

      for (const section of sections) {
        const rect = section.getBoundingClientRect();
        if (rect.top <= 200) {
          current = section.getAttribute("data-section-id") || undefined;
        }
      }

      if (current) {
        setCurrentSectionId(current);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="document-container">
      <article className={`paper-canvas ${formatClass}`.trim()} style={formatStyle}>
        <header>
          <h1>{doc.title}</h1>
          {doc.subtitle ? <h2>{doc.subtitle}</h2> : null}
          <Divider />
          <MetaBlock data={doc.metadata} />
        </header>

        {doc.sections.map((section) => (
          <div key={section.id} data-section-id={section.id} id={`section-${section.id}`}>
            <Section {...section} />
          </div>
        ))}
        {printHash ? (
          <div className="print-hash">Document Integrity Hash: {printHash}</div>
        ) : null}
      </article>

      <aside className="document-sidebar">
        <TableOfContents
          sections={doc.sections}
          currentSectionId={currentSectionId}
          onSectionClick={(id) => setCurrentSectionId(id)}
          isCompact={false}
        />
      </aside>
    </div>
  );
}
