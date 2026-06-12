import { useCallback, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppBridge } from "@shopify/app-bridge-react";
import { useCustomerList } from "../../hooks/customer/useCustomerList";
import { useCustomerSelection } from "../../hooks/customer/useCustomerSelection";
import { bulkDeleteCustomers } from "../../services/customerService";
import { getCheckboxChecked, getInputEventValue } from "../../utils/fieldEvent";
import { exclusiveFieldLabel } from "../../utils/formFields";
import PageLoader from "../PageLoader";
import CustomerRow from "./CustomerRow";

const SELECT_ALL_ID = "customer-list-select-all";

function matchesSearch(customer, search) {
  const term = search.trim().toLowerCase();
  if (!term) return true;
  return (
    customer.name.toLowerCase().includes(term) ||
    (customer.location || "").toLowerCase().includes(term)
  );
}

export default function CustomerList() {
  const navigate = useNavigate();
  const shopify = useAppBridge();

  const {
    customers,
    count,
    pagination,
    loading,
    error,
    reload,
    goToPreviousPage,
    goToNextPage,
  } = useCustomerList();
  const [search, setSearch] = useState("");
  const [deleting, setDeleting] = useState(false);

  const filteredCustomers = useMemo(
    () => customers.filter((customer) => matchesSearch(customer, search)),
    [customers, search]
  );

  const {
    selectedCount,
    allFilteredSelected,
    someFilteredSelected,
    toggleCustomer,
    toggleSelectAllFiltered,
    clearSelection,
    isSelected,
    getSelectedIds,
  } = useCustomerSelection(filteredCustomers);

  const handleAddCustomer = useCallback(() => {
    navigate("/customers/new");
  }, [navigate]);

  const handleDeleteSelected = useCallback(async () => {
    const ids = getSelectedIds();
    if (!ids.length || deleting) return;

    setDeleting(true);
    try {
      const token = await shopify.idToken();
      await bulkDeleteCustomers(ids, token);
      shopify.toast.show(
        ids.length === 1 ? "Customer deleted" : `${ids.length} customers deleted`
      );
      clearSelection();
      reload();
    } catch (err) {
      shopify.toast.show(err.message || "Could not delete customers", {
        isError: true,
      });
    } finally {
      setDeleting(false);
    }
  }, [getSelectedIds, deleting, shopify, clearSelection, reload]);

  const showEmpty = !loading && !error && filteredCustomers.length === 0;
  const showList = !loading && !error && filteredCustomers.length > 0;

  const searchField = (
    <s-text-field
      label="Search customers"
      {...exclusiveFieldLabel}
      icon="search"
      placeholder="Search by name or location"
      value={search}
      onInput={(event) => setSearch(getInputEventValue(event))}
    />
  );

  const selectAllCheckbox = (id) => (
    <s-checkbox
      id={id}
      checked={allFilteredSelected || undefined}
      indeterminate={someFilteredSelected || undefined}
      onChange={(event) => toggleSelectAllFiltered(getCheckboxChecked(event))}
    />
  );

  return (
    <s-page heading="Customers">
      <s-button slot="primary-action" variant="primary" onClick={handleAddCustomer}>
        Add customer
      </s-button>

      {!loading && !error && (
        <s-section>
          {selectedCount > 0 ? (
            <s-stack direction="inline" gap="base" alignItems="center">
              <s-text>{selectedCount} selected</s-text>
              <s-button variant="tertiary" onClick={clearSelection}>
                Clear
              </s-button>
              <s-button
                variant="tertiary"
                tone="critical"
                onClick={handleDeleteSelected}
                {...(deleting ? { loading: true } : {})}
              >
                Delete
              </s-button>
            </s-stack>
          ) : (
            <s-text>
              {count} {count === 1 ? "customer" : "customers"}
            </s-text>
          )}
        </s-section>
      )}

      {error && (
        <s-section>
          <s-banner tone="critical" heading="Could not load customers">
            {error}
          </s-banner>
        </s-section>
      )}

      {loading && (
        <s-section>
          <PageLoader accessibilityLabel="Loading customers" />
        </s-section>
      )}

      {showEmpty && (
        <s-section accessibilityLabel="Empty customers state">
          <s-grid gap="base" justifyItems="center" paddingBlock="large-400">
            <s-stack alignItems="center">
              <s-heading>No customers found</s-heading>
              <s-paragraph>
                {search
                  ? "Try a different search term or clear the search field."
                  : "Customers from your store will appear here."}
              </s-paragraph>
            </s-stack>
          </s-grid>
        </s-section>
      )}

      {showList && (
        <s-section padding="none" accessibilityLabel="Customers table">
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
              <s-table-header listSlot="labeled">
                {selectAllCheckbox(SELECT_ALL_ID)}
              </s-table-header>
              <s-table-header listSlot="primary">Customer name</s-table-header>
              <s-table-header>Email subscription</s-table-header>
              <s-table-header>Location</s-table-header>
              <s-table-header>Orders</s-table-header>
              <s-table-header listSlot="secondary">Amount spent</s-table-header>
            </s-table-header-row>

            <s-table-body>
              {filteredCustomers.map((customer) => (
                <CustomerRow
                  key={customer.id}
                  customer={customer}
                  selected={isSelected(customer.id)}
                  onSelectedChange={toggleCustomer}
                />
              ))}
            </s-table-body>
          </s-table>
        </s-section>
      )}
    </s-page>
  );
}
