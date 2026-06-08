import { useState } from "react";
import {
  clearDefaultZeroProps,
  getInputEventValue,
} from "../../utils/fieldEvent";
import ProductMediaUpload from "./ProductMediaUpload";

import { exclusiveFieldLabel } from "../../utils/formFields";

export default function ProductVariantForm({
  options,
  defaultPrice = "",
  defaultInventory = "0",
  productTitle,
  onSubmit,
  onCancel,
  saving = false,
}) {
  const [optionValues, setOptionValues] = useState(() =>
    options.map(() => ""),
  );
  const [price, setPrice] = useState(defaultPrice);
  const [inventoryQuantity, setInventoryQuantity] = useState(defaultInventory);
  const [imageUrl, setImageUrl] = useState("");
  const [imageAlt, setImageAlt] = useState("");
  const [trackInventory] = useState(true);

  const setOptionValue = (index, value) => {
    setOptionValues((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  };

  const handleSubmit = () => {
    onSubmit?.({
      optionValues,
      price,
      inventoryQuantity,
      imageUrl,
      imageAlt,
    });
  };

  const hasOptions = options.length > 0;

  return (
    <div className="variant-editor-form">
      <s-stack gap="base">
        <s-section>
          <s-stack gap="base">
            <ProductMediaUpload
              title={productTitle}
              images={imageUrl ? [{ url: imageUrl, alt: imageAlt }] : []}
              maxImages={1}
              onImagesChange={(images) => {
                const first = images[0];
                setImageUrl(first?.url || "");
                setImageAlt(first?.alt || "");
              }}
              onError={() => {}}
            />
            <s-stack direction="inline" gap="small">
              <s-text color="subdued">All channels</s-text>
              <s-text color="subdued">·</s-text>
              <s-text color="subdued">All catalogs</s-text>
            </s-stack>
          </s-stack>
        </s-section>

        {hasOptions ? (
          <s-section>
            <s-stack gap="base">
              {options.map((option, index) => (
                <s-text-field
                  key={option.position ?? index}
                  label={option.name || `Option ${index + 1}`}
                  placeholder={`Enter ${option.name || "value"}`}
                  value={optionValues[index] || ""}
                  onInput={(event) =>
                    setOptionValue(index, getInputEventValue(event))
                  }
                />
              ))}
            </s-stack>
          </s-section>
        ) : (
          <s-section>
            <s-text-field
              label="Variant name"
              placeholder="e.g. Khaki, Large"
              value={optionValues[0] || ""}
              onInput={(event) =>
                setOptionValue(0, getInputEventValue(event))
              }
            />
          </s-section>
        )}

        <s-section heading="Price">
          <s-money-field
            label="Price"
            {...exclusiveFieldLabel}
            value={price}
            onInput={(event) => setPrice(getInputEventValue(event))}
            {...clearDefaultZeroProps(price, setPrice, "")}
          />
          <s-stack direction="inline" gap="small">
            <s-button variant="tertiary">Compare-at</s-button>
            <s-button variant="tertiary">Unit price</s-button>
            <s-text color="subdued">Charge tax · Yes</s-text>
          </s-stack>
        </s-section>

        <s-section heading="Inventory">
          <s-stack direction="inline" gap="small" alignItems="center">
            <s-text type="strong">Inventory tracked</s-text>
            <s-badge tone="success">On</s-badge>
          </s-stack>
          {trackInventory ? (
            <s-box paddingBlockStart="base">
              <s-text-field
                label="Quantity"
                value={inventoryQuantity}
                inputMode="numeric"
                onInput={(event) =>
                  setInventoryQuantity(getInputEventValue(event))
                }
                onChange={(event) =>
                  setInventoryQuantity(getInputEventValue(event))
                }
                {...clearDefaultZeroProps(
                  inventoryQuantity,
                  setInventoryQuantity,
                  "0",
                )}
              />
              <s-text color="subdued">Shop location</s-text>
            </s-box>
          ) : null}
        </s-section>

        <s-stack direction="inline" gap="small">
          <s-button
            variant="primary"
            onClick={handleSubmit}
            {...(saving ? { loading: true } : {})}
          >
            Save variant
          </s-button>
          <s-button variant="tertiary" onClick={onCancel}>
            Cancel
          </s-button>
        </s-stack>
      </s-stack>
    </div>
  );
}
