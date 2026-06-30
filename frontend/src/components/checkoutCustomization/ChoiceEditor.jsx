export default function ChoiceEditor({ choices = [], onChange }) {
  const add = () => onChange([...choices, { label: "", value: "" }]);
  const upd = (i, k, v) =>
    onChange(choices.map((c, idx) => (idx === i ? { ...c, [k]: v } : c)));
  const remove = (i) => onChange(choices.filter((_, idx) => idx !== i));

  return (
    <div className="ccf-choice-list">
      <s-text type="strong">Choices</s-text>
      {choices.map((c, i) => (
        <div key={i} className="ccf-choice-row">
          <s-text-field
            label="Label"
            label-hidden
            placeholder="Label"
            value={c.label}
            onInput={(e) => upd(i, "label", e.target.value)}
          />
          <s-text-field
            label="Value"
            label-hidden
            placeholder="Value"
            value={c.value}
            onInput={(e) => upd(i, "value", e.target.value)}
          />
          <s-button
            variant="tertiary"
            tone="critical"
            icon="delete"
            accessibilityLabel="Remove"
            onClick={() => remove(i)}
          />
        </div>
      ))}
      <s-button variant="tertiary" icon="plus-circle" onClick={add}>
        Add choice
      </s-button>
    </div>
  );
}
