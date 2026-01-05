import type { DocumentFormat, FormatPreset } from "../models/DocumentSchema";
import {
  formatFontSize,
  formatPresets,
  fontWeightOptions,
  fontOptions,
  formatPageMargin,
  lineHeightOptions,
  parsePageMargin,
  parseFontSize,
} from "../utils/formatting";
import "../styles/FormatControls.css";

interface FormatControlsProps {
  format: DocumentFormat;
  onChange: (next: DocumentFormat) => void;
  compact?: boolean;
  onReset?: () => void;
  onSaveDefaults?: (format: DocumentFormat) => void;
}

const presetOptions: Array<{ value: FormatPreset; label: string }> = [
  { value: "default", label: "Default" },
  { value: "apa", label: "APA" },
  { value: "mla", label: "MLA" },
  { value: "chicago", label: "Chicago" },
  { value: "custom", label: "Custom" },
];

export function FormatControls({
  format,
  onChange,
  compact,
  onReset,
  onSaveDefaults,
}: FormatControlsProps) {
  const preset = format.preset ?? "default";
  const defaults = formatPresets[preset] ?? formatPresets.default;
  const sizeData = parseFontSize(format.fontSize, defaults.fontSize ?? "12pt");
  const lineHeightValue = format.lineHeight ?? defaults.lineHeight ?? 1.5;
  const marginData = parsePageMargin(
    format.pageMargin,
    defaults.pageMargin ?? "24mm"
  );
  const fontWeightValue = format.fontWeight ?? defaults.fontWeight ?? 400;
  const paragraphSpacingValue =
    format.paragraphSpacing ?? defaults.paragraphSpacing ?? 12;
  const showHeaderValue = format.showHeader ?? defaults.showHeader ?? false;
  const showPageNumbersValue =
    format.showPageNumbers ?? defaults.showPageNumbers ?? false;
  const headerTextValue = format.headerText ?? "";
  const renderMarkdownValue = format.renderMarkdown ?? defaults.renderMarkdown ?? true;

  const updateFormat = (partial: Partial<DocumentFormat>) => {
    onChange({
      ...format,
      ...partial,
      preset: "custom",
    });
  };

  return (
    <div className={`format-controls ${compact ? "compact" : ""}`}>
      <div
        className="format-field"
        data-tip="Choose a style preset or switch to custom."
      >
        <label>Preset</label>
        <select
          value={preset}
          onChange={(event) => {
            const nextPreset = event.target.value as FormatPreset;
            const presetDefaults = formatPresets[nextPreset] ?? formatPresets.default;
            onChange({
              ...presetDefaults,
              preset: nextPreset,
            });
          }}
        >
          {presetOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className="format-field" data-tip="Select the font family.">
        <label>Font</label>
        <select
          value={format.fontFamily ?? defaults.fontFamily}
          onChange={(event) => updateFormat({ fontFamily: event.target.value })}
        >
          {fontOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className="format-field" data-tip="Select the font weight.">
        <label>Weight</label>
        <select
          value={fontWeightValue.toString()}
          onChange={(event) =>
            updateFormat({ fontWeight: Number(event.target.value) })
          }
        >
          {fontWeightOptions.map((option) => (
            <option key={option.value} value={option.value.toString()}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className="format-field format-field-row">
        <div className="format-field" data-tip="Set the font size.">
          <label>Size</label>
          <input
            type="number"
            min={8}
            max={28}
            step={0.5}
            value={sizeData.size}
            onChange={(event) =>
              updateFormat({
                fontSize: formatFontSize(Number(event.target.value), sizeData.unit),
              })
            }
          />
        </div>
        <div className="format-field" data-tip="Choose pt or px sizing.">
          <label>Unit</label>
          <select
            value={sizeData.unit}
            onChange={(event) =>
              updateFormat({
                fontSize: formatFontSize(sizeData.size, event.target.value as "pt" | "px"),
              })
            }
          >
            <option value="pt">pt</option>
            <option value="px">px</option>
          </select>
        </div>
      </div>

      <div className="format-field" data-tip="Set line spacing for the paper.">
        <label>Line Spacing</label>
        <select
          value={lineHeightValue.toString()}
          onChange={(event) =>
            updateFormat({
              lineHeight: Number(event.target.value),
            })
          }
        >
          {lineHeightOptions.map((value) => (
            <option key={value} value={value.toString()}>
              {value}
            </option>
          ))}
        </select>
      </div>

      <div
        className="format-field"
        data-tip="Adjust spacing between paragraphs."
      >
        <label>Paragraph Spacing</label>
        <input
          type="number"
          min={4}
          max={32}
          step={1}
          value={paragraphSpacingValue}
          onChange={(event) =>
            updateFormat({
              paragraphSpacing: Number(event.target.value),
            })
          }
        />
      </div>

      <div className="format-field" data-tip="Toggle running head visibility.">
        <label className="format-toggle">
          <input
            type="checkbox"
            checked={renderMarkdownValue}
            onChange={(event) =>
              updateFormat({ renderMarkdown: event.target.checked })
            }
          />
          <span>Markdown formatting</span>
        </label>
        <p className="format-hint">
          {renderMarkdownValue
            ? "Markdown on: **bold**, *italics*, lists, and links."
            : "Plain text: preserves spacing and treats formatting literally."}
        </p>
      </div>

      <div
        className="format-field"
        data-tip="Choose between markdown formatting or plain text rendering."
      >
        <label className="format-toggle">
          <input
            type="checkbox"
            checked={showHeaderValue}
            onChange={(event) =>
              updateFormat({ showHeader: event.target.checked })
            }
          />
          <span>Show header (running head)</span>
        </label>
      </div>

      <div className="format-field" data-tip="Set the running head text.">
        <label>Header text</label>
        <input
          type="text"
          value={headerTextValue}
          onChange={(event) => updateFormat({ headerText: event.target.value })}
          placeholder="Running head"
        />
      </div>

      <div className="format-field" data-tip="Toggle page numbers on export.">
        <label className="format-toggle">
          <input
            type="checkbox"
            checked={showPageNumbersValue}
            onChange={(event) =>
              updateFormat({ showPageNumbers: event.target.checked })
            }
          />
          <span>Show page numbers</span>
        </label>
      </div>

      <div className="format-field format-field-row">
        <div className="format-field" data-tip="Set page margins.">
          <label>Margin</label>
          <input
            type="number"
            min={4}
            max={40}
            step={0.5}
            value={marginData.size}
            onChange={(event) =>
              updateFormat({
                pageMargin: formatPageMargin(
                  Number(event.target.value),
                  marginData.unit
                ),
              })
            }
          />
        </div>
        <div className="format-field" data-tip="Choose mm or in.">
          <label>Unit</label>
          <select
            value={marginData.unit}
            onChange={(event) =>
              updateFormat({
                pageMargin: formatPageMargin(
                  marginData.size,
                  event.target.value as "mm" | "in"
                ),
              })
            }
          >
            <option value="mm">mm</option>
            <option value="in">in</option>
          </select>
        </div>
      </div>

      {onReset || onSaveDefaults ? (
        <div className="format-actions">
          {onReset ? (
            <button
              className="format-action-btn"
              type="button"
              onClick={onReset}
              data-tip="Reset to the selected preset defaults."
            >
              Reset to Defaults
            </button>
          ) : null}
          {onSaveDefaults ? (
            <button
              className="format-action-btn primary"
              type="button"
              onClick={() => onSaveDefaults(format)}
              data-tip="Save these settings for new documents."
            >
              Save Defaults
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
