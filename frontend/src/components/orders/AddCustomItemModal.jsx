import { useCallback, useState } from "react";
import { getInputEventValue, getCheckboxChecked, clearDefaultZeroProps } from "../../utils/fieldEvent";
import { useOverlayModal } from "../../hooks/useOverlayModal";

const CUSTOM_ITEM_MODAL_ID = "add-custom-item-modal";

export default function AddCustomItemModal({ open, onClose, onAdd }) {
  const { modalRef, onAfterHide } = useOverlayModal(open, onClose);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("0.00");
  const [quantity, setQuantity] = useState(1);
  const [taxable, setTaxable] = useState(true);
  const [physicalProduct, setPhysicalProduct] = useState(true);
  const [weight, setWeight] = useState("0");
  const [weightUnit, setWeightUnit] = useState("kg");

  const resetFields = useCallback(() => {
    setName("");
    setPrice("0.00");
    setQuantity(1);
    setTaxable(true);
    setPhysicalProduct(true);
    setWeight("0");
    setWeightUnit("kg");
  }, []);

  const handleSubmit = useCallback(() => {
    const trimmedName = name.trim();
    if (!trimmedName) return;

    onAdd({
      title: trimmedName,
      price: parseFloat(price) || 0,
      quantity: parseInt(quantity, 10) || 1,
      taxable,
      requiresShipping: physicalProduct,
      weight: physicalProduct ? parseFloat(weight) || 0 : 0,
      weightUnit: physicalProduct ? weightUnit : "kg",
      isCustom: true,
    });

    resetFields();
    onClose();
  }, [name, price, quantity, taxable, physicalProduct, weight, weightUnit, onAdd, onClose, resetFields]);

  return (
    <s-modal
      id={CUSTOM_ITEM_MODAL_ID}
      ref={modalRef}
      heading="Add custom item"
      onAfterHide={onAfterHide}
    >
      <s-grid gap="base" gridTemplateColumns="1fr">
        <s-grid gap="base" gridTemplateColumns="2fr 1fr 1fr">
          <s-text-field
            label="Item name"
            value={name}
            onInput={(event) => setName(getInputEventValue(event))}
          />
          <s-text-field
            label="Price"
            prefix="$"
            value={price}
            onInput={(event) => setPrice(getInputEventValue(event))}
            {...clearDefaultZeroProps(price, setPrice, "0.00")}
          />
          <s-text-field
            label="Quantity"
            type="number"
            value={String(quantity)}
            onInput={(event) => setQuantity(Math.max(1, parseInt(getInputEventValue(event), 10) || 1))}
          />
        </s-grid>

        <s-stack gap="small-400">
          <s-checkbox
            id="custom-item-taxable"
            label="Item is taxable"
            checked={taxable || undefined}
            onChange={(event) => setTaxable(getCheckboxChecked(event))}
          />

          <s-checkbox
            id="custom-item-physical"
            label="Item is a physical product"
            checked={physicalProduct || undefined}
            onChange={(event) => setPhysicalProduct(getCheckboxChecked(event))}
          />
        </s-stack>

        {physicalProduct && (
          <div>
            <s-grid gap="base" gridTemplateColumns="1fr 80px">
              <s-text-field
                label="Item weight (optional)"
                type="number"
                value={weight}
                onInput={(event) => setWeight(getInputEventValue(event))}
                {...clearDefaultZeroProps(weight, setWeight, "0")}
              />
              <s-select
                label="Unit"
                value={weightUnit}
                onChange={(event) => setWeightUnit(getInputEventValue(event))}
              >
                <s-option value="kg">kg</s-option>
                <s-option value="g">g</s-option>
                <s-option value="lb">lb</s-option>
                <s-option value="oz">oz</s-option>
              </s-select>
            </s-grid>
            <s-text color="subdued" type="small">
              Used to calculate shipping rates accurately
            </s-text>
          </div>
        )}
      </s-grid>

      <s-button slot="primary-action" variant="primary" onClick={handleSubmit} {...(name.trim() ? {} : { disabled: true })}>
        Add item
      </s-button>
      <s-button slot="secondary-actions" variant="tertiary" onClick={onClose}>
        Cancel
      </s-button>
    </s-modal>
  );
}
