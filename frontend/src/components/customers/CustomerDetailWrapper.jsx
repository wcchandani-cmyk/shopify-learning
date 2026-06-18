import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import PageLoader from "../PageLoader";
import CustomerDetail from "./CustomerDetail";
import CustomerOverview from "./CustomerOverview";
import { useCustomerDetail } from "../../hooks/customer/useCustomerDetail";
import { useMetafieldsPrefetch } from "../../hooks/useMetafieldsPrefetch";

export default function CustomerDetailWrapper() {
  const { id } = useParams();
  const isNew = id === "new";
  const navigate = useNavigate();

  const { customer, loading, error } = useCustomerDetail(isNew ? null : id);

  const { loading: metafieldsLoading } = useMetafieldsPrefetch(
    "customer",
    customer?.id
  );

  const handleCreated = () => {
    navigate("/customers", { replace: true });
  };

  const breadcrumb = (
    <s-link
      slot="breadcrumb-actions"
      href="/customers"
      onClick={(event) => {
        event.preventDefault();
        navigate("/customers");
      }}
    >
      Customers
    </s-link>
  );

  if (isNew) {
    return <CustomerDetail isNew customer={null} onSaved={handleCreated} />;
  }

  if (loading || (customer && metafieldsLoading)) {
    return (
      <s-page heading="Customer">
        {breadcrumb}
        <s-section>
          <PageLoader accessibilityLabel="Loading customer" />
        </s-section>
      </s-page>
    );
  }

  if (error || !customer) {
    return (
      <s-page heading="Customer">
        {breadcrumb}
        <s-section>
          <s-banner tone="critical" heading="Could not load customer">
            {error || "Customer not found"}
          </s-banner>
        </s-section>
      </s-page>
    );
  }

  return <CustomerOverview customer={customer} />;
}
