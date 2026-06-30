import { useState, useRef } from "react";
import { getInputEventValue } from "../../../utils/fieldEvent";
import { exclusiveFieldLabel } from "../../../utils/formFields";

const MEASUREMENT_UNITS = {
  dimension: ["mm", "cm", "m", "in", "ft", "yd"],
  weight: ["g", "kg", "oz", "lb"],
  volume: ["ml", "l", "us_fl_oz", "us_gal", "imp_gal"],
};

const MAX_FILE_BYTES = 5 * 1024 * 1024;

const isImage = (url) => {
  const strUrl = String(url || "");
  return (
    /^data:image\//i.test(strUrl) || /\.(png|jpe?g|gif|webp|svg|avif)(\?|$)/i.test(strUrl)
  );
};

const deriveName = (url) => {
  if (!url) return "";
  if (url.startsWith("data:")) return "file";
  try {
    return decodeURIComponent(url.split("/").pop().split("?")[0]);
  } catch {
    return url;
  }
};

// File values are stored as JSON { name, url }; older values may be a plain URL.
const parseFileValue = (value) => {
  if (!value) return { name: "", url: "" };
  try {
    const parsedValue = JSON.parse(value);
    if (parsedValue && typeof parsedValue === "object" && parsedValue.url) {
      return { name: parsedValue.name || deriveName(parsedValue.url), url: parsedValue.url };
    }
  } catch {
    /* not JSON — treat as a plain URL string */
  }
  return { url: value, name: deriveName(value) };
};

// Types that already look like a plain text box, so they render their real input
// even when idle (everything else uses the idle box until clicked).
const SIMPLE_TYPES = [
  "single_line_text_field",
  "multi_line_text_field",
  "rich_text_field",
  "json",
  "number_integer",
  "integer",
  "number_decimal",
  "decimal",
  "rating",
  "money",
  "url",
];

// Friendly text shown in the idle box for rich types.
const idleDisplayValue = (baseType, value) => {
  if (!value) return "";
  if (MEASUREMENT_UNITS[baseType]) {
    try {
      const parsedValue = JSON.parse(value);
      if (parsedValue && typeof parsedValue === "object") return `${parsedValue.value} ${parsedValue.unit}`;
    } catch (e) {
      /* fall through */
    }
    return value;
  }
  if (baseType === "boolean") {
    if (value === "true") return "True";
    if (value === "false") return "False";
    return "";
  }
  return value;
};

function FileChip({ name, url }) {
  return (
    <span className="metafield-file-chip">
      {isImage(url) ? (
        <img className="metafield-file-chip__thumb" src={url} alt="" />
      ) : (
        <span className="metafield-file-chip__thumb metafield-file-chip__thumb--doc">
          F
        </span>
      )}
      <span className="metafield-file-chip__name">{name}</span>
    </span>
  );
}

function FileInput({ value, onChange, disabled, active }) {
  const inputRef = useRef(null);
  const [error, setError] = useState("");
  const { name, url } = parseFileValue(value);

  const openPicker = () => {
    if (!disabled) inputRef.current?.click();
  };

  const handleChange = (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Only image files are allowed");
      return;
    }
    if (file.size > MAX_FILE_BYTES) {
      setError("Image must be under 5MB");
      return;
    }
    setError("");
    const reader = new FileReader();
    reader.onload = () =>
      onChange(JSON.stringify({ name: file.name, url: reader.result }));
    reader.onerror = () => setError("Could not read image");
    reader.readAsDataURL(file);
  };

  // Collapsed row: a plain box (chip when a file is set), matching other types.
  if (!active) {
    return (
      <div className="metafield-idle-box">
        {url && <FileChip name={name} url={url} />}
      </div>
    );
  }

  return (
    <div className="metafield-file-input">
      {url && <FileChip name={name} url={url} />}
      <s-button
        variant="secondary"
        disabled={disabled || undefined}
        onClick={openPicker}
      >
        {url ? "Replace" : "Select file"}
      </s-button>
      {url && (
        <s-button
          variant="tertiary"
          disabled={disabled || undefined}
          onClick={() => onChange("")}
        >
          Remove
        </s-button>
      )}
      {error && <div className="metafield-file-error">{error}</div>}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        hidden
        onChange={handleChange}
      />
    </div>
  );
}

function MeasurementInput({ def, value, onChange, disabled, units }) {
  const parsed = (() => {
    try {
      const parsedValue = JSON.parse(value);
      if (parsedValue && typeof parsedValue === "object") {
        return { num: parsedValue.value ?? "", unit: parsedValue.unit || units[0] };
      }
    } catch (e) {}
    return { num: value || "", unit: units[0] };
  })();

  const [unit, setUnit] = useState(parsed.unit);
  const num = parsed.num;

  const emit = (numVal, unitVal) =>
    onChange(numVal === "" ? "" : JSON.stringify({ value: numVal, unit: unitVal }));

  return (
    <div className="metafield-measurement-input">
      <s-text-field
        label={def.name}
        {...exclusiveFieldLabel}
        type="number"
        disabled={disabled || undefined}
        placeholder="0"
        value={String(num)}
        onInput={(event) => emit(getInputEventValue(event), unit)}
      />
      <s-select
        label="Unit"
        {...exclusiveFieldLabel}
        disabled={disabled || undefined}
        value={unit}
        onChange={(event) => {
          const selectedUnit = getInputEventValue(event);
          setUnit(selectedUnit);
          emit(num, selectedUnit);
        }}
      >
        {units.map((unitOption) => (
          <s-option key={unitOption} value={unitOption}>
            {unitOption}
          </s-option>
        ))}
      </s-select>
    </div>
  );
}

export default function MetafieldValueInput({
  def,
  value,
  onChange,
  disabled,
  active = true,
}) {
  const baseType = String(def.type || "").replace(/^list\./, "");

  if (baseType === "file_reference") {
    return (
      <FileInput
        value={value}
        onChange={onChange}
        disabled={disabled}
        active={active}
      />
    );
  }

  if (!active && !SIMPLE_TYPES.includes(baseType)) {
    return (
      <div className="metafield-idle-box" aria-label={def.name}>
        {idleDisplayValue(baseType, value)}
      </div>
    );
  }

  if (baseType === "boolean") {
    return (
      <s-select
        label={def.name}
        {...exclusiveFieldLabel}
        disabled={disabled || undefined}
        value={String(value)}
        onChange={(event) => onChange(getInputEventValue(event))}
      >
        <s-option value="">Select option</s-option>
        <s-option value="true">True</s-option>
        <s-option value="false">False</s-option>
      </s-select>
    );
  }

  if (["multi_line_text_field", "json", "rich_text_field"].includes(baseType)) {
    return (
      <s-text-area
        label={def.name}
        {...exclusiveFieldLabel}
        disabled={disabled || undefined}
        placeholder="Enter text"
        value={value}
        onInput={(event) => onChange(getInputEventValue(event))}
      />
    );
  }

  if (
    [
      "number_integer",
      "integer",
      "number_decimal",
      "decimal",
      "rating",
      "money",
    ].includes(baseType)
  ) {
    return (
      <s-text-field
        label={def.name}
        {...exclusiveFieldLabel}
        type="number"
        disabled={disabled || undefined}
        placeholder="Enter number"
        value={value}
        onInput={(event) => onChange(getInputEventValue(event))}
      />
    );
  }

  if (baseType === "url") {
    return (
      <s-text-field
        label={def.name}
        {...exclusiveFieldLabel}
        type="url"
        disabled={disabled || undefined}
        placeholder="https://"
        value={value}
        onInput={(event) => onChange(getInputEventValue(event))}
      />
    );
  }

  if (baseType === "date" || baseType === "date_time") {
    return (
      <input
        type={baseType === "date_time" ? "datetime-local" : "date"}
        className="metafield-native-input"
        aria-label={def.name}
        disabled={disabled}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    );
  }

  if (baseType === "color") {
    return (
      <div className="metafield-color-input">
        <input
          type="color"
          className="metafield-color-swatch"
          aria-label={`${def.name} color`}
          disabled={disabled}
          value={/^#[0-9a-fA-F]{6}$/.test(value) ? value : "#000000"}
          onChange={(event) => onChange(event.target.value)}
        />
        <input
          type="text"
          className="metafield-native-input"
          aria-label={def.name}
          disabled={disabled}
          placeholder="#000000"
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
      </div>
    );
  }

  if (MEASUREMENT_UNITS[baseType]) {
    return (
      <MeasurementInput
        def={def}
        value={value}
        onChange={onChange}
        disabled={disabled}
        units={MEASUREMENT_UNITS[baseType]}
      />
    );
  }

  const isReference = baseType.endsWith("_reference");
  return (
    <s-text-field
      label={def.name}
      {...exclusiveFieldLabel}
      disabled={disabled || undefined}
      placeholder={isReference ? "Enter resource ID (gid://...)" : "Enter text"}
      value={value}
      onInput={(event) => onChange(getInputEventValue(event))}
    />
  );
}
