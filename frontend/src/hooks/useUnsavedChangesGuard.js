import { useCallback, useEffect, useRef } from "react";
import { useBlocker } from "react-router-dom";

export function useUnsavedChangesGuard(isDirty, onBlockLeave) {
  const allowLeaveRef = useRef(false);

  const warnLeave = useCallback(() => {
    onBlockLeave?.();
  }, [onBlockLeave]);

  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      !allowLeaveRef.current &&
      isDirty &&
      currentLocation.pathname !== nextLocation.pathname
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

  const allowLeaveAfterSave = useCallback(() => {
    allowLeaveRef.current = true;
  }, []);

  return {
    allowLeaveAfterSave,
  };
}
