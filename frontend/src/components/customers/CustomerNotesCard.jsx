export default function CustomerNotesCard({ note, editModalId, onEdit }) {
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
            command="--show"
            commandFor={editModalId}
            onClick={() => onEdit("notes")}
          />
        </s-stack>
        {note ? (
          <s-text>{note}</s-text>
        ) : (
          <s-text color="subdued">No notes</s-text>
        )}
      </s-stack>
    </s-section>
  );
}
