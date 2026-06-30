import React from "react";
import { exclusiveFieldLabel } from "../../utils/formFields";
import { getInputEventValue } from "../../utils/fieldEvent";
import "../../styles/CustomDiscountDetail.css";

export default function DiscountCodeSection({ code, onChangeCode, onGenerateCode }) {
  return (
    <s-section heading="Discount Code">
      <s-stack gap="base">
        <div style={{ display: "flex", gap: "12px", alignItems: "flex-end", width: "100%" }}>
          <div style={{ flex: "0 1 320px" }}>
            <s-text-field
              label="Discount Code"
              {...exclusiveFieldLabel}
              placeholder="e.g. SUMMER2026"
              value={code}
              onInput={(e) => onChangeCode(getInputEventValue(e))}
            />
          </div>
          <div>
            <s-button variant="secondary" onClick={onGenerateCode}>
              Generate code
            </s-button>
          </div>
        </div>
      </s-stack>
    </s-section>
  );
}
