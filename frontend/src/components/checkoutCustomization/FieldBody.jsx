import ChoiceEditor from "./ChoiceEditor";
import { getChoiceListValue } from "../../utils/fieldEvent";

const FieldTypeControls = ({ field, upd }) => {
  const { type } = field;

  if (type === "checkbox") return (
    <s-checkbox
      label="Is checkbox selected by default"
      checked={field.defaultChecked || undefined}
      onClick={() => upd("defaultChecked", !field.defaultChecked)}
    />
  );

  if (type === "choice_list" || type === "dropdown") return (
    <ChoiceEditor choices={field.choices} onChange={(c) => upd("choices", c)} />
  );

  if (type === "text_input" || type === "phone_field") return (
    <s-text-field
      label="Placeholder (optional)"
      value={field.placeholder}
      onInput={(e) => upd("placeholder", e.target.value)}
    />
  );

  if (type === "date_of_birth") return (
    <>
      <div>
        <div style={{ marginBottom: 8 }}>
          <s-text fontWeight="bold">Date type</s-text>
        </div>
        <s-choice-list
          name={`dob-type-${field._id}`}
          value={field.dateType || "full"}
          onChange={(e) => {
            const val = getChoiceListValue(e);
            if (val) {
              upd("dateType", val);
            }
          }}
        >
          <s-choice value="full">Full date</s-choice>
          <s-choice value="month_day">Month and day</s-choice>
          <s-choice value="year">Only year</s-choice>
        </s-choice-list>
        <div style={{ marginTop: 4 }}>
          <s-text tone="subdued">"YYYY-MM-DD" format according to ISO 8601.</s-text>
        </div>
      </div>

      <div>
        <s-text-field
          label="Require minimum age"
          type="number"
          suffix="Years"
          value={field.minAge || ""}
          onInput={(e) => upd("minAge", e.target.value)}
        />
        <div style={{ marginTop: 4 }}>
          <s-text tone="subdued">
            If the customer is not at least this age, they will be prevented from proceeding with the checkout.
          </s-text>
        </div>
      </div>

      <div>
        <s-text-field
          label="Error message when under minimum age"
          multiline={3}
          value={field.minAgeError || "You must be at least {age} to continue."}
          onInput={(e) => upd("minAgeError", e.target.value)}
        />
        <div style={{ marginTop: 4 }}>
          <s-text tone="subdued">
            Displayed when the customer is under the minimum age. {"{age}"} will be replaced with the minimum age.
          </s-text>
        </div>
      </div>
    </>
  );

  if (type === "date_picker") return (
    <div>
      <div style={{ marginBottom: 8 }}>
        <s-text fontWeight="bold">Date Picker Preview</s-text>
      </div>
      <s-text-field
        type="date"
        value={field.defaultDate || ""}
        onInput={(e) => upd("defaultDate", e.target.value)}
      />
      <div style={{ marginTop: 6 }}>
        <s-text tone="subdued">
          Set an optional default date. A date picker calendar will be shown to the customer at checkout.
        </s-text>
      </div>
    </div>
  );

  return null;
}

const FieldBody = ({ field, upd, orderFieldSetting }) => {
  return (
    <s-stack gap="base">
      <s-stack gap="none">
        <s-checkbox
          label="Required field"
          checked={field.required || undefined}
          onClick={() => upd("required", !field.required)}
        />
        <s-box padding-inline-start="700" padding-block-start="100">
          <s-text tone="subdued">
            To proceed with the checkout, the customer is required to fill out this field.
          </s-text>
        </s-box>
      </s-stack>

      <s-grid gridTemplateColumns="1fr 1fr" gap="base">
        <div>
          <s-text-field label="Field label *" value={field.label} onInput={(e) => upd("label", e.target.value)} />
          <s-box padding-block-start="100">
            <s-text tone="subdued">
              Markdown links are supported. e.g. [Link text](https://example.com)
            </s-text>
          </s-box>
        </div>
        <div>
          <s-text-field label="Key *" value={field.key} onInput={(e) => upd("key", e.target.value)} />
          <s-box padding-block-start="100">
            <s-text tone="subdued">
              Only for internal use. When saving, it maps to the meta field/attribute key.
            </s-text>
          </s-box>
        </div>
      </s-grid>

      <div>
        <s-text-field
          label="Help text (optional)"
          value={field.helpText}
          onInput={(e) => upd("helpText", e.target.value)}
        />
        <div style={{ marginTop: 4 }}>
          <s-text tone="subdued">Under the input, help text is displayed.</s-text>
        </div>
      </div>

      <FieldTypeControls field={field} upd={upd} />
    </s-stack>
  );
};

export default FieldBody;
