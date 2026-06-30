import React from "react";
import "../../styles/CustomDiscountDetail.css";

export default function DiscountTiersSection({
  tiers = [],
  onChangeTiers,
  discountType,
}) {
  const isFixed = discountType === "fixed_amount";

  const handleAddTier = () => {
    const newTier = {
      id: Date.now() + Math.random(),
      message: "",
      quantity: "",
      discountValue: "",
    };
    onChangeTiers([...tiers, newTier]);
  };

  const handleRemoveTier = (id) => {
    onChangeTiers(tiers.filter((tierItem) => tierItem.id !== id));
  };

  const handleUpdateTierField = (id, field, val) => {
    onChangeTiers(
      tiers.map((tierItem) => {
        if (tierItem.id === id) {
          return { ...tierItem, [field]: val };
        }
        return tierItem;
      })
    );
  };

  return (
    <s-section heading="Discount Tiers">
      <s-stack gap="base">
        {tiers.map((tier, index) => (
          <s-box
            key={tier.id}
            border="base"
            borderRadius="base"
            padding="base"
          >
            <s-stack gap="base">
              <s-stack direction="inline" alignItems="center" gap="base">
                <s-box grow="1">
                  <s-text type="strong">Tier {index + 1}</s-text>
                </s-box>
                {tiers.length > 1 && (
                  <s-button
                    variant="tertiary"
                    tone="critical"
                    icon="delete"
                    accessibilityLabel="Remove tier"
                    onClick={() => handleRemoveTier(tier.id)}
                  />
                )}
              </s-stack>

              <s-text-field
                label="Message"
                placeholder="e.g. Buy more, save more"
                value={tier.message}
                onInput={(event) =>
                  handleUpdateTierField(tier.id, "message", event.target.value)
                }
              />

              <s-grid gridTemplateColumns="1fr 1fr" gap="base">
                <s-text-field
                  label="Quantity"
                  type="number"
                  placeholder="0"
                  value={tier.quantity}
                  onInput={(event) =>
                    handleUpdateTierField(tier.id, "quantity", event.target.value)
                  }
                />
                <s-text-field
                  label="Discount Value"
                  type="number"
                  placeholder={isFixed ? "0.00" : "0"}
                  prefix={isFixed ? "$" : undefined}
                  suffix={!isFixed ? "%" : undefined}
                  value={tier.discountValue}
                  onInput={(event) =>
                    handleUpdateTierField(
                      tier.id,
                      "discountValue",
                      event.target.value
                    )
                  }
                />
              </s-grid>
            </s-stack>
          </s-box>
        ))}

        <div>
          <s-button variant="primary" onClick={handleAddTier}>
            Add a tier
          </s-button>
        </div>
      </s-stack>
    </s-section>
  );
}
