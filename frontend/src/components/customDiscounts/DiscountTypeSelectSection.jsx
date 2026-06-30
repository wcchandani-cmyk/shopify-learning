import React from "react";
import { CAMPAIGN_OPTIONS } from "../../constants/customDiscounts";
import { getInputEventValue } from "../../utils/fieldEvent";
import "../../styles/CustomDiscountDetail.css";

export default function DiscountTypeSelectSection({
  campaignType = "conditional_discount",
  onChangeCampaignType,
  method = "Automatic",
  functionType = "1",
  shippingDiscountType = "discount",
}) {
  const isFreeShipping =
    functionType === "2" && shippingDiscountType === "free_shipping";

  const showThree = method === "Code" && !isFreeShipping;
  const filteredOptions = showThree
    ? CAMPAIGN_OPTIONS
    : CAMPAIGN_OPTIONS.slice(0, 2);

  return (
    <s-section heading="Discount Type">
      <s-stack gap="base">
        <div>
          <s-select
            label="Campaign Type"
            labelAccessibilityVisibility="exclusive"
            value={campaignType}
            onChange={(event) =>
              onChangeCampaignType && onChangeCampaignType(getInputEventValue(event))
            }
          >
            {filteredOptions.map((option) => (
              <s-option key={option.value} value={option.value}>
                {option.label}
              </s-option>
            ))}
          </s-select>
        </div>
      </s-stack>
    </s-section>
  );
}
