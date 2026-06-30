import { BLOCK_VISIBILITY_OPTIONS } from "../../constants/checkoutConstants";
import CheckoutConditionsSection from "./CheckoutConditions";
import { getInputEventValue } from "../../utils/fieldEvent";
import { useChoiceList } from "../../hooks/useChoiceList";

export default function CheckoutCommonHeader({
  internalName,
  onInternalNameChange,
  blockVisibility,
  onBlockVisibilityChange,
  displayRule,
  onDisplayRuleChange,
  displayConditions,
  onDisplayConditionsChange,
  radioName = "displayRule",
  subtext = "Choose the visibility of your checkout upsell block based on your specific requirements.",
}) {
  const choiceListRef = useChoiceList(displayRule, onDisplayRuleChange);

  const showBlockVisibility =
    blockVisibility !== undefined && onBlockVisibilityChange !== undefined;

  return (
    <>
      <s-section heading="Internal Name">
        <s-stack gap="base">
          <div>
            <s-text-field
              label="Internal Name"
              label-hidden
              value={internalName}
              onInput={(event) => onInternalNameChange(event.target.value)}
            />
            <div style={{ marginTop: 4 }}>
              <s-text tone="subdued">Not displayed to customers.</s-text>
            </div>
          </div>
        </s-stack>
      </s-section>

      {showBlockVisibility && (
        <s-section heading="Block Visibility">
          <s-stack gap="base">
            <div>
              <s-select
                value={blockVisibility}
                onChange={(event) => onBlockVisibilityChange(getInputEventValue(event))}
              >
                {BLOCK_VISIBILITY_OPTIONS.map((opt) => (
                  <s-option key={opt} value={opt}>
                    {opt}
                  </s-option>
                ))}
              </s-select>
              <div style={{ marginTop: 4 }}>
                <s-text tone="subdued">
                  Choose the visibility of your checkout upsell block based on
                  your specific requirements.
                </s-text>
              </div>
            </div>
          </s-stack>
        </s-section>
      )}

      <s-section heading="Display Rules">
        <s-stack gap="base">
          <div>
            <s-choice-list
              ref={choiceListRef}
              name={radioName}
              values={[displayRule]}
            >
              <s-choice value="all">Show to all customers</s-choice>
              <s-choice value="conditional">Only show when...</s-choice>
            </s-choice-list>
            <div style={{ marginTop: 8 }}>
              <s-text tone="subdued">{subtext}</s-text>
            </div>
          </div>
        </s-stack>
      </s-section>

      {displayRule === "conditional" && (
        <CheckoutConditionsSection
          displayConditions={displayConditions}
          onChange={onDisplayConditionsChange}
        />
      )}
    </>
  );
}
