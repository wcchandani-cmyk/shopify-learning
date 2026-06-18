import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAppBridge } from "@shopify/app-bridge-react";
import { getCompanyDetails, bulkDeleteCompanies } from "../../services/companyService";
import PageLoader from "../PageLoader";
import EditCompanyDetailsModal from "./EditCompanyDetailsModal";
import AddCustomerToCompanyModal from "./AddCustomerToCompanyModal";
import ChangeMainContactModal from "./ChangeMainContactModal";
import RemoveCustomerModal from "./RemoveCustomerModal";
import EditAssignedStaffModal from "./EditAssignedStaffModal";
import ManagePermissionsModal from "../customers/ManagePermissionsModal";
import MetafieldsCard from "../shared/metafields/MetafieldsCard";
import { useMetafieldsPrefetch } from "../../hooks/useMetafieldsPrefetch";
import "../../styles/CompanyDetail.css";

const getCustomerDuration = (createdAt) => {
  if (!createdAt) return "Customer";
  const createdDate = new Date(createdAt);
  const diffMs = Date.now() - createdDate.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  if (diffMinutes < 60) {
    return `Customer for ${diffMinutes} ${diffMinutes === 1 ? "minute" : "minutes"}`;
  }
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) {
    return `Customer for ${diffHours} ${diffHours === 1 ? "hour" : "hours"}`;
  }
  const diffDays = Math.floor(diffHours / 24);
  return `Customer for ${diffDays} ${diffDays === 1 ? "day" : "days"}`;
};

export default function CompanyDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const shopify = useAppBridge();
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [token, setToken] = useState(null);

  // Prefetch metafields once the company is loaded so the card renders with the
  // page instead of a moment later.
  const { loading: metafieldsLoading } = useMetafieldsPrefetch(
    "company",
    company?.id
  );

  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  const [headerMenuOpen, setHeaderMenuOpen] = useState(false);
  const headerMenuRef = useRef(null);
  const [deleting, setDeleting] = useState(false);

  // Which company action modal is open ("edit" | "add" | "main" | "remove" | "staff").
  const [activeModal, setActiveModal] = useState(null);
  // The contact whose permissions are being managed (own modal, mounted on demand).
  const [permissionsContact, setPermissionsContact] = useState(null);

  // Close the card actions dropdown when clicking outside of it.
  useEffect(() => {
    if (!menuOpen) return undefined;
    const handleClickOutside = (event) => {
      if (event.target.closest?.("[data-card-actions-trigger]")) return;
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

  // Close the header actions dropdown when clicking outside of it.
  useEffect(() => {
    if (!headerMenuOpen) return undefined;
    const handleClickOutside = (event) => {
      if (event.target.closest?.("[data-header-actions-trigger]")) return;
      if (headerMenuRef.current && !headerMenuRef.current.contains(event.target)) {
        setHeaderMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [headerMenuOpen]);

  const loadDetails = useCallback(() => {
    if (!token || !id) return;
    setLoading(true);
    setError(null);
    getCompanyDetails(id, token)
      .then((data) => {
        setCompany(data);
      })
      .catch((err) => {
        console.error("Error loading company details:", err);
        setError(err.message || "Failed to load company details");
      })
      .finally(() => setLoading(false));
  }, [id, token]);

  useEffect(() => {
    shopify.idToken().then((t) => {
      setToken(t);
    });
  }, [shopify]);

  useEffect(() => {
    loadDetails();
  }, [loadDetails]);

  const {
    isApproved,
    firstContact,
    adminCompanyUrl,
    addCatalogUrl,
    totalOrders,
    mainContact,
  } = useMemo(() => {
    if (!company) {
      return {
        isApproved: false,
        firstContact: null,
        adminCompanyUrl: "",
        firstLocationId: "",
        addCatalogUrl: "",
        totalOrders: 0,
        mainContact: null,
      };
    }
    const isApprovedVal = company.ordering === "Approved";
    const firstContactVal = company.contacts?.[0] || null;
    const companyNumericId = company.id.split("/").pop() || "";
    const adminCompanyUrlVal = `shopify://admin/companies/${companyNumericId}`;
    const firstLocationIdVal = company.locations?.[0]?.id?.split("/").pop() || "";
    const addCatalogUrlVal = `shopify://admin/catalogs/new?companyLocationId=${firstLocationIdVal}`;
    const totalOrdersVal = (company.locations || []).reduce(
      (sum, loc) => sum + (loc.orders || 0),
      0
    );
    const mainContactVal =
      company.contacts?.find((c) => c.id === company.mainContactId) || firstContactVal;

    return {
      isApproved: isApprovedVal,
      firstContact: firstContactVal,
      adminCompanyUrl: adminCompanyUrlVal,
      firstLocationId: firstLocationIdVal,
      addCatalogUrl: addCatalogUrlVal,
      totalOrders: totalOrdersVal,
      mainContact: mainContactVal,
    };
  }, [company]);

  const openModal = useCallback((modal) => {
    setActiveModal(modal);
    setMenuOpen(false);
  }, []);

  const closeModal = useCallback(() => {
    setActiveModal(null);
  }, []);

  const openPermissions = useCallback((contact) => {
    setMenuOpen(false);
    if (!contact) {
      shopify.toast.show("Add a customer to this company first", { isError: true });
      return;
    }
    setPermissionsContact(contact);
  }, [shopify]);

  const closePermissions = useCallback(() => {
    setPermissionsContact(null);
  }, []);

  const handleDeleteCompany = useCallback(async () => {
    if (deleting || !company) return;

    const confirmed = window.confirm(`Are you sure you want to delete ${company.name}?`);
    if (!confirmed) return;

    setDeleting(true);
    setHeaderMenuOpen(false);
    try {
      const token = await shopify.idToken();
      await bulkDeleteCompanies([company.id], token);
      shopify.toast.show("Company deleted");
      navigate("/companies");
    } catch (err) {
      shopify.toast.show(err.message || "Could not delete company", {
        isError: true,
      });
    } finally {
      setDeleting(false);
    }
  }, [company, deleting, navigate, shopify]);

  const companyActions = useMemo(() => [
    { label: "Edit company details", onClick: () => openModal("edit") },
    { label: "Manage permissions", onClick: () => openPermissions(mainContact) },
    { label: "Add customer", onClick: () => openModal("add") },
    { label: "Change main contact", onClick: () => openModal("main") },
    { label: "Remove customer", onClick: () => openModal("remove") },
    { label: "Edit assigned staff", onClick: () => openModal("staff") },
  ], [mainContact, openModal, openPermissions]);

  if (error && !company) {
    return (
      <s-page heading="Company details">
        <s-section>
          <s-banner tone="critical" heading="Could not load company details">
            {error}
          </s-banner>
        </s-section>
      </s-page>
    );
  }

  if ((loading && !company) || (company && metafieldsLoading)) {
    return (
      <s-page heading="Loading...">
        <s-section>
          <PageLoader accessibilityLabel="Loading company details" />
        </s-section>
      </s-page>
    );
  }

  if (!company) {
    return (
      <s-page heading="Company details">
        <s-section>
          <s-banner tone="warning" heading="Company unavailable">
            This company could not be loaded.
          </s-banner>
        </s-section>
      </s-page>
    );
  }

  const companyActionsMenu = menuOpen ? (
    <div className="company-actions__menu" role="menu">
      {companyActions.map((action) => (
        <button
          key={action.label}
          type="button"
          role="menuitem"
          className="company-actions__item"
          onClick={action.onClick}
        >
          {action.label}
        </button>
      ))}
    </div>
  ) : null;

  return (
    <s-page heading={company.name}>
      <s-text color="subdued" slot="subtitle">
        {getCustomerDuration(company.createdAt)}
      </s-text>

      <s-link
        slot="breadcrumb-actions"
        href="/companies"
        onClick={(event) => {
          event.preventDefault();
          navigate("/companies");
        }}
      >
        Companies
      </s-link>

      <div slot="secondary-action" className="company-actions" ref={headerMenuRef}>
        <s-button
          data-header-actions-trigger
          onClick={() => setHeaderMenuOpen((open) => !open)}
          {...(deleting ? { loading: true } : {})}
        >
          More actions
        </s-button>
        {headerMenuOpen && (
          <div className="company-actions__menu" role="menu">
            <button
              type="button"
              role="menuitem"
              className="company-actions__item"
              style={{ color: "#d82c0d" }}
              onClick={handleDeleteCompany}
            >
              Delete company
            </button>
          </div>
        )}
      </div>

      <s-query-container containerName="product-detail">
        <div className="product-detail-layout">
          
          <div className="product-detail-layout__main">
            <s-stack gap="base">
              
              {!isApproved && !firstContact && (
                <s-section>
                  <s-stack gap="base">
                    <s-heading>No orders yet</s-heading>
                    <s-paragraph color="subdued">
                      Add a customer to place orders for this company.
                    </s-paragraph>
                    <s-stack direction="inline" justifyContent="end">
                      <s-button variant="primary" onClick={() => openModal("add")}>
                        Add customer
                      </s-button>
                    </s-stack>
                  </s-stack>
                </s-section>
              )}

              {!isApproved && firstContact && (
                <s-banner tone="info" heading="Ordering is not approved">
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px", alignItems: "flex-start", marginTop: "4px" }}>
                    <s-paragraph>
                      Give a customer permission for a location to allow ordering.
                    </s-paragraph>
                    <s-button
                      variant="primary"
                      onClick={() => openPermissions(mainContact)}
                    >
                      Manage permissions
                    </s-button>
                  </div>
                </s-banner>
              )}

              {isApproved && (
                <s-section>
                  {totalOrders === 0 ? (
                    <s-stack gap="base">
                      <s-heading>No orders yet</s-heading>
                      <s-paragraph color="subdued">
                        This company doesn't have orders.
                      </s-paragraph>
                      <s-stack direction="inline" justifyContent="end">
                        <s-button
                          variant="primary"
                          href="shopify://admin/draft_orders/new"
                          target="_top"
                        >
                          Create order
                        </s-button>
                      </s-stack>
                    </s-stack>
                  ) : (
                    <s-stack gap="base">
                      <s-heading>Orders</s-heading>
                      <s-paragraph color="subdued">
                        {totalOrders} {totalOrders === 1 ? "order" : "orders"}
                      </s-paragraph>
                      <s-stack direction="inline" justifyContent="end">
                        <s-button href={adminCompanyUrl} target="_top">
                          View orders
                        </s-button>
                      </s-stack>
                    </s-stack>
                  )}
                </s-section>
              )}

              <s-section>
                <s-stack gap="base">
                  <s-stack
                    direction="inline"
                    gap="base"
                    alignItems="center"
                    justifyContent="space-between"
                  >
                    <s-heading>Locations</s-heading>
                    <s-button
                      variant="secondary"
                      onClick={() => shopify.toast.show("Locations must be managed directly in Shopify Admin")}
                    >
                      + Add location
                    </s-button>
                  </s-stack>

                  <s-table>
                    <s-table-header-row>
                      <s-table-header listSlot="primary">Location</s-table-header>
                      <s-table-header>Markets</s-table-header>
                      <s-table-header>Catalogs</s-table-header>
                      <s-table-header>Sales</s-table-header>
                      <s-table-header listSlot="secondary">Orders</s-table-header>
                    </s-table-header-row>

                    <s-table-body>
                      {company.locations?.length === 0 ? (
                        <s-table-row>
                          <s-table-cell colSpan="5">
                            <s-text color="subdued">No locations found</s-text>
                          </s-table-cell>
                        </s-table-row>
                      ) : (
                        company.locations?.map((loc) => (
                          <s-table-row key={loc.id}>
                            <s-table-cell>
                              <s-stack gap="extra-tight">
                                <span style={{ fontWeight: 600 }}>{loc.name}</span>
                                <s-text color="subdued" size="small">
                                  {loc.paymentTerms !== "None" ? `${loc.paymentTerms} • ` : ""}
                                  {loc.checkoutOption}
                                </s-text>
                              </s-stack>
                            </s-table-cell>
                            <s-table-cell>{loc.marketsCount}</s-table-cell>
                            <s-table-cell>{loc.catalogs?.length || 0}</s-table-cell>
                            <s-table-cell>$0.00</s-table-cell>
                            <s-table-cell>{loc.orders}</s-table-cell>
                          </s-table-row>
                        ))
                      )}
                    </s-table-body>
                  </s-table>
                </s-stack>
              </s-section>

              <MetafieldsCard entityType="company" entityId={company.id} />
            </s-stack>
          </div>

          <div className="product-detail-layout__aside">
            <s-stack gap="base">
              
              <s-section>
                <s-stack gap="base">
                  <s-stack
                    direction="inline"
                    gap="base"
                    alignItems="center"
                    justifyContent="space-between"
                  >
                    <s-heading>{company.name}</s-heading>
                    <div className="company-actions" ref={menuRef}>
                      <s-button
                        variant="tertiary"
                        icon="menu-horizontal"
                        accessibilityLabel="Company actions"
                        data-card-actions-trigger
                        onClick={() => setMenuOpen((open) => !open)}
                      />
                      {companyActionsMenu}
                    </div>
                  </s-stack>
                  
                  <div>
                    <s-badge tone={isApproved ? "success" : "warning"}>
                      {company.ordering}
                    </s-badge>
                  </div>

                  <s-stack gap="small-300">
                    <s-text fontWeight="bold">Customers</s-text>
                    {company.contacts?.length === 0 ? (
                      <s-button
                        variant="tertiary"
                        icon="plus-circle"
                        onClick={() => openModal("add")}
                      >
                        Add a customer
                      </s-button>
                    ) : (
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "4px" }}>
                        {company.contacts?.map((contact) => (
                          <a
                            key={contact.id}
                            href={`shopify://admin/customers/${contact.customer?.id?.split("/").pop()}`}
                            target="_top"
                            style={{
                              display: "inline-block",
                              background: "#f1f2f4",
                              color: "#303030",
                              padding: "4px 10px",
                              borderRadius: "16px",
                              fontSize: "13px",
                              fontWeight: 500,
                              textDecoration: "none",
                              border: "1px solid #c9cccf",
                              cursor: "pointer"
                            }}
                            onMouseEnter={(e) => e.target.style.background = "#e3e3e3"}
                            onMouseLeave={(e) => e.target.style.background = "#f1f2f4"}
                          >
                            {contact.customer?.displayName || contact.customer?.email}
                          </a>
                        ))}
                      </div>
                    )}
                  </s-stack>

                  <s-stack gap="small-300">
                    <s-text fontWeight="bold">Assigned staff</s-text>
                    {company.assignedStaff?.length > 0 ? (
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "4px" }}>
                        {company.assignedStaff.map((member) => (
                          <span
                            key={member.staffMemberId}
                            style={{
                              display: "inline-block",
                              background: "#f1f2f4",
                              color: "#303030",
                              padding: "4px 10px",
                              borderRadius: "16px",
                              fontSize: "13px",
                              fontWeight: 500,
                              border: "1px solid #c9cccf",
                            }}
                          >
                            {member.name}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <s-button
                        variant="tertiary"
                        icon="plus-circle"
                        onClick={() => openModal("staff")}
                      >
                        Assign staff
                      </s-button>
                    )}
                  </s-stack>
                </s-stack>
              </s-section>

              <s-section>
                <s-stack gap="base">
                  <s-heading>Customizations</s-heading>

                  <div className="company-customizations">
                    <div className="cust-field">
                      <span className="cust-field__label">Markets</span>
                      <a
                        className="cust-chip"
                        href="shopify://admin/settings/markets"
                        target="_top"
                      >
                        {company.locations?.[0]?.marketName || "United States"}
                      </a>
                    </div>

                    <div className="cust-field">
                      <span className="cust-field__label">Catalogs</span>
                      {company.locations?.[0]?.catalogs?.[0]?.title ? (
                        <a
                          className="cust-chip"
                          href={addCatalogUrl}
                          target="_top"
                        >
                          {company.locations?.[0]?.catalogs?.[0]?.title}
                        </a>
                      ) : (
                        <a
                          className="cust-add-link"
                          href={addCatalogUrl}
                          target="_top"
                        >
                          <span className="cust-add-link__icon">+</span>
                          Add a catalog
                        </a>
                      )}
                    </div>

                    <div className="cust-field cust-field--row">
                      <div className="cust-field__main">
                        <span className="cust-field__label">Payment terms</span>
                        <span className="cust-value">
                          {company.locations?.[0]?.paymentTerms || "None"}
                        </span>
                      </div>
                      <s-button
                        variant="tertiary"
                        icon="edit"
                        accessibilityLabel="Edit payment terms"
                        href={adminCompanyUrl}
                        target="_top"
                      />
                    </div>

                    <div className="cust-field cust-field--row">
                      <div className="cust-field__main">
                        <span className="cust-field__label">Checkout</span>
                        <div className="cust-checkout-list">
                          <span>• {company.locations?.[0]?.editableShipping || "Ship to location address"}</span>
                          <span>• {company.locations?.[0]?.checkoutOption || "Automatically submit orders"}</span>
                        </div>
                      </div>
                      <s-button
                        variant="tertiary"
                        icon="edit"
                        accessibilityLabel="Edit checkout"
                        href={adminCompanyUrl}
                        target="_top"
                      />
                    </div>
                  </div>
                </s-stack>
              </s-section>

              <s-section>
                <s-stack gap="small-200">
                  <s-stack
                    direction="inline"
                    gap="base"
                    alignItems="center"
                    justifyContent="space-between"
                  >
                    <s-heading>Notes</s-heading>
                    <s-button
                      variant="tertiary"
                      icon="edit"
                      accessibilityLabel="Edit notes"
                      href={adminCompanyUrl}
                      target="_top"
                    />
                  </s-stack>
                  <s-paragraph color="subdued">
                    No notes
                  </s-paragraph>
                </s-stack>
              </s-section>

            </s-stack>
          </div>

        </div>
      </s-query-container>

      <EditCompanyDetailsModal
        open={activeModal === "edit"}
        shopify={shopify}
        company={company}
        token={token}
        onClose={closeModal}
        onSaved={loadDetails}
      />

      <AddCustomerToCompanyModal
        open={activeModal === "add"}
        shopify={shopify}
        company={company}
        token={token}
        onClose={closeModal}
        onSaved={loadDetails}
        onAddNewCustomer={() => navigate("/customers/new")}
      />

      <ChangeMainContactModal
        open={activeModal === "main"}
        shopify={shopify}
        company={company}
        token={token}
        onClose={closeModal}
        onSaved={loadDetails}
      />

      <RemoveCustomerModal
        open={activeModal === "remove"}
        shopify={shopify}
        company={company}
        token={token}
        onClose={closeModal}
        onSaved={loadDetails}
      />

      <EditAssignedStaffModal
        open={activeModal === "staff"}
        shopify={shopify}
        company={company}
        token={token}
        onClose={closeModal}
        onSaved={loadDetails}
      />

      <ManagePermissionsModal
        open={Boolean(permissionsContact)}
        shopify={shopify}
        company={company}
        contact={permissionsContact}
        token={token}
        onClose={closePermissions}
        onSaved={loadDetails}
      />
    </s-page>
  );
}
