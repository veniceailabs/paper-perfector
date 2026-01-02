import { useState, useEffect } from "react";
import type { Document } from "../models/DocumentSchema";
import { TableOfContents } from "../components/TableOfContents";
import Divider from "./Divider";
import MetaBlock from "./MetaBlock";
import Section from "./Section";
import "../styles/DocumentLayout.css";

export function DocumentRenderer({ doc }: { doc: Document }) {
  const [currentSectionId, setCurrentSectionId] = useState<string | undefined>();

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
      <article className="paper-canvas">
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
