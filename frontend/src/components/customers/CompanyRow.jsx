import { memo } from "react";
import { Link } from "react-router-dom";
import { formatMoney } from "../../utils/customerForm";
import { getCheckboxChecked } from "../../utils/fieldEvent";

const CompanyRow = memo(function CompanyRow({
  company,
  selected = false,
  onSelectedChange,
}) {
  const orderingTone = company.ordering === "Approved" ? "success" : "warning";
  const idToken = company.id.split("/").pop();
  
  return (
    <s-table-row>
      <s-table-cell>
        <s-checkbox
          checked={selected || undefined}
          onChange={(event) =>
            onSelectedChange?.(company.id, getCheckboxChecked(event))
          }
        />
      </s-table-cell>
      <s-table-cell>
        <Link
          to={`/companies/${idToken}`}
          style={{
            fontWeight: 600,
            color: "#0066cc",
            textDecoration: "none",
          }}
        >
          {company.name}
        </Link>
      </s-table-cell>
      <s-table-cell>
        <s-badge tone={orderingTone}>{company.ordering}</s-badge>
      </s-table-cell>
      <s-table-cell>
        {company.locationsCount} {company.locationsCount === 1 ? "location" : "locations"}
      </s-table-cell>
      <s-table-cell>
        {company.mainContact}
      </s-table-cell>
      <s-table-cell>
        {company.totalOrders} {company.totalOrders === 1 ? "order" : "orders"}
      </s-table-cell>
      <s-table-cell>
        {formatMoney(company.totalSales, company.currencyCode, {
          fallbackCurrency: "USD",
        })}
      </s-table-cell>
    </s-table-row>
  );
});

export default CompanyRow;
