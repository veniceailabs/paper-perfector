import { useState, useEffect, type CSSProperties } from "react";
import type { Document } from "../models/DocumentSchema";
import { TableOfContents } from "../components/TableOfContents";
import Divider from "./Divider";
import MetaBlock from "./MetaBlock";
import Section from "./Section";
import type { SearchScope } from "../models/Search";
import { resolveFormat } from "../utils/formatting";
import { formatReference, formatReferenceTitle } from "../utils/citations";
import { renderHighlightedText } from "./inlineMarkdown";
import "../styles/DocumentLayout.css";

export function DocumentRenderer({
  doc,
  printHash,
  highlightQuery,
  highlightScope,
}: {
  doc: Document;
  printHash?: string;
  highlightQuery?: string;
  highlightScope?: SearchScope;
}) {
  const [currentSectionId, setCurrentSectionId] = useState<string | undefined>();
  const resolvedFormat = resolveFormat(doc);
  const sources = doc.sources ?? [];
  const formatClass =
    resolvedFormat.preset !== "default" && resolvedFormat.preset !== "custom"
      ? `format-${resolvedFormat.preset}`
      : "";
  const showHeader = resolvedFormat.showHeader ?? false;
  const showPageNumbers = resolvedFormat.showPageNumbers ?? false;
  const headerText =
    resolvedFormat.headerText?.trim() || doc.title.toUpperCase();
  const headerHeight = showHeader ? "32px" : "0px";
  const footerHeight = showPageNumbers ? "28px" : "0px";
  const referenceTitle = formatReferenceTitle(resolvedFormat.preset);
  const hasReferenceSection = doc.sections.some((section) =>
    /references|bibliography|works cited/i.test(section.title)
  );
  const formatStyle: CSSProperties = {
    "--paper-font-family": resolvedFormat.fontFamily,
    "--paper-font-size": resolvedFormat.fontSize,
    "--paper-line-height": resolvedFormat.lineHeight?.toString(),
    "--paper-margin": resolvedFormat.pageMargin,
    "--paper-font-weight": resolvedFormat.fontWeight?.toString(),
    "--paper-paragraph-spacing": resolvedFormat.paragraphSpacing
      ? `${resolvedFormat.paragraphSpacing}px`
      : undefined,
    "--paper-header-height": headerHeight,
    "--paper-footer-height": footerHeight,
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
      <article
        id="document-top"
        className={`paper-canvas ${formatClass}`.trim()}
        style={formatStyle}
      >
        {showHeader ? (
          <div className="paper-header">
            <span className="paper-header-text">{headerText}</span>
            {showPageNumbers ? (
              <span className="paper-header-page">
                Page <span className="page-number" />
              </span>
            ) : null}
          </div>
        ) : null}
        <header>
          <h1>
            {renderHighlightedText(
              doc.title,
              "doc-title",
              highlightScope?.title ? highlightQuery : undefined
            )}
          </h1>
          {doc.subtitle ? (
            <h2>
              {renderHighlightedText(
                doc.subtitle,
                "doc-subtitle",
                highlightScope?.title ? highlightQuery : undefined
              )}
            </h2>
          ) : null}
          <Divider />
          <MetaBlock
            data={doc.metadata}
            highlightQuery={highlightScope?.metadata ? highlightQuery : undefined}
          />
        </header>

        {doc.sections.map((section) => (
          <div key={section.id} data-section-id={section.id} id={`section-${section.id}`}>
            <Section
              {...section}
              highlightQuery={highlightScope?.body ? highlightQuery : undefined}
            />
          </div>
        ))}
        {sources.length > 0 && !hasReferenceSection ? (
          <section className="paper-section level-1 auto-references">
            <h2>{referenceTitle}</h2>
            <ol className="reference-list">
              {sources.map((source) => (
                <li key={source.id}>
                  {renderHighlightedText(
                    formatReference(source, resolvedFormat.preset),
                    `ref-${source.id}`,
                    highlightScope?.body ? highlightQuery : undefined
                  )}
                </li>
              ))}
            </ol>
          </section>
        ) : null}
        {showPageNumbers && !showHeader ? (
          <div className="paper-footer">
            Page <span className="page-number" />
          </div>
        ) : null}
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
