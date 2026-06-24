import SearchableSelect from "../shared/SearchableSelect";

export default function OrderCustomerCard({
  customer,
  customerOptions,
  loadingCustomers,
  shippingStr,
  billingStr,
  onUpdateCustomer,
  onCreateNewCustomer,
}) {
  const customerName = customer
    ? customer.displayName || [customer.firstName, customer.lastName].filter(Boolean).join(" ")
    : "";

  return (
    <s-section>
      <s-stack gap="small-300">
        <s-stack
          direction="inline"
          gap="base"
          alignItems="center"
          justifyContent="space-between"
        >
          <s-heading>Customer</s-heading>
        </s-stack>

        {customer ? (
          <div className="order-customer-box">
            <s-stack gap="small-200">
              <s-stack
                direction="inline"
                gap="base"
                alignItems="center"
                justifyContent="space-between"
              >
                <s-link href={`/customers/${customer.id}`} style={{ fontWeight: 600 }}>
                  {customerName || `${customer.numberOfOrders || 0} ${(customer.numberOfOrders || 0) === 1 ? "order" : "orders"}`}
                </s-link>
                <s-button
                  variant="tertiary"
                  icon="x"
                  accessibilityLabel="Remove customer"
                  onClick={() => onUpdateCustomer("")}
                  style={{ height: '24px', minHeight: '24px', margin: 0, padding: 0 }}
                />
              </s-stack>

              {customerName ? (
                <s-stack gap="small-050">
                  <s-link href={`/customers/${customer.id}`}>
                    {customer.numberOfOrders || 0}{" "}
                    {(customer.numberOfOrders || 0) === 1 ? "order" : "orders"}
                  </s-link>
                </s-stack>
              ) : null}

              <s-divider />

              <s-stack gap="small-050">
                <s-text fontWeight="medium">Contact information</s-text>
                {customer.email ? (
                  <s-link href={`mailto:${customer.email}`}>
                    {customer.email}
                  </s-link>
                ) : (
                  <s-text color="subdued">No email provided</s-text>
                )}
                {customer.phone ? <s-text>{customer.phone}</s-text> : null}
              </s-stack>

              {customer.company ? (
                <>
                  <s-divider />
                  <s-stack gap="small-050">
                    <s-text fontWeight="medium">Company</s-text>
                    <s-text>{customer.company}</s-text>
                  </s-stack>
                </>
              ) : null}

              <s-divider />

              <s-stack gap="small-050">
                <s-text fontWeight="medium">Shipping address</s-text>
                {shippingStr ? (
                  <div className="order-sidebar-address-lines">{shippingStr}</div>
                ) : (
                  <s-text color="subdued">No shipping address provided</s-text>
                )}
              </s-stack>

              <s-divider />

              <s-stack gap="small-050">
                <s-text fontWeight="medium">Billing address</s-text>
                {billingStr ? (
                  <div className="order-sidebar-address-lines">{billingStr}</div>
                ) : (
                  <s-text color="subdued">No billing address provided</s-text>
                )}
              </s-stack>
            </s-stack>
          </div>
        ) : (
          <SearchableSelect
            value=""
            onChange={onUpdateCustomer}
            options={customerOptions}
            loading={loadingCustomers}
            triggerPlaceholder="Search or create a customer"
            placeholder="Search or create a customer"
            optionClassName="customer-select-option"
            renderOption={(opt) => (
              <>
                <div className="customer-select-option__name">{opt.label}</div>
                <div className="customer-select-option__email">
                  {opt.email || "No email"}
                </div>
              </>
            )}
            onActionClick={onCreateNewCustomer}
            actionLabel="Add new customer"
            actionIcon="plus-circle"
          />
        )}
      </s-stack>
    </s-section>
  );
}
