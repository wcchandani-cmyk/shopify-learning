export default function CustomerTagsCard({ tags, editModalId, onEdit }) {
  const tagList = tags
    ? tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean)
    : [];

  return (
    <s-section>
      <s-stack gap="small-200">
        <s-stack
          direction="inline"
          gap="base"
          alignItems="center"
          justifyContent="space-between"
        >
          <s-heading>Tags</s-heading>
          <s-button
            variant="tertiary"
            icon="edit"
            accessibilityLabel="Edit tags"
            command="--show"
            commandFor={editModalId}
            onClick={() => onEdit("tags")}
          />
        </s-stack>
        {tagList.length > 0 ? (
          <s-stack direction="inline" gap="small">
            {tagList.map((tag) => (
              <s-badge key={tag}>{tag}</s-badge>
            ))}
          </s-stack>
        ) : (
          <s-text color="subdued">No tags</s-text>
        )}
      </s-stack>
    </s-section>
  );
}
