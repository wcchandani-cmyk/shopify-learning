import { getCheckboxChecked } from "../../utils/fieldEvent";

export default function SalesChannelAccessSection({ form, updateField, onOpenChannelModal }) {
  return (
    <s-section heading="Sales channel access">
      <s-stack gap="extra-tight">
        <s-checkbox
          label="Allow discount to be featured on"
          checked={form.allowFeaturedChannels}
          onChange={(event) => updateField("allowFeaturedChannels", getCheckboxChecked(event))}
        />
        {form.allowFeaturedChannels && (
          <div style={{ paddingLeft: "24px", marginTop: "2px" }}>
            <button
              type="button"
              className="link-button"
              style={{ textDecoration: "underline", fontSize: "14px" }}
              onClick={onOpenChannelModal}
            >
              {form.selectedChannels ? form.selectedChannels.length : 0} sales channels
            </button>
          </div>
        )}
      </s-stack>
    </s-section>
  );
}
