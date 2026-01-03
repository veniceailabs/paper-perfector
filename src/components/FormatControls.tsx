import type { DocumentFormat, FormatPreset } from "../models/DocumentSchema";
import {
  formatFontSize,
  formatPresets,
  fontOptions,
  lineHeightOptions,
  parseFontSize,
} from "../utils/formatting";
import "../styles/FormatControls.css";

interface FormatControlsProps {
  format: DocumentFormat;
  onChange: (next: DocumentFormat) => void;
  compact?: boolean;
}

const presetOptions: Array<{ value: FormatPreset; label: string }> = [
  { value: "default", label: "Default" },
  { value: "apa", label: "APA" },
  { value: "mla", label: "MLA" },
  { value: "chicago", label: "Chicago" },
  { value: "custom", label: "Custom" },
];

export function FormatControls({ format, onChange, compact }: FormatControlsProps) {
  const preset = format.preset ?? "default";
  const defaults = formatPresets[preset] ?? formatPresets.default;
  const sizeData = parseFontSize(format.fontSize, defaults.fontSize ?? "12pt");
  const lineHeightValue = format.lineHeight ?? defaults.lineHeight ?? 1.5;

  const updateFormat = (partial: Partial<DocumentFormat>) => {
    onChange({
      ...format,
      ...partial,
      preset: "custom",
    });
  };

  return (
    <div className={`format-controls ${compact ? "compact" : ""}`}>
      <div className="format-field">
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

      <div className="format-field">
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

      <div className="format-field format-field-row">
        <div className="format-field">
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
        <div className="format-field">
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

      <div className="format-field">
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
    </div>
  );
}
