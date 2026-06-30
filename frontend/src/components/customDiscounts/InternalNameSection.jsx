import { exclusiveFieldLabel } from "../../utils/formFields";
import "../../styles/CustomDiscountDetail.css";

export default function InternalNameSection({ title, onChangeTitle }) {
  return (
    <s-section heading="Internal Name">
      <s-stack gap="base">
        <div>
          <s-text-field
            id="internal-name-input"
            label="Title"
            {...exclusiveFieldLabel}
            placeholder="e.g. 10% off checkout rule"
            value={title}
            onInput={(e) => onChangeTitle(e.target.value)}
          />
          <s-box padding-block-start="100">
            <s-text tone="subdued">
              Only visible to you — not shown to customers.
            </s-text>
          </s-box>
        </div>
      </s-stack>
    </s-section>
  );
}
