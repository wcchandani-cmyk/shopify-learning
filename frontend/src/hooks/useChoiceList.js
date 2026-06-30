import { useRef, useCallback } from "react";
import { getChoiceListValue } from "../utils/fieldEvent";

export function useChoiceList(value, onChange) {
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const elementRef = useRef(null);

  const handleChange = useCallback((e) => {
    const val = getChoiceListValue(e);
    if (val) {
      onChangeRef.current(val);
    }
  }, []);

  const setRef = useCallback((node) => {
    if (elementRef.current) {
      const el = elementRef.current;
      el.removeEventListener("change", handleChange);
      el.removeEventListener("input", handleChange);
      el.removeEventListener("click", handleChange);
    }

    elementRef.current = node;

    if (node) {
      node.addEventListener("change", handleChange);
      node.addEventListener("input", handleChange);
      node.addEventListener("click", handleChange);
    }
  }, [handleChange]);

  return setRef;
}
