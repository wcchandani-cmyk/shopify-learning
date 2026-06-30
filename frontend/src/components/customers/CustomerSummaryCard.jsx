import { useMemo, useState } from "react";
import {
  TAX_SETTING_OPTIONS,
  addressLines,
  customerHasAddress,
  languageLabel,
} from "../../utils/customerForm";

const CARD_MENU_ID = "customer-card-menu";

export default function CustomerSummaryCard({
  form,
  editModalId,
  manageAddressesModalId,
  company,
  onAddToCompany,
  onCopyEmail,
  onEdit,
}) {
  const taxLabel = useMemo(
    () =>
      TAX_SETTING_OPTIONS.find((opt) => opt.value === form.taxSetting)?.label ||
      "Collect tax",
    [form.taxSetting]
  );

  const [expanded, setExpanded] = useState(false);

  const lines = addressLines(
    form.address,
    `${form.firstName} ${form.lastName}`.trim()
  );
  const hasAddress = customerHasAddress(form.address);

  return (
    <s-section>
      <s-stack gap="base">
        <s-stack
          direction="inline"
          gap="base"
          alignItems="center"
          justifyContent="space-between"
        >
          <s-heading>Customer</s-heading>
          <s-button
            variant="tertiary"
            icon="menu-horizontal"
            accessibilityLabel="Customer actions"
            commandFor={CARD_MENU_ID}
          />
        </s-stack>

        <s-stack gap="small-400">
          <s-text fontWeight="bold">Contact information</s-text>
          {form.email ? (
            <div className="cust-email-row">
              <s-link href={`mailto:${form.email}`}>{form.email}</s-link>
              <s-button
                variant="tertiary"
                icon="clipboard"
                accessibilityLabel="Copy email"
                onClick={onCopyEmail}
              />
            </div>
          ) : (
            <s-text color="subdued">No email provided</s-text>
          )}
          {form.phone ? <s-text>{form.phone}</s-text> : null}
          <s-text color="subdued">
            Will receive notifications in {languageLabel(form.locale)}
          </s-text>
        </s-stack>

      {expanded ? (
        <>
          <s-stack gap="small-400">
            <s-text fontWeight="bold">Default address</s-text>
            {hasAddress ? (
              lines.map((line, index) => <s-text key={index}>{line}</s-text>)
            ) : (
              <s-text color="subdued">No address provided</s-text>
            )}
          </s-stack>

          <s-stack gap="small-300">
            <s-text fontWeight="bold">Marketing</s-text>
            <s-stack direction="inline" gap="small-100" className="cust-marketing">
              <s-badge tone={form.emailSubscribed ? "success" : undefined}>
                Email
              </s-badge>
              <s-badge tone={form.smsSubscribed ? "success" : undefined}>
                SMS
              </s-badge>
            </s-stack>
          </s-stack>

            <s-stack gap="small-300">
              <s-text fontWeight="bold">Tax details</s-text>
              <s-text color="subdued">{taxLabel}</s-text>
            </s-stack>
          </>
        ) : null}

        <div className="cust-show-more">
          <s-button
            variant="tertiary"
            icon={expanded ? "chevron-up" : "chevron-down"}
            onClick={() => setExpanded((prev) => !prev)}
          >
            {expanded ? "Show less" : "Show more"}
          </s-button>
        </div>
      </s-stack>

      <s-menu id={CARD_MENU_ID} accessibilityLabel="Customer actions">
        <s-button
          command="--show"
          commandFor={editModalId}
          onClick={() => onEdit("contact")}
        >
          Edit contact information
        </s-button>
        <s-button command="--show" commandFor={manageAddressesModalId}>
          Manage addresses
        </s-button>
        <s-button
          command="--show"
          commandFor={editModalId}
          onClick={() => onEdit("marketing")}
        >
          Edit marketing settings
        </s-button>
        <s-button
          command="--show"
          commandFor={editModalId}
          onClick={() => onEdit("tax")}
        >
          Edit tax details
        </s-button>
        {!company ? (
          <s-button onClick={onAddToCompany}>Add to company</s-button>
        ) : null}
      </s-menu>
    </s-section>
  );
}
