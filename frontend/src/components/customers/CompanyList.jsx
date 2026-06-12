import { useCallback, useEffect, useMemo, useState } from "react";
import { useAppBridge } from "@shopify/app-bridge-react";
import { listCompanies, bulkDeleteCompanies } from "../../services/companyService";
import { useCompanySelection } from "../../hooks/company/useCompanySelection";
import { getInputEventValue, getCheckboxChecked } from "../../utils/fieldEvent";
import { exclusiveFieldLabel } from "../../utils/formFields";
import PageLoader from "../PageLoader";
import CompanyRow from "./CompanyRow";

export default function CompanyList() {
  const shopify = useAppBridge();
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    shopify
      .idToken()
      .then((token) => listCompanies(token))
      .then((data) => {
        setCompanies(data);
      })
      .catch((err) => {
        setError(err.message || "Failed to load companies");
      })
      .finally(() => setLoading(false));
  }, [shopify]);

  useEffect(() => {
    load();
  }, [load]);

  const filteredCompanies = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return companies;
    return companies.filter((company) =>
      company.name.toLowerCase().includes(term)
    );
  }, [companies, search]);

  const {
    selectedCount,
    allFilteredSelected,
    someFilteredSelected,
    toggleCompany,
    toggleSelectAllFiltered,
    clearSelection,
    isSelected,
    getSelectedIds,
  } = useCompanySelection(filteredCompanies);

  const handleDeleteSelected = useCallback(async () => {
    const ids = getSelectedIds();
    if (!ids.length || deleting) return;

    setDeleting(true);
    try {
      const token = await shopify.idToken();
      await bulkDeleteCompanies(ids, token);
      shopify.toast.show(
        ids.length === 1 ? "Company deleted" : `${ids.length} companies deleted`
      );
      clearSelection();
      load();
    } catch (err) {
      shopify.toast.show(err.message || "Could not delete companies", {
        isError: true,
      });
    } finally {
      setDeleting(false);
    }
  }, [getSelectedIds, deleting, shopify, clearSelection, load]);

  const showEmpty = !loading && !error && filteredCompanies.length === 0;
  const showList = !loading && !error && filteredCompanies.length > 0;

  const searchField = (
    <s-text-field
      label="Search companies"
      {...exclusiveFieldLabel}
      icon="search"
      placeholder="Search by company name"
      value={search}
      onInput={(event) => setSearch(getInputEventValue(event))}
    />
  );

  return (
    <>
      {error && (
        <s-section>
          <s-banner tone="critical" heading="Could not load companies">
            {error}
          </s-banner>
        </s-section>
      )}

      {loading && (
        <s-section>
          <PageLoader accessibilityLabel="Loading companies" />
        </s-section>
      )}

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
              {companies.length} {companies.length === 1 ? "company" : "companies"}
            </s-text>
          )}
        </s-section>
      )}

      {showEmpty && (
        <s-section accessibilityLabel="Empty companies state">
          <s-grid gap="base" justifyItems="center" paddingBlock="large-400">
            <s-stack alignItems="center">
              <s-heading>No companies found</s-heading>
              <s-paragraph>
                {search
                  ? "Try a different search term or clear the search field."
                  : "Companies from your store will appear here."}
              </s-paragraph>
            </s-stack>
          </s-grid>
        </s-section>
      )}

      {showList && (
        <s-section padding="none" accessibilityLabel="Companies table">
          <s-table>
            <s-grid slot="filters" gap="small-200" gridTemplateColumns="1fr">
              {searchField}
            </s-grid>

            <s-table-header-row>
              <s-table-header listSlot="labeled">
                <s-checkbox
                  id="company-list-select-all"
                  checked={allFilteredSelected || undefined}
                  indeterminate={someFilteredSelected || undefined}
                  onChange={(event) => toggleSelectAllFiltered(getCheckboxChecked(event))}
                />
              </s-table-header>
              <s-table-header listSlot="primary">Company</s-table-header>
              <s-table-header>Ordering</s-table-header>
              <s-table-header>Locations</s-table-header>
              <s-table-header>Main contact</s-table-header>
              <s-table-header>Total orders</s-table-header>
              <s-table-header listSlot="secondary">Total sales</s-table-header>
            </s-table-header-row>

            <s-table-body>
              {filteredCompanies.map((company) => (
                <CompanyRow
                  key={company.id}
                  company={company}
                  selected={isSelected(company.id)}
                  onSelectedChange={toggleCompany}
                />
              ))}
            </s-table-body>
          </s-table>
        </s-section>
      )}
    </>
  );
}
