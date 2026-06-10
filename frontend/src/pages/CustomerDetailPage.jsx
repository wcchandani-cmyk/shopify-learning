import { useNavigate, useParams } from "react-router-dom";
import PageLoader from "../components/PageLoader";
import CustomerDetail from "../components/customers/CustomerDetail";
import CustomerOverview from "../components/customers/CustomerOverview";
import { useCustomerDetail } from "../hooks/useCustomerDetail";

export default function CustomerDetailPage() {
  const { id } = useParams();
  const isNew = id === "new";
  const navigate = useNavigate();

  const { customer, loading, error } = useCustomerDetail(isNew ? null : id);

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

  if (loading) {
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
