import { getInputEventValue } from "../../utils/fieldEvent";

export default function DiscountHeaderSection({
  form,
  updateField,
  isNew,
  displayType,
  onGenerateCode,
}) {
  if (isNew) {
    return (
      <s-section heading={displayType}>
        <s-stack gap="base">
          <div className="form-group">
            <label className="field-label field-label--method">Method</label>
            <div className="segmented-control">
              <button
                type="button"
                className={`segmented-control__button ${form.method === "Code" ? "segmented-control__button--selected" : ""}`}
                onClick={() => updateField("method", "Code")}
              >
                Discount code
              </button>
              <button
                type="button"
                className={`segmented-control__button ${form.method === "Automatic" ? "segmented-control__button--selected" : ""}`}
                onClick={() => updateField("method", "Automatic")}
              >
                Automatic discount
              </button>
            </div>
          </div>

          {form.method === "Code" ? (
            <div className="form-group">
              <div className="field-header-row discount-header__field-header">
                <label className="field-label">Discount code</label>
                <button
                  type="button"
                  className="link-button"
                  onClick={onGenerateCode}
                >
                  Generate random code
                </button>
              </div>
              <s-text-field
                label="Discount code"
                labelAccessibilityVisibility="exclusive"
                placeholder="e.g. SUMMER50"
                value={form.title}
                onInput={(event) => updateField("title", getInputEventValue(event))}
              />
              <div className="field-subtext discount-header__field-subtext">
                Customers must enter this code at checkout.
              </div>
            </div>
          ) : (
            <div className="form-group">
              <label className="field-label field-label--block">Title</label>
              <s-text-field
                label="Title"
                labelAccessibilityVisibility="exclusive"
                placeholder="e.g. 10% Off Automatic"
                value={form.title}
                onInput={(event) => updateField("title", getInputEventValue(event))}
              />
              <div className="field-subtext discount-header__field-subtext">
                Customers will see this in their cart and at checkout.
              </div>
            </div>
          )}
        </s-stack>
      </s-section>
    );
  }

  if (form.method === "Code") {
    return (
      <s-section heading="Discount code">
        <div className="discount-header__code-created-row">
          <s-stack gap="extra-tight">
            <s-text fontWeight="bold">1 code created by: chandani</s-text>
            <div className="discount-header__badge-wrapper">
              <s-badge tone="info">App</s-badge>
            </div>
            <s-text color="subdued" className="discount-header__unique-code-subtext">
              Each customer will enter a unique code at checkout.
            </s-text>
          </s-stack>
          <s-link href="/discounts">View all codes</s-link>
        </div>
      </s-section>
    );
  }

  return (
    <s-section heading={displayType}>
      <s-stack gap="base">
        <div className="form-group">
          <label className="field-label field-label--block">Title</label>
          <s-text-field
            label="Title"
            labelAccessibilityVisibility="exclusive"
            value={form.title}
            onInput={(event) => updateField("title", getInputEventValue(event))}
          />
          <div className="field-subtext discount-header__field-subtext">
            Customers will see this in their cart and at checkout.
          </div>
        </div>
      </s-stack>
    </s-section>
  );
}
