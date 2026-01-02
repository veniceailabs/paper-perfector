import { useState } from "react";
import type { Document } from "../models/DocumentSchema";
import "../styles/DocumentEditor.css";

interface DocumentEditorProps {
  doc: Document;
  onSave: (doc: Document) => void;
}

export function DocumentEditor({ doc, onSave }: DocumentEditorProps) {
  const [title, setTitle] = useState(doc.title);
  const [subtitle, setSubtitle] = useState(doc.subtitle || "");
  const [metadata, setMetadata] = useState(doc.metadata);
  const [sections, setSections] = useState(doc.sections);

  const handleMetadataChange = (key: string, value: string) => {
    setMetadata({ ...metadata, [key]: value });
  };

  const handleSectionBodyChange = (sectionId: string, bodyIndex: number, text: string) => {
    setSections(
      sections.map((section) => {
        if (section.id === sectionId) {
          const newBody = [...section.body];
          newBody[bodyIndex] = text;
          return { ...section, body: newBody };
        }
        return section;
      })
    );
  };

  const handleSectionTitleChange = (sectionId: string, text: string) => {
    setSections(
      sections.map((section) => {
        if (section.id === sectionId) {
          return { ...section, title: text };
        }
        return section;
      })
    );
  };

  const addParagraphToSection = (sectionId: string) => {
    setSections(
      sections.map((section) => {
        if (section.id === sectionId) {
          return { ...section, body: [...section.body, ""] };
        }
        return section;
      })
    );
  };

  const removeParagraphFromSection = (sectionId: string, bodyIndex: number) => {
    setSections(
      sections.map((section) => {
        if (section.id === sectionId) {
          return { ...section, body: section.body.filter((_, i) => i !== bodyIndex) };
        }
        return section;
      })
    );
  };

  const addSection = () => {
    const newId = `section-${Date.now()}`;
    setSections([
      ...sections,
      {
        id: newId,
        level: 2,
        title: "New Section",
        body: ["Start typing here..."],
        monoBlocks: [],
      },
    ]);
  };

  const removeSection = (sectionId: string) => {
    setSections(sections.filter((s) => s.id !== sectionId));
  };

  const handleSave = () => {
    const updatedDoc: Document = {
      title,
      subtitle: subtitle || undefined,
      metadata,
      sections,
    };
    onSave(updatedDoc);
  };

  return (
    <div className="editor-container">
      <div className="editor-main">
        <div className="editor-header">
          <input
            type="text"
            className="editor-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Document Title"
          />
          <input
            type="text"
            className="editor-subtitle"
            value={subtitle}
            onChange={(e) => setSubtitle(e.target.value)}
            placeholder="Subtitle (optional)"
          />
        </div>

        <div className="editor-metadata">
          <h3>Metadata</h3>
          <div className="metadata-grid">
            {Object.entries(metadata).map(([key, value]) => (
              <div key={key} className="metadata-field">
                <label>{key}</label>
                <input
                  type="text"
                  value={value}
                  onChange={(e) => handleMetadataChange(key, e.target.value)}
                />
              </div>
            ))}
          </div>
        </div>

        <div className="editor-sections">
          <h3>Sections</h3>
          {sections.map((section) => (
            <div key={section.id} className={`section-editor level-${section.level}`}>
              <div className="section-header">
                <input
                  type="text"
                  className="section-title-input"
                  value={section.title}
                  onChange={(e) => handleSectionTitleChange(section.id, e.target.value)}
                  placeholder="Section Title"
                />
                <button
                  className="remove-section-btn"
                  onClick={() => removeSection(section.id)}
                  title="Remove section"
                >
                  ✕
                </button>
              </div>

              <div className="section-body">
                {section.body.map((paragraph, idx) => (
                  <div key={idx} className="paragraph-editor">
                    <textarea
                      value={paragraph}
                      onChange={(e) => handleSectionBodyChange(section.id, idx, e.target.value)}
                      placeholder="Enter paragraph text..."
                      rows={Math.max(2, Math.ceil(paragraph.length / 60))}
                    />
                    {section.body.length > 1 && (
                      <button
                        className="remove-paragraph-btn"
                        onClick={() => removeParagraphFromSection(section.id, idx)}
                        title="Remove paragraph"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <button
                className="add-paragraph-btn"
                onClick={() => addParagraphToSection(section.id)}
              >
                + Add Paragraph
              </button>
            </div>
          ))}

          <button className="add-section-btn" onClick={addSection}>
            + Add Section
          </button>
        </div>
      </div>

      <div className="editor-sidebar">
        <button className="save-btn" onClick={handleSave}>
          💾 Save Changes
        </button>
        <div className="editor-tips">
          <h4>Tips</h4>
          <ul>
            <li>Click "Save Changes" to update the document</li>
            <li>Add paragraphs within sections</li>
            <li>Add new sections as needed</li>
            <li>Edit metadata to track version, author, etc.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
