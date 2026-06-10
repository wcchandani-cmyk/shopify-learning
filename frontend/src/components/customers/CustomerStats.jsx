import { formatMoney } from "../../utils/customerForm";

function customerSince(createdAt) {
  if (!createdAt) return "—";
  const days = Math.floor(
    (Date.now() - new Date(createdAt).getTime()) / 86400000
  );
  if (Number.isNaN(days) || days < 0) return "—";
  if (days === 0) return "Today";
  return `${days} day${days === 1 ? "" : "s"}`;
}

export default function CustomerStats({ form }) {
  return (
    <s-section padding="base">
      <s-grid gap="base" gridTemplateColumns="1fr 1fr 1fr">
        <s-stack gap="small-300">
          <s-text color="subdued">Amount spent</s-text>
          <s-text>
            {formatMoney(form.amountSpent, form.currencyCode, { locale: "en" })}
          </s-text>
        </s-stack>
        <s-stack gap="small-300">
          <s-text color="subdued">Orders</s-text>
          <s-text>{form.numberOfOrders}</s-text>
        </s-stack>
        <s-stack gap="small-300">
          <s-text color="subdued">Customer since</s-text>
          <s-text>{customerSince(form.createdAt)}</s-text>
        </s-stack>
      </s-grid>
    </s-section>
  );
}
