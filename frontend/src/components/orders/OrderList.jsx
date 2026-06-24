import { useCallback, useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useOrderList } from "../../hooks/order/useOrderList";
import { getInputEventValue } from "../../utils/fieldEvent";
import { exclusiveFieldLabel } from "../../utils/formFields";
import { matchesOrderSearch } from "../../utils/orderDisplay";
import PageLoader from "../shared/PageLoader";
import OrderRow from "./OrderRow";

export default function OrderList() {
  const navigate = useNavigate();
  const location = useLocation();
  const activeTab = location.pathname.startsWith("/drafts") ? "drafts" : "orders";

  const {
    orders,
    pagination,
    loading,
    error,
    goToPreviousPage,
    goToNextPage,
  } = useOrderList(activeTab);

  const [search, setSearch] = useState("");

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      return matchesOrderSearch(order, search);
    });
  }, [orders, search]);

  const handleCreateOrder = useCallback(() => {
    navigate(activeTab === "drafts" ? "/drafts/new" : "/orders/new");
  }, [navigate, activeTab]);

  const showEmpty = !loading && !error && filteredOrders.length === 0;
  const showList = !loading && !error && filteredOrders.length > 0;

  const searchField = (
    <s-text-field
      label="Search orders"
      {...exclusiveFieldLabel}
      icon="search"
      placeholder="Search by order number, customer, or tags"
      value={search}
      onInput={(event) => setSearch(getInputEventValue(event))}
    />
  );

  return (
    <s-page heading={activeTab === "drafts" ? "Drafts" : "Orders"}>
      <s-button slot="primary-action" variant="primary" onClick={handleCreateOrder}>
        Create order
      </s-button>

      {!loading && !error && (
        <s-section>
          <s-text>
            {filteredOrders.length} {activeTab === "drafts"
              ? (filteredOrders.length === 1 ? "draft" : "drafts")
              : (filteredOrders.length === 1 ? "order" : "orders")}
          </s-text>
        </s-section>
      )}

      {error && (
        <s-section>
          <s-banner tone="critical" heading="Could not load orders">
            {error}
          </s-banner>
        </s-section>
      )}

      {loading && (
        <s-section>
          <PageLoader accessibilityLabel="Loading orders" />
        </s-section>
      )}

      {showEmpty && (
        <s-section accessibilityLabel="Empty orders state">
          <s-grid gap="base" justifyItems="center" paddingBlock="large-400">
            <s-stack alignItems="center">
              <s-heading>No {activeTab === "drafts" ? "drafts" : "orders"} found</s-heading>
              <s-paragraph>
                {search
                  ? "Try a different search term or clear the search field."
                  : `${activeTab === "drafts" ? "Drafts" : "Orders"} from your store will appear here.`}
              </s-paragraph>
            </s-stack>
          </s-grid>
        </s-section>
      )}

      {showList && (
        <s-section padding="none" accessibilityLabel="Orders table">
          <s-table
            paginate
            hasPreviousPage={Boolean(pagination?.hasPreviousPage)}
            hasNextPage={Boolean(pagination?.hasNextPage)}
            onPreviousPage={goToPreviousPage}
            onNextPage={goToNextPage}
            paginationLabel={`Page ${pagination?.page ?? 1}`}
          >
            <s-grid slot="filters" gap="small-200" gridTemplateColumns="1fr">
              {searchField}
            </s-grid>

            <s-table-header-row>
              {activeTab === "drafts" ? (
                <>
                  <s-table-header listSlot="primary">Draft order</s-table-header>
                  <s-table-header>PO number</s-table-header>
                  <s-table-header>Date</s-table-header>
                  <s-table-header>Customer</s-table-header>
                  <s-table-header>Status</s-table-header>
                  <s-table-header listSlot="secondary">Total</s-table-header>
                </>
              ) : (
                <>
                  <s-table-header listSlot="primary">Order</s-table-header>
                  <s-table-header>Date</s-table-header>
                  <s-table-header>Customer</s-table-header>
                  <s-table-header>Fulfill by</s-table-header>
                  <s-table-header>Channel</s-table-header>
                  <s-table-header>Total</s-table-header>
                  <s-table-header>Payment status</s-table-header>
                  <s-table-header>Fulfillment status</s-table-header>
                  <s-table-header>Items</s-table-header>
                  <s-table-header>Delivery status</s-table-header>
                  <s-table-header>Delivery method</s-table-header>
                  <s-table-header listSlot="secondary">Tags</s-table-header>
                </>
              )}
            </s-table-header-row>

            <s-table-body>
              {filteredOrders.map((order) => (
                <OrderRow key={order.id} order={order} isDraftTab={activeTab === "drafts"} />
              ))}
            </s-table-body>
          </s-table>
        </s-section>
      )}
    </s-page>
  );
}
