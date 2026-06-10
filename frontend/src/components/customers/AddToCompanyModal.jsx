import { useCallback, useEffect, useRef, useState } from "react";
import { useAppBridge } from "@shopify/app-bridge-react";
import { searchCompanies } from "../../services/companyService";
import { addressLines } from "../../utils/customerForm";
import { getInputEventValue } from "../../utils/fieldEvent";

const ADD_TO_COMPANY_MODAL_ID = "customer-add-to-company-modal";

export default function AddToCompanyModal({
  open,
  customerName,
  customerAddress,
  assigning = false,
  onAssign,
  onClose,
}) {
  const shopify = useAppBridge();
  const modalRef = useRef(null);
  const [view, setView] = useState("search");
  const [search, setSearch] = useState("");
  const [newName, setNewName] = useState("");
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const modal = modalRef.current;
    if (!modal) return;
    if (open) modal.showOverlay?.();
    else modal.hideOverlay?.();
  }, [open]);

  useEffect(() => {
    if (open) {
      setView("search");
      setSearch("");
      setNewName("");
    }
  }, [open]);

  // Live-search companies (debounced) while on the search step.
  useEffect(() => {
    if (!open || view !== "search") return undefined;
    let active = true;
    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const token = await shopify.idToken();
        const result = await searchCompanies(search, token);
        if (active) setCompanies(result);
      } catch {
        if (active) setCompanies([]);
      } finally {
        if (active) setLoading(false);
      }
    }, 250);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [open, view, search, shopify]);

  const trimmedSearch = search.trim();
  const trimmedName = newName.trim();

  const goToCreate = useCallback(() => {
    setNewName(trimmedSearch);
    setView("create");
  }, [trimmedSearch]);

  const goToSearch = useCallback(() => setView("search"), []);

  const handleSelectExisting = useCallback(
    (company) => {
      if (assigning) return;
      onAssign({ companyId: company.id, companyName: company.name });
    },
    [assigning, onAssign]
  );

  const handleSaveNew = useCallback(() => {
    if (assigning || !trimmedName) return;
    onAssign({ companyId: null, companyName: trimmedName });
  }, [assigning, trimmedName, onAssign]);

  const handleAfterHide = useCallback(
    (event) => {
      if (event.target === event.currentTarget) onClose();
    },
    [onClose]
  );

  const shippingLines = addressLines(customerAddress || {}, customerName || "");

  return (
    <s-modal
      id={ADD_TO_COMPANY_MODAL_ID}
      ref={modalRef}
      heading={view === "create" ? "Add to new company" : "Add to company"}
      onAfterHide={handleAfterHide}
    >
      {view === "search" ? (
        <s-stack gap="base">
          {customerName ? (
            <s-text color="subdued">
              Add {customerName} to a company so they can place B2B orders on its
              behalf.
            </s-text>
          ) : null}

          <s-text-field
            label="Search or add new company"
            labelAccessibilityVisibility="exclusive"
            icon="search"
            placeholder="Search or add new company"
            value={search}
            onInput={(event) => setSearch(getInputEventValue(event))}
          />

          <s-box border="base" borderRadius="base" overflow="hidden">
            <button
              type="button"
              className="company-option company-option--create"
              onClick={goToCreate}
              disabled={assigning}
            >
              <s-icon type="plus-circle" />
              <span className="company-option__label">Add new company</span>
            </button>

            <s-divider />

            {loading ? (
              <div className="company-option company-option--status">
                <s-spinner
                  accessibilityLabel="Searching companies"
                  size="small"
                />
                <span className="company-option__label">Searching…</span>
              </div>
            ) : companies.length > 0 ? (
              companies.map((company) => (
                <button
                  key={company.id}
                  type="button"
                  className="company-option"
                  onClick={() => handleSelectExisting(company)}
                  disabled={assigning}
                >
                  <span className="company-option__label">{company.name}</span>
                </button>
              ))
            ) : (
              <div className="company-option company-option--status">
                <span className="company-option__label">
                  {trimmedSearch
                    ? "No matching companies. Use “Add new company” above."
                    : "No companies yet. Add a new one above."}
                </span>
              </div>
            )}
          </s-box>
        </s-stack>
      ) : (
        <s-stack gap="base">
          <s-text-field
            label="Company name"
            placeholder="Company name"
            value={newName}
            error={!trimmedName ? "Company name is required" : undefined}
            onInput={(event) => setNewName(getInputEventValue(event))}
          />

          <s-stack gap="small-100">
            <s-text fontWeight="bold">Main contact</s-text>
            <s-text color="subdued">{customerName || "—"}</s-text>
          </s-stack>

          {shippingLines.length > 0 ? (
            <s-stack gap="small-100">
              <s-text fontWeight="bold">Shipping address</s-text>
              {shippingLines.map((line, index) => (
                <s-text key={index} color="subdued">
                  {line}
                </s-text>
              ))}
            </s-stack>
          ) : null}
        </s-stack>
      )}

      {view === "create" ? (
        <s-button
          slot="primary-action"
          variant="primary"
          onClick={handleSaveNew}
          {...(assigning ? { loading: true } : {})}
          {...(!trimmedName ? { disabled: true } : {})}
        >
          Save
        </s-button>
      ) : null}

      <s-button
        slot="secondary-actions"
        onClick={view === "create" ? goToSearch : onClose}
      >
        {view === "create" ? "Back" : "Cancel"}
      </s-button>
    </s-modal>
  );
}
