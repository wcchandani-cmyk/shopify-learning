export function normalizeProductTypes(...sources) {
  const values = new Set();

  for (const source of sources) {
    if (source == null) continue;
    if (!Array.isArray(source)) continue;

    for (const item of source) {
      const trimmed = String(item ?? "").trim();
      if (trimmed) values.add(trimmed);
    }
  }

  return [...values].sort((a, b) =>
    a.localeCompare(b, undefined, { sensitivity: "base" }),
  );
}

export function withCurrentProductType(types, current) {
  const trimmed = String(current ?? "").trim();
  if (!trimmed) return types;
  if (types.includes(trimmed)) return types;
  return [...types, trimmed].sort((a, b) =>
    a.localeCompare(b, undefined, { sensitivity: "base" }),
  );
}
