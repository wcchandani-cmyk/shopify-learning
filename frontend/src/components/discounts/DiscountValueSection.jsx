import { getInputEventValue } from "../../utils/fieldEvent";
import SelectedResourcesList from "./SelectedResourcesList";

export default function DiscountValueSection({
  form,
  setForm,
  updateField,
  appliesToSearchQuery,
  setAppliesToSearchQuery,
  filteredSelectedItems,
  isExpandedResources,
  setIsExpandedResources,
  onBrowse,
  onEditProduct,
}) {
  return (
    <s-section heading="Discount value">
      <s-stack gap="base">
        <div className="side-by-side-row">
          <div className="column-50">
            <s-select
              label="Value type"
              labelAccessibilityVisibility="exclusive"
              value={form.valueType}
              onChange={(event) => updateField("valueType", getInputEventValue(event))}
            >
              <s-option value="percentage">Percentage</s-option>
              <s-option value="fixed_amount">Fixed amount</s-option>
            </s-select>
          </div>
          <div className="column-50 input-with-suffix">
            <s-text-field
              label="Discount value"
              labelAccessibilityVisibility="exclusive"
              placeholder="0"
              value={form.value}
              onInput={(event) => updateField("value", getInputEventValue(event))}
            />
            <span className="field-suffix">
              {form.valueType === "percentage" ? "%" : "$"}
            </span>
          </div>
        </div>

        <div className="side-by-side-row">
          <div className="column-50">
            <label className="field-label" style={{ marginBottom: "4px", display: "block" }}>Applies to</label>
            <s-select
              label="Applies to"
              labelAccessibilityVisibility="exclusive"
              value={form.appliesTo}
              onChange={(event) => {
                const val = getInputEventValue(event);
                setForm(prev => ({
                  ...prev,
                  appliesTo: val,
                  selectedItems: [],
                  searchQuery: ""
                }));
              }}
            >
              <s-option value="all">All products</s-option>
              <s-option value="collections">Specific collections</s-option>
              <s-option value="products">Specific products</s-option>
            </s-select>
          </div>
          <div className="column-50">
            <label className="field-label" style={{ marginBottom: "4px", display: "block" }}>Purchase type</label>
            <s-select
              label="Purchase type"
              labelAccessibilityVisibility="exclusive"
              value={form.purchaseType}
              onChange={(event) => updateField("purchaseType", getInputEventValue(event))}
            >
              <s-option value="one_time">One-time purchase</s-option>
              <s-option value="subscription">Subscription</s-option>
              <s-option value="both">Both</s-option>
            </s-select>
          </div>
        </div>

        {(form.appliesTo === "collections" || form.appliesTo === "products") && (
          <s-stack gap="tight">
            <div className="search-browse-row">
              <div className="search-input-wrapper">
                <s-text-field
                  label={`Search ${form.appliesTo}`}
                  labelAccessibilityVisibility="exclusive"
                  icon="search"
                  placeholder={`Search ${form.appliesTo}`}
                  value={appliesToSearchQuery}
                  onInput={(event) => setAppliesToSearchQuery(getInputEventValue(event))}
                />
              </div>
              <s-button onClick={() => onBrowse()}>Browse</s-button>
            </div>

            <SelectedResourcesList
              items={filteredSelectedItems}
              appliesTo={form.appliesTo}
              isExpanded={isExpandedResources}
              onToggleExpand={() => setIsExpandedResources(!isExpandedResources)}
              onEdit={(item) => onEditProduct(item)}
              onRemove={(item) => {
                const next = (form.selectedItems || []).filter((i) => i.id !== item.id);
                setForm(prev => ({
                  ...prev,
                  selectedItems: next,
                  searchQuery: next.map((i) => i.title).join(", ")
                }));
              }}
            />
          </s-stack>
        )}
      </s-stack>
    </s-section>
  );
}
