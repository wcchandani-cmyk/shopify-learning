import { useState } from "react";
import { getInputEventValue } from "../../utils/fieldEvent";
import CombinationsSection from "../discounts/CombinationsSection";
import MaximumUsesSection from "../discounts/MaximumUsesSection";

export default function AdditionalOptionsSection({ form, updateField }) {
  const [expanded, setExpanded] = useState(true);

  return (
    <s-section>
      <s-stack gap="base">
        <s-stack direction="inline" alignItems="center" gap="base">
          <s-box grow="1">
            <s-heading>Additional Options</s-heading>
          </s-box>
          <s-button
            variant="tertiary"
            icon={expanded ? "chevron-up" : "chevron-down"}
            accessibilityLabel={
              expanded
                ? "Collapse additional options"
                : "Expand additional options"
            }
            onClick={() => setExpanded(!expanded)}
          />
        </s-stack>

        {expanded && (
          <s-stack gap="base">
            {form.method === "Code" && (
              <MaximumUsesSection
                form={form}
                updateField={updateField}
                plain={true}
                title="Usage Limits"
                limitTotalLabel="Limit number of times this discount can be used in total"
              />
            )}

            <CombinationsSection
              form={form}
              updateField={updateField}
              displayType="Custom Discount"
            />

            <s-stack gap="base">
              <s-heading>Active Dates</s-heading>
              <s-grid gridTemplateColumns="1fr 1fr" gap="base">
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
              </s-grid>
            </s-stack>
          </s-stack>
        )}
      </s-stack>
    </s-section>
  );
}
