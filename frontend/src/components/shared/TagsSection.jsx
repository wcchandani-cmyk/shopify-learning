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
              commitTag();
            }
          }}
          onBlur={commitTag}
        />
      ) : (
        <div className="tags-display-container" onClick={() => setIsEditingTags(true)}>
          {tagList.map((tag) => (
            <span key={tag} className="tag-pill">
              {tag}
              <button
                type="button"
                className="tag-pill__remove"
                onClick={(event) => {
                  event.stopPropagation();
                  const nextTags = tagList.filter((t) => t !== tag);
                  updateField("tags", nextTags.join(", "));
                }}
              >
                &times;
              </button>
            </span>
          ))}
          <span className="add-tags-btn">
            <s-icon type="plus-circle" /> Add tags
          </span>
        </div>
      )}
    </s-section>
  );
}
