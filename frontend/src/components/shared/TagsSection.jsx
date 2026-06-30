import { getInputEventValue } from "../../utils/fieldEvent";

export default function TagsSection({
  isEditingTags,
  setIsEditingTags,
  tagInput,
  setTagInput,
  tagList,
  updateField,
}) {
  const commitTag = () => {
    const trimmed = tagInput.trim();
    if (trimmed) {
      const nextTags = tagList.includes(trimmed) ? tagList : [...tagList, trimmed];
      updateField("tags", nextTags.join(", "));
    }
    setTagInput("");
    setIsEditingTags(false);
  };

  return (
    <s-section heading="Tags">
      {isEditingTags ? (
        <s-text-field
          label="Search or add tags"
          labelAccessibilityVisibility="exclusive"
          icon="search"
          placeholder="Search or add tags"
          value={tagInput}
          autoFocus
          onInput={(event) => setTagInput(getInputEventValue(event))}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              event.target.blur();
            }
          }}
          onBlur={commitTag}
        />
      ) : (
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "8px",
            alignItems: "center",
          }}
          onClick={() => setIsEditingTags(true)}
        >
          {tagList.map((tag) => (
            <s-clickable-chip
              key={tag}
              removable
              accessibilityLabel={tag}
              onRemove={(event) => {
                event.stopPropagation();
                const nextTags = tagList.filter((tagItem) => tagItem !== tag);
                updateField("tags", nextTags.join(", "));
              }}
            >
              <span
                style={{
                  display: "inline-block",
                  padding: "2px 0",
                  fontSize: "13px",
                  lineHeight: "1.2",
                }}
              >
                {tag}
              </span>
            </s-clickable-chip>
          ))}
          <s-button
            variant="plain"
            icon="plus-circle"
            onClick={(event) => {
              event.stopPropagation();
              setIsEditingTags(true);
            }}
          >
            Add tags
          </s-button>
        </div>
      )}
    </s-section>
  );
}
