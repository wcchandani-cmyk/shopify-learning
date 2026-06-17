import { exclusiveFieldLabel } from "../../utils/formFields";
import "../../styles/CustomDiscountDetail.css";

export default function InternalNameSection({ title, onChangeTitle }) {
  return (
    <s-section heading="Internal Name">
      <s-stack gap="base">
        <div>
          <label className="form-group-label" htmlFor="internal-name-input">
            Title
          </label>
          <s-text-field
            id="internal-name-input"
            label="Title"
            {...exclusiveFieldLabel}
            placeholder="e.g. 10% off checkout rule"
            value={title}
            onInput={(e) => onChangeTitle(e.target.value)}
          />
          <div className="form-group-subtext">
            Only visible to you — not shown to customers.
          </div>
        </div>
      </s-stack>
    </s-section>
  );
}
