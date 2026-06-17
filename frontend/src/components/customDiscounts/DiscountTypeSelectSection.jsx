import React from "react";
import { CAMPAIGN_OPTIONS } from "../../constants/customDiscounts";
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
          <select
            className="custom-select-field"
            value={campaignType}
            onChange={(e) =>
              onChangeCampaignType && onChangeCampaignType(e.target.value)
            }
          >
            {filteredOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </s-stack>
    </s-section>
  );
}
