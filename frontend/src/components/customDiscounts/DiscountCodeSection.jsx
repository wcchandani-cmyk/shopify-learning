import React from "react";
import { exclusiveFieldLabel } from "../../utils/formFields";
import { getInputEventValue } from "../../utils/fieldEvent";
import "../../styles/CustomDiscountDetail.css";

export default function DiscountCodeSection({ code, onChangeCode, onGenerateCode }) {
  return (
    <s-section heading="Discount Code">
      <s-stack gap="base">
        <div className="discount-generate-container">
          <div>
            <s-text-field
              label="Discount Code"
              {...exclusiveFieldLabel}
              placeholder="e.g. SUMMER2026"
              value={code}
              onInput={(e) => onChangeCode(getInputEventValue(e))}
            />
          </div>
          <button
            type="button"
            className="field-action-btn"
            onClick={onGenerateCode}
          >
            Generate code
          </button>
        </div>
      </s-stack>
    </s-section>
  );
}
