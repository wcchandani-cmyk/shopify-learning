import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useBlocker } from "react-router-dom";
import { snapshotFormState } from "../utils/productForm";

export function useUnsavedProductGuard(
  form,
  variants,
  options,
  { onBlockLeave },
) {
  const [baseline, setBaseline] = useState(null);
  const allowLeaveRef = useRef(false);

  const currentSnapshot = useMemo(
    () => snapshotFormState(form, variants, options),
    [form, variants, options],
  );

  const isDirty = baseline !== null && currentSnapshot !== baseline;

  const warnLeave = useCallback(() => {
    onBlockLeave?.();
  }, [onBlockLeave]);

  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      !allowLeaveRef.current &&
      isDirty &&
      currentLocation.pathname !== nextLocation.pathname,
  );

  useEffect(() => {
    if (blocker.state === "blocked") {
      warnLeave();
      blocker.reset();
      return;
    }

    if (blocker.state === "unblocked") {
      allowLeaveRef.current = false;
    }
  }, [blocker.state, blocker, warnLeave]);

  useEffect(() => {
    if (!isDirty) return undefined;
    const onBeforeUnload = (event) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [isDirty]);

  const resetBaseline = useCallback((nextForm, nextVariants, nextOptions = []) => {
    allowLeaveRef.current = false;
    setBaseline(snapshotFormState(nextForm, nextVariants, nextOptions));
  }, []);

  const allowLeaveAfterSave = useCallback(() => {
    setBaseline(currentSnapshot);
    allowLeaveRef.current = true;
  }, [currentSnapshot]);

  const requestLeave = useCallback(
    (action) => {
      if (!isDirty || allowLeaveRef.current) {
        action();
        return;
      }
      warnLeave();
    },
    [isDirty, warnLeave],
  );

  return {
    resetBaseline,
    allowLeaveAfterSave,
    requestLeave,
  };
}
