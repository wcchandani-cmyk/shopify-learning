import { getInputEventValue, getCheckboxChecked } from "../../utils/fieldEvent";
import SelectedResourcesList from "./SelectedResourcesList";

export default function BuyXGetYSection({
  form,
  setForm,
  updateField,
  buysSearchQuery,
  setBuysSearchQuery,
  getsSearchQuery,
  setGetsSearchQuery,
  filteredBuysItems,
  filteredGetsItems,
  isExpandedBuys,
  setIsExpandedBuys,
  isExpandedGets,
  setIsExpandedGets,
  onBrowse,
  onEditProduct,
}) {
  return (
    <s-stack gap="base">
      <s-section heading="Customer buys">
        <s-stack gap="base">
          <div className="radio-group">
            <label className="radio-label">
              <input
                type="radio"
                name="bxgyCustomerBuysType"
                value="quantity"
                checked={form.bxgyCustomerBuysType === "quantity"}
                onChange={() => {
                  setForm(prev => ({
                    ...prev,
                    bxgyCustomerBuysType: "quantity",
                    bxgyCustomerBuysAmount: ""
                  }));
                }}
              />
              <span>Minimum quantity of items</span>
            </label>
            <label className="radio-label">
              <input
                type="radio"
                name="bxgyCustomerBuysType"
                value="amount"
                checked={form.bxgyCustomerBuysType === "amount"}
                onChange={() => {
                  setForm(prev => ({
                    ...prev,
                    bxgyCustomerBuysType: "amount",
                    bxgyCustomerBuysQuantity: "1"
                  }));
                }}
              />
              <span>Minimum purchase amount</span>
            </label>
          </div>

          <div className="side-by-side-row">
            <div className="column-40">
              {form.bxgyCustomerBuysType === "quantity" ? (
                <s-text-field
                  label="Quantity"
                  placeholder="1"
                  value={form.bxgyCustomerBuysQuantity}
                  onInput={(event) => updateField("bxgyCustomerBuysQuantity", getInputEventValue(event))}
                />
              ) : (
                <s-money-field
                  label="Amount"
                  placeholder="0.00"
                  value={form.bxgyCustomerBuysAmount}
                  onInput={(event) => updateField("bxgyCustomerBuysAmount", getInputEventValue(event))}
                />
              )}
            </div>
            <div className="column-40">
              <label className="field-label" style={{ marginBottom: "4px", display: "block" }}>Any items from</label>
              <s-select
                label="Any items from"
                labelAccessibilityVisibility="exclusive"
                value={form.bxgyCustomerBuysAppliesTo}
                onChange={(event) => {
                  const val = getInputEventValue(event);
                  setForm(prev => ({
                    ...prev,
                    bxgyCustomerBuysAppliesTo: val,
                    bxgyCustomerBuysSelectedItems: []
                  }));
                }}
              >
                <s-option value="products">Specific products</s-option>
                <s-option value="collections">Specific collections</s-option>
              </s-select>
            </div>
            <div className="column-40">
              <label className="field-label" style={{ marginBottom: "4px", display: "block" }}>Purchase type</label>
              <s-select
                label="Purchase type"
                labelAccessibilityVisibility="exclusive"
                value={form.bxgyCustomerBuysPurchaseType}
                onChange={(event) => updateField("bxgyCustomerBuysPurchaseType", getInputEventValue(event))}
              >
                <s-option value="one_time">One-time purchase</s-option>
                <s-option value="subscription">Subscription</s-option>
                <s-option value="both">Both</s-option>
              </s-select>
            </div>
          </div>

          <s-stack gap="tight">
            <div className="search-browse-row">
              <div className="search-input-wrapper">
                <s-text-field
                  label={`Search ${form.bxgyCustomerBuysAppliesTo}`}
                  labelAccessibilityVisibility="exclusive"
                  icon="search"
                  placeholder={`Search ${form.bxgyCustomerBuysAppliesTo}`}
                  value={buysSearchQuery}
                  onInput={(event) => setBuysSearchQuery(getInputEventValue(event))}
                />
              </div>
              <s-button onClick={() => onBrowse("buys")}>Browse</s-button>
            </div>

            <SelectedResourcesList
              items={filteredBuysItems}
              appliesTo={form.bxgyCustomerBuysAppliesTo}
              isExpanded={isExpandedBuys}
              onToggleExpand={() => setIsExpandedBuys(!isExpandedBuys)}
              onEdit={(item) => onEditProduct({ product: item, section: "buys" })}
              onRemove={(item) => {
                const next = (form.bxgyCustomerBuysSelectedItems || []).filter((i) => i.id !== item.id);
                updateField("bxgyCustomerBuysSelectedItems", next);
              }}
            />
          </s-stack>
        </s-stack>
      </s-section>

      <s-section heading="Customer gets">
        <s-stack gap="base">
          <s-text color="subdued">
            Customers must add the quantity of items specified below to their cart.
          </s-text>

          <div className="side-by-side-row">
            <div className="column-50">
              <s-text-field
                label="Quantity"
                placeholder="1"
                value={form.bxgyCustomerGetsQuantity}
                onInput={(event) => updateField("bxgyCustomerGetsQuantity", getInputEventValue(event))}
              />
            </div>
            <div className="column-50">
              <label className="field-label" style={{ marginBottom: "4px", display: "block" }}>Any items from</label>
              <s-select
                label="Any items from"
                labelAccessibilityVisibility="exclusive"
                value={form.bxgyCustomerGetsAppliesTo}
                onChange={(event) => {
                  const val = getInputEventValue(event);
                  setForm(prev => ({
                    ...prev,
                    bxgyCustomerGetsAppliesTo: val,
                    bxgyCustomerGetsSelectedItems: []
                  }));
                }}
              >
                <s-option value="products">Specific products</s-option>
                <s-option value="collections">Specific collections</s-option>
              </s-select>
            </div>
          </div>

          <s-stack gap="tight">
            <div className="search-browse-row">
              <div className="search-input-wrapper">
                <s-text-field
                  label={`Search ${form.bxgyCustomerGetsAppliesTo}`}
                  labelAccessibilityVisibility="exclusive"
                  icon="search"
                  placeholder={`Search ${form.bxgyCustomerGetsAppliesTo}`}
                  value={getsSearchQuery}
                  onInput={(event) => setGetsSearchQuery(getInputEventValue(event))}
                />
              </div>
              <s-button onClick={() => onBrowse("gets")}>Browse</s-button>
            </div>

            <SelectedResourcesList
              items={filteredGetsItems}
              appliesTo={form.bxgyCustomerGetsAppliesTo}
              isExpanded={isExpandedGets}
              onToggleExpand={() => setIsExpandedGets(!isExpandedGets)}
              onEdit={(item) => onEditProduct({ product: item, section: "gets" })}
              onRemove={(item) => {
                const next = (form.bxgyCustomerGetsSelectedItems || []).filter((i) => i.id !== item.id);
                updateField("bxgyCustomerGetsSelectedItems", next);
              }}
            />
          </s-stack>

          <div style={{ marginTop: "16px" }}>
            <label className="field-label" style={{ marginBottom: "8px", display: "block", fontWeight: 600 }}>At a discounted value</label>
            <div className="radio-group">
              <label className="radio-label">
                <input
                  type="radio"
                  name="bxgyCustomerGetsDiscountType"
                  value="percentage"
                  checked={form.bxgyCustomerGetsDiscountType === "percentage"}
                  onChange={() => {
                    setForm(prev => ({
                      ...prev,
                      bxgyCustomerGetsDiscountType: "percentage"
                    }));
                  }}
                />
                <span>Percentage</span>
              </label>
              <label className="radio-label">
                <input
                  type="radio"
                  name="bxgyCustomerGetsDiscountType"
                  value="fixed_amount"
                  checked={form.bxgyCustomerGetsDiscountType === "fixed_amount"}
                  onChange={() => {
                    setForm(prev => ({
                      ...prev,
                      bxgyCustomerGetsDiscountType: "fixed_amount"
                    }));
                  }}
                />
                <span>Amount off each</span>
              </label>
              <label className="radio-label">
                <input
                  type="radio"
                  name="bxgyCustomerGetsDiscountType"
                  value="free"
                  checked={form.bxgyCustomerGetsDiscountType === "free"}
                  onChange={() => {
                    setForm(prev => ({
                      ...prev,
                      bxgyCustomerGetsDiscountType: "free",
                      bxgyCustomerGetsDiscountValue: ""
                    }));
                  }}
                />
                <span>Free</span>
              </label>
            </div>

            {form.bxgyCustomerGetsDiscountType !== "free" && (
              <div className="checkbox-conditional-field" style={{ marginTop: "8px", width: "200px" }}>
                <s-text-field
                  label="Discount value"
                  labelAccessibilityVisibility="exclusive"
                  placeholder="0"
                  value={form.bxgyCustomerGetsDiscountValue}
                  onInput={(event) => updateField("bxgyCustomerGetsDiscountValue", getInputEventValue(event))}
                />
              </div>
            )}
          </div>

          <div style={{ marginTop: "16px" }}>
            <s-checkbox
              label="Set a maximum number of uses per order"
              checked={form.bxgySetMaxUsesPerOrder}
              onChange={(event) => {
                const checked = getCheckboxChecked(event);
                setForm(prev => ({
                  ...prev,
                  bxgySetMaxUsesPerOrder: checked,
                  bxgyMaxUsesPerOrderValue: checked ? "1" : ""
                }));
              }}
            />
            {form.bxgySetMaxUsesPerOrder && (
              <div className="checkbox-conditional-field" style={{ marginTop: "8px", width: "200px" }}>
                <s-text-field
                  label="Max uses per order value"
                  labelAccessibilityVisibility="exclusive"
                  placeholder="1"
                  value={form.bxgyMaxUsesPerOrderValue}
                  onInput={(event) => updateField("bxgyMaxUsesPerOrderValue", getInputEventValue(event))}
                />
              </div>
            )}
          </div>
        </s-stack>
      </s-section>
    </s-stack>
  );
}
