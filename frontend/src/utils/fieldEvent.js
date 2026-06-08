/** Polaris web component input — read value before async setState (event may be null). */
export function getInputEventValue(event) {
  if (!event) return "";
  const el = event.currentTarget ?? event.target;
  if (el != null && el.value != null && el.value !== "") {
    return String(el.value);
  }
  if (event.detail != null && typeof event.detail === "object" && "value" in event.detail) {
    return String(event.detail.value ?? "");
  }
  if (event.detail != null && typeof event.detail !== "object") {
    return String(event.detail);
  }
  if (el != null && el.value != null) {
    return String(el.value);
  }
  return "";
}

const DEFAULT_NUMERIC_VALUES = new Set(["0", "0.0", "0.00"]);

/**
 * Clears a default "0" / "0.00" when the field is focused so the typed number
 * shows clean, and restores the fallback if the user leaves it empty.
 */
export function clearDefaultZeroProps(value, setValue, fallback = "0") {
  return {
    onFocus: () => {
      if (DEFAULT_NUMERIC_VALUES.has(String(value).trim())) {
        setValue("");
      }
    },
    onBlur: () => {
      if (String(value).trim() === "") {
        setValue(fallback);
      }
    },
  };
}

export function getCheckboxChecked(event) {
  const el = event?.currentTarget ?? event?.target;
  if (el != null && "checked" in el) {
    return Boolean(el.checked);
  }
  return false;
}
