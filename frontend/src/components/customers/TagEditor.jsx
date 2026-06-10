import { useMemo, useState } from "react";
import { parseTags } from "../../utils/customerForm";
import { getInputEventValue } from "../../utils/fieldEvent";
import { exclusiveFieldLabel } from "../../utils/formFields";

export default function TagEditor({ value, available = [], onChange }) {
  const selected = useMemo(() => parseTags(value), [value]);
  const [search, setSearch] = useState("");
  const [alphabetical, setAlphabetical] = useState(false);

  const term = search.trim();
  const termLower = term.toLowerCase();

  const sortMaybe = (list) =>
    alphabetical ? [...list].sort((a, b) => a.localeCompare(b)) : list;

  const matchesSearch = (tag) => tag.toLowerCase().includes(termLower);

  const selectedList = sortMaybe(selected.filter(matchesSearch));

  const availableList = sortMaybe(
    available.filter(
      (tag) =>
        !selected.some((s) => s.toLowerCase() === tag.toLowerCase()) &&
        matchesSearch(tag)
    )
  );

  const exactExists = [...selected, ...available].some(
    (tag) => tag.toLowerCase() === termLower
  );
  const canCreate = term.length > 0 && !exactExists;

  const addTag = (tag) => {
    if (selected.some((s) => s.toLowerCase() === tag.toLowerCase())) return;
    onChange([...selected, tag]);
  };

  const removeTag = (tag) => {
    onChange(selected.filter((s) => s !== tag));
  };

  const handleCreate = () => {
    addTag(term);
    setSearch("");
  };

  return (
    <s-stack gap="base">
      <s-grid gap="small" gridTemplateColumns="1fr auto" alignItems="end">
        <s-text-field
          label="Tags"
          {...exclusiveFieldLabel}
          icon="search"
          placeholder="Search to find or create tags"
          value={search}
          onInput={(event) => setSearch(getInputEventValue(event))}
        />
        <s-button
          variant="tertiary"
          icon="sort"
          onClick={() => setAlphabetical((prev) => !prev)}
        >
          Alphabetical
        </s-button>
      </s-grid>

      {canCreate && (
        <s-button variant="tertiary" icon="plus" onClick={handleCreate}>
          Create “{term}”
        </s-button>
      )}

      {selectedList.length > 0 && (
        <s-stack gap="small-200">
          <s-text fontWeight="bold">To add</s-text>
          {selectedList.map((tag) => (
            <s-checkbox
              key={tag}
              label={tag}
              checked
              onChange={() => removeTag(tag)}
            />
          ))}
        </s-stack>
      )}

      {availableList.length > 0 && (
        <s-stack gap="small-200">
          <s-text fontWeight="bold">Available</s-text>
          {availableList.map((tag) => (
            <s-checkbox
              key={tag}
              label={tag}
              checked={undefined}
              onChange={() => addTag(tag)}
            />
          ))}
        </s-stack>
      )}

      {selectedList.length === 0 &&
        availableList.length === 0 &&
        !canCreate && <s-text color="subdued">No tags yet</s-text>}
    </s-stack>
  );
}
