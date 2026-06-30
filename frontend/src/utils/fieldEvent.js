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

function findValueInShadow(container) {
  if (!container) return null;
  // 1. Try light DOM checked elements
  const checked = container.querySelector("input:checked, [checked='true'], [selected='true']");
  if (checked) {
    const val = checked.value ?? checked.getAttribute("value");
    if (val != null && val !== "") return String(val);
  }
  
  // 2. Try shadow DOM of the container itself
  if (container.shadowRoot) {
    const checkedShadow = container.shadowRoot.querySelector("input:checked, [checked='true'], [selected='true']");
    if (checkedShadow) {
      const val = checkedShadow.value ?? checkedShadow.getAttribute("value");
      if (val != null && val !== "") return String(val);
    }
  }

  // 3. Scan child s-choice elements and their shadow roots
  if (typeof container.querySelectorAll === "function") {
    const choices = container.querySelectorAll("s-choice");
    for (const choice of choices) {
      const isSelected = choice.selected ?? choice.checked ?? choice.getAttribute("selected") ?? choice.getAttribute("checked");
      if (isSelected === true || isSelected === "true" || isSelected === "") {
        const val = choice.value ?? choice.getAttribute("value");
        if (val != null && val !== "") return String(val);
      }
      if (choice.shadowRoot) {
        const checkedInput = choice.shadowRoot.querySelector("input:checked, [checked='true'], [selected='true']");
        if (checkedInput) {
          const val = choice.value ?? choice.getAttribute("value") ?? checkedInput.value ?? checkedInput.getAttribute("value");
          if (val != null && val !== "") return String(val);
        }
      }
    }
  }
  return null;
}

export function getChoiceListValue(event) {
  if (!event) return "";
  
  // 1. Try DOM & Shadow DOM resolution first
  const container = event.currentTarget ?? event.target;
  const shadowVal = findValueInShadow(container);
  if (shadowVal != null && shadowVal !== "") {
    return shadowVal;
  }
  
  // 2. Try event.detail
  if (event.detail != null) {
    if (typeof event.detail === "string" && event.detail !== "") {
      return event.detail;
    }
    if (Array.isArray(event.detail) && event.detail.length > 0) {
      return String(event.detail[0]);
    }
    if (typeof event.detail === "object") {
      if (event.detail.value != null && event.detail.value !== "") {
        if (Array.isArray(event.detail.value) && event.detail.value.length > 0) {
          return String(event.detail.value[0]);
        }
        return String(event.detail.value);
      }
    }
  }

  // 3. Try target / closest s-choice
  const choiceEl = event.target?.closest("s-choice");
  if (choiceEl != null) {
    const val = choiceEl.value ?? choiceEl.getAttribute("value");
    if (val != null && val !== "") return String(val);
  }

  // 4. Try standard target value
  if (event.target != null && event.target.value != null && event.target.value !== "") {
    return String(event.target.value);
  }

  // 5. Try currentTarget value
  if (event.currentTarget != null && event.currentTarget.value != null && event.currentTarget.value !== "") {
    return String(event.currentTarget.value);
  }

  // 6. Try values array fallback
  const currentTargetValues = event.currentTarget?.values;
  if (Array.isArray(currentTargetValues) && currentTargetValues.length > 0) {
    return String(currentTargetValues[0]);
  }
  const targetValues = event.target?.values;
  if (Array.isArray(targetValues) && targetValues.length > 0) {
    return String(targetValues[0]);
  }

  return "";
}
