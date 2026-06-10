import { useCallback, useEffect, useRef, useState } from "react";
import {
  addContactToCompany,
  listEligibleCustomers,
} from "../../services/companyService";
import { getInputEventValue } from "../../utils/fieldEvent";

export default function AddCustomerToCompanyModal({
  open,
  shopify,
  company,
  token,
  onClose,
  onSaved,
  onAddNewCustomer,
}) {
  const modalRef = useRef(null);
  const [search, setSearch] = useState("");
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [assigningId, setAssigningId] = useState(null);
  const [navigatingToNew, setNavigatingToNew] = useState(false);

  useEffect(() => {
    const modal = modalRef.current;
    if (!modal) return;
    if (open) modal.showOverlay?.();
    else modal.hideOverlay?.();
  }, [open]);

  useEffect(() => {
    if (open) {
      setSearch("");
      setNavigatingToNew(false);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    let active = true;
    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const result = await listEligibleCustomers(search, token);
        if (active) setCustomers(result);
      } catch {
        if (active) setCustomers([]);
      } finally {
        if (active) setLoading(false);
      }
    }, 250);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [open, search, token]);

  const handleAssign = async (customer) => {
    if (assigningId) return;
    setAssigningId(customer.id);
    try {
      await addContactToCompany(
        { companyId: company.id, customerId: customer.id },
        token
      );
      shopify.toast.show(`${customer.displayName} added to ${company.name}`);
      onSaved();
      onClose();
    } catch (err) {
      shopify.toast.show(err.message || "Failed to add customer", {
        isError: true,
      });
    } finally {
      setAssigningId(null);
    }
  };

  const handleAddNewCustomer = () => {
    setNavigatingToNew(true);
    onClose();
  };

  const handleAfterHide = useCallback(
    (event) => {
      if (event.target === event.currentTarget) {
        onClose();
        if (navigatingToNew) {
          onAddNewCustomer?.();
        }
      }
    },
    [onClose, navigatingToNew, onAddNewCustomer]
  );

  const statusFor = (customer) => {
    if (!customer.companyId) return null;
    if (customer.companyId === company.id) return "Added to this company";
    return "Added to another company";
  };

  return (
    <s-modal
      id="add-customer-to-company-modal"
      ref={modalRef}
      heading="Add customer to company"
      onAfterHide={handleAfterHide}
    >
      <s-stack gap="base" stretch>
        <s-paragraph>
          Select a customer to give them access to this company.
        </s-paragraph>

        <s-text-field
          label="Search customers"
          labelAccessibilityVisibility="exclusive"
          icon="search"
          placeholder="Search"
          value={search}
          onInput={(e) => setSearch(getInputEventValue(e))}
        />

        <div
          style={{
            maxHeight: "320px",
            overflowY: "auto",
            border: "1px solid #e3e3e3",
            borderRadius: "8px",
          }}
        >
          <button
            type="button"
            onClick={handleAddNewCustomer}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "12px",
              borderBottom: "1px solid #f1f2f4",
              background: "transparent",
              border: "none",
              color: "#303030",
              fontWeight: 500,
              fontSize: "14px",
              cursor: "pointer",
              textAlign: "left",
            }}
          >
            <s-icon type="plus-circle" />
            Add new customer
          </button>

          {loading ? (
            <div style={{ padding: "12px" }}>
              <s-text color="subdued">Searching…</s-text>
            </div>
          ) : customers.length === 0 ? (
            <div style={{ padding: "12px" }}>
              <s-text color="subdued">No customers found</s-text>
            </div>
          ) : (
            customers.map((customer) => {
              const status = statusFor(customer);
              const disabled = Boolean(customer.companyId) || Boolean(assigningId);
              return (
                <button
                  key={customer.id}
                  type="button"
                  onClick={() => !disabled && handleAssign(customer)}
                  disabled={disabled}
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "8px",
                    padding: "12px",
                    borderBottom: "1px solid #f1f2f4",
                    background: "transparent",
                    border: "none",
                    cursor: disabled ? "default" : "pointer",
                    textAlign: "left",
                    opacity: disabled && !assigningId ? 0.7 : 1,
                  }}
                >
                  <span style={{ display: "flex", flexDirection: "column" }}>
                    <span style={{ fontSize: "14px", fontWeight: 500, color: "#303030" }}>
                      {customer.displayName}
                    </span>
                    {customer.email ? (
                      <span style={{ fontSize: "13px", color: "#616161" }}>
                        {customer.email}
                      </span>
                    ) : null}
                  </span>
                  {status ? (
                    <s-text color="subdued" size="small">
                      {assigningId === customer.id ? "Adding…" : status}
                    </s-text>
                  ) : assigningId === customer.id ? (
                    <s-text color="subdued" size="small">Adding…</s-text>
                  ) : null}
                </button>
              );
            })
          )}
        </div>
      </s-stack>

      <s-button slot="secondary-actions" onClick={onClose}>
        Cancel
      </s-button>
    </s-modal>
  );
}
