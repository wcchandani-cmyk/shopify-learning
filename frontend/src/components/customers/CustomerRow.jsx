import { memo } from "react";
import { useNavigate } from "react-router-dom";
import { formatMoney } from "../../utils/customerForm";
import { getCheckboxChecked } from "../../utils/fieldEvent";

const CustomerRow = memo(function CustomerRow({
  customer,
  selected = false,
  onSelectedChange,
}) {
  const navigate = useNavigate();
  const detailPath = `/customers/${customer.id}`;

  return (
    <s-table-row>
      <s-table-cell>
        <s-checkbox
          checked={selected || undefined}
          onChange={(event) =>
            onSelectedChange?.(customer.id, getCheckboxChecked(event))
          }
        />
      </s-table-cell>
      <s-table-cell>
        <s-link
          href={detailPath}
          onClick={(event) => {
            event.preventDefault();
            navigate(detailPath);
          }}
        >
          {customer.name}
        </s-link>
      </s-table-cell>
      <s-table-cell>
        {customer.emailSubscribed ? (
          <s-badge tone="success">Subscribed</s-badge>
        ) : (
          <s-badge>Not subscribed</s-badge>
        )}
      </s-table-cell>
      <s-table-cell>{customer.location || "—"}</s-table-cell>
      <s-table-cell>{customer.ordersCount}</s-table-cell>
      <s-table-cell>
        {formatMoney(customer.amountSpent, customer.currencyCode, {
          fallbackCurrency: "USD",
        })}
      </s-table-cell>
    </s-table-row>
  );
});

export default CustomerRow;
