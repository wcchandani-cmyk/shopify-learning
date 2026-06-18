// Shared pure helpers for the metafields components.

export const capitalize = (s) => {
  const str = String(s || "");
  return str.charAt(0).toUpperCase() + str.slice(1);
};

// Builds the editable value map ({ definitionId: value }) from a metafields list.
export const valuesFromMetafields = (list) => {
  const vals = {};
  list.forEach((m) => {
    vals[m.definition.id] = m.value ?? "";
  });
  return vals;
};

export const findTypeItem = (groups, value) =>
  groups.flatMap((g) => g.items).find((i) => i.value === value);

// Filters type groups by a case-insensitive label search, dropping empty groups.
export const filterTypeGroups = (groups, search) => {
  const q = String(search || "").toLowerCase();
  return groups
    .map((group) => ({
      ...group,
      items: group.items.filter((i) => i.label.toLowerCase().includes(q)),
    }))
    .filter((group) => group.items.length > 0);
};
