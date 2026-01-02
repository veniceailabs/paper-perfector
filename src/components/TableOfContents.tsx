import { useEffect, useState } from "react";
import type { Section } from "../models/DocumentSchema";
import "../styles/TableOfContents.css";

interface TableOfContentsProps {
  sections: Section[];
  currentSectionId?: string;
  onSectionClick?: (sectionId: string) => void;
  isCompact?: boolean;
}

export function TableOfContents({
  sections,
  currentSectionId,
  onSectionClick,
  isCompact = false,
}: TableOfContentsProps) {
  const [isOpen, setIsOpen] = useState(!isCompact);

  // Auto-collapse on mobile by default
  useEffect(() => {
    const isMobile = window.innerWidth < 720;
    setIsOpen(!isMobile);
  }, []);

  const handleSectionClick = (sectionId: string) => {
    if (onSectionClick) {
      onSectionClick(sectionId);
    }

    // Scroll to section if it exists
    const element = document.getElementById(`section-${sectionId}`);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  if (sections.length === 0) {
    return null;
  }

  return (
    <nav className={`table-of-contents ${isCompact ? "compact" : ""}`}>
      <button
        className="toc-toggle"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
      >
        📑 Contents
      </button>

      {isOpen && (
        <ul className="toc-list">
          {sections.map((section) => (
            <li key={section.id} className={`toc-item level-${section.level}`}>
              <button
                className={`toc-link ${
                  currentSectionId === section.id ? "active" : ""
                }`}
                onClick={() => handleSectionClick(section.id)}
              >
                {section.title}
              </button>
            </li>
          ))}
        </ul>
      )}
    </nav>
  );
}
