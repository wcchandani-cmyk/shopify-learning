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
              <button
                type="button"
                className="cust-copy"
                aria-label="Copy email"
                onClick={onCopyEmail}
              >
                <s-icon type="clipboard" />
              </button>
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
              <div className="cust-marketing">
                <span className="cust-badge">
                  <span
                    className={`cust-badge__dot cust-badge__dot--${
                      form.emailSubscribed ? "on" : "off"
                    }`}
                  />
                  Email
                </span>
                <span className="cust-badge">
                  <span
                    className={`cust-badge__dot cust-badge__dot--${
                      form.smsSubscribed ? "on" : "off"
                    }`}
                  />
                  SMS
                </span>
              </div>
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
