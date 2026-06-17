import { useState } from "react";
import { getInputEventValue } from "../../utils/fieldEvent";
import CombinationsSection from "../discounts/CombinationsSection";
import MaximumUsesSection from "../discounts/MaximumUsesSection";

export default function AdditionalOptionsSection({ form, updateField }) {
  const [expanded, setExpanded] = useState(true);

  return (
    <s-section>
      <div className="additional-options-header-row">
        <span className="additional-options-header-title">
          Additional Options
        </span>
        <button
          type="button"
          className="additional-options-collapse-btn"
          onClick={() => setExpanded(!expanded)}
          aria-label={
            expanded
              ? "Collapse additional options"
              : "Expand additional options"
          }
        >
          <s-icon type={expanded ? "chevron-up" : "chevron-down"} />
        </button>
      </div>

      {expanded && (
        <div className="additional-options-content-body">
          {form.method === "Code" && (
            <div className="additional-options-sub-section">
              <MaximumUsesSection
                form={form}
                updateField={updateField}
                plain={true}
                title="Usage Limits"
                limitTotalLabel="Limit number of times this discount can be used in total"
              />
            </div>
          )}

          <div className="additional-options-sub-section">
            <CombinationsSection
              form={form}
              updateField={updateField}
              displayType="Custom Discount"
            />
          </div>

          <div className="additional-options-sub-section additional-options-last-section">
            <h4 className="additional-options-sub-heading">Active Dates</h4>
            <div className="side-by-side-row">
              <div>
                <s-date-field
                  label="Start Date"
                  value={form.startDate || ""}
                  preferredPosition="above"
                  preferred-position="above"
                  onInput={(e) =>
                    updateField("startDate", getInputEventValue(e))
                  }
                  onChange={(e) =>
                    updateField("startDate", getInputEventValue(e))
                  }
                />
              </div>
              <div>
                <s-date-field
                  label="End Date"
                  value={form.endDate || ""}
                  preferredPosition="above"
                  preferred-position="above"
                  onInput={(e) => {
                    const val = getInputEventValue(e);
                    updateField("endDate", val);
                    updateField("hasEndDate", Boolean(val));
                  }}
                  onChange={(e) => {
                    const val = getInputEventValue(e);
                    updateField("endDate", val);
                    updateField("hasEndDate", Boolean(val));
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </s-section>
  );
}
