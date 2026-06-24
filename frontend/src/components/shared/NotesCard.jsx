export default function NotesCard({
  note,
  placeholder = "No notes",
  editModalId,
  onEdit,
  href,
  target,
}) {
  return (
    <s-section>
      <s-stack gap="small-200">
        <s-stack
          direction="inline"
          gap="base"
          alignItems="center"
          justifyContent="space-between"
        >
          <s-heading>Notes</s-heading>
          <s-button
            variant="tertiary"
            icon="edit"
            accessibilityLabel="Edit notes"
            {...(editModalId
              ? { command: "--show", commandFor: editModalId }
              : {})}
            {...(onEdit ? { onClick: onEdit } : {})}
            {...(href ? { href } : {})}
            {...(target ? { target } : {})}
          />
        </s-stack>
        {note ? (
          <div
            style={{
              whiteSpace: "pre-wrap",
              fontSize: "14px",
              color: "var(--s-color-text, #303030)",
            }}
          >
            {note}
          </div>
        ) : (
          <s-text color="subdued">{placeholder}</s-text>
        )}
      </s-stack>
    </s-section>
  );
}
