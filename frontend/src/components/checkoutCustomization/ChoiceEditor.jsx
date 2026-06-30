export default function ChoiceEditor({ choices = [], onChange }) {
  const add = () => onChange([...choices, { label: "", value: "" }]);
  const upd = (index, key, val) =>
    onChange(choices.map((choice, choiceIndex) => (choiceIndex === index ? { ...choice, [key]: val } : choice)));
  const remove = (index) => onChange(choices.filter((_, choiceIndex) => choiceIndex !== index));

  return (
    <div className="ccf-choice-list">
      <s-text type="strong">Choices</s-text>
      {choices.map((choice, index) => (
        <div key={index} className="ccf-choice-row">
          <s-text-field
            label="Label"
            label-hidden
            placeholder="Label"
            value={choice.label}
            onInput={(event) => upd(index, "label", event.target.value)}
          />
          <s-text-field
            label="Value"
            label-hidden
            placeholder="Value"
            value={choice.value}
            onInput={(event) => upd(index, "value", event.target.value)}
          />
          <s-button
            variant="tertiary"
            tone="critical"
            icon="delete"
            accessibilityLabel="Remove"
            onClick={() => remove(index)}
          />
        </div>
      ))}
      <s-button variant="tertiary" icon="plus-circle" onClick={add}>
        Add choice
      </s-button>
    </div>
  );
}
