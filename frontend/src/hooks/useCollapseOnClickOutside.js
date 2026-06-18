import { useEffect, useState, useRef } from "react";

export function useCollapseOnClickOutside() {
  const [activeId, setActiveId] = useState(null);
  const containerRef = useRef(null);

  useEffect(() => {
    if (activeId === null) return undefined;
    const handleOutside = (e) => {
      const activeRow = containerRef.current?.querySelector(
        `[data-mf-row="${activeId}"]`
      );
      if (activeRow && !activeRow.contains(e.target)) {
        setActiveId(null);
      }
    };
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [activeId]);

  return { activeId, setActiveId, containerRef };
}
