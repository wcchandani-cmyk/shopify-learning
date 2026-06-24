import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppBridge } from "@shopify/app-bridge-react";
import {
  EMPTY_ADDRESS,
  FALLBACK_LANGUAGE_OPTIONS,
  buildCustomerPayload,
  buildLanguageOptions,
  customerToFormState,
} from "../../utils/customerForm";
import {
  listCustomerTags,
  updateCustomer,
  listCustomerComments,
  addCustomerComment,
  deleteCustomerComment,
} from "../../services/customerService";
import {
  assignCustomerToCompany,
  getCustomerCompany,
  removeCustomerFromCompany,
} from "../../services/companyService";
import { getShopLocales } from "../../services/shopService";
import AddToCompanyModal from "./AddToCompanyModal";
import CustomerAddressesModal from "./CustomerAddressesModal";
import CustomerAddressModal from "./CustomerAddressModal";
import CustomerCompanyCard from "./CustomerCompanyCard";
import CustomerEditModal from "./CustomerEditModal";
import NotesCard from "../shared/NotesCard";
import CustomerStats from "./CustomerStats";
import CustomerSummaryCard from "./CustomerSummaryCard";
import TagsSection from "../shared/TagsSection";
import CustomerTimeline from "../shared/Timeline";
import MetafieldsCard from "../shared/metafields/MetafieldsCard";

const EDIT_MODAL_ID = "customer-edit-modal";
const MANAGE_ADDRESSES_MODAL_ID = "customer-manage-addresses";

export default function CustomerOverview({ customer }) {
  const shopify = useAppBridge();
  const navigate = useNavigate();
  const modalRef = useRef(null);

  const [form, setForm] = useState(() => customerToFormState(customer));
  const [languageOptions, setLanguageOptions] = useState([]);
  const [availableTags, setAvailableTags] = useState([]);
  const [editing, setEditing] = useState(null);
  const [draft, setDraft] = useState(null);
  const [saving, setSaving] = useState(false);
  const [addressFormOpen, setAddressFormOpen] = useState(false);
  const [addressDraft, setAddressDraft] = useState(EMPTY_ADDRESS);
  const [addressFormTitle, setAddressFormTitle] = useState("Add address");
  const [addressSaving, setAddressSaving] = useState(false);
  const [company, setCompany] = useState(null);
  const [companyModalOpen, setCompanyModalOpen] = useState(false);
  const [companyAssigning, setCompanyAssigning] = useState(false);

  const [isEditingTags, setIsEditingTags] = useState(false);
  const [tagInput, setTagInput] = useState("");

  const tagList = useMemo(() => {
    return form.tags
      ? form.tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean)
      : [];
  }, [form.tags]);

  useEffect(() => {
    setForm(customerToFormState(customer));
  }, [customer]);

  useEffect(() => {
    let active = true;
    getShopLocales()
      .then((locales) => {
        if (active) {
          const opts = buildLanguageOptions(locales);
          setLanguageOptions(
            opts.length > 0 ? opts : FALLBACK_LANGUAGE_OPTIONS
          );
        }
      })
      .catch(() => {
        if (active) setLanguageOptions(FALLBACK_LANGUAGE_OPTIONS);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    listCustomerTags()
      .then((tags) => {
        if (active) setAvailableTags(tags);
      })
      .catch(() => {
        if (active) setAvailableTags([]);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    getCustomerCompany(customer.id)
      .then((result) => {
        if (active) setCompany(result);
      })
      .catch(() => {
        if (active) setCompany(null);
      });
    return () => {
      active = false;
    };
  }, [customer.id]);

  const handleManageCompany = useCallback(() => {
    shopify.toast.show("Location permissions aren't available yet.");
  }, [shopify]);

  const handleRemoveCompany = useCallback(async () => {
    try {
      await removeCustomerFromCompany(customer.id);
      setCompany(null);
      shopify.toast.show("Removed from company");
    } catch (err) {
      shopify.toast.show(err.message || "Failed to remove from company", {
        isError: true,
      });
    }
  }, [customer.id, shopify]);

  const handleAssignCompany = useCallback(
    async ({ companyId, companyName }) => {
      setCompanyAssigning(true);
      try {
        const assigned = await assignCustomerToCompany(
          { customerId: customer.id, companyId, companyName }
        );
        setCompany(assigned);
        shopify.toast.show(`Added to ${assigned?.name || "company"}`);
        setCompanyModalOpen(false);
      } catch (err) {
        shopify.toast.show(err.message || "Failed to add to company", {
          isError: true,
        });
      } finally {
        setCompanyAssigning(false);
      }
    },
    [customer.id, shopify]
  );

  const openEdit = useCallback(
    (section) => {
      setDraft(structuredClone(form));
      setEditing(section);
    },
    [form]
  );

  const updateDraft = useCallback((patch) => {
    setDraft((prev) => ({ ...prev, ...patch }));
  }, []);

  const openAddressEdit = useCallback(() => {
    setAddressDraft(form.address);
    setAddressFormTitle("Edit address");
    setAddressFormOpen(true);
  }, [form.address]);

  const openAddressAdd = useCallback(() => {
    setAddressDraft({ ...EMPTY_ADDRESS });
    setAddressFormTitle("Add address");
    setAddressFormOpen(true);
  }, []);

  const handleAddressSave = useCallback(
    async (address) => {
      setAddressSaving(true);
      try {
        const payload = buildCustomerPayload({ ...form, address });
        const updated = await updateCustomer(customer.id, payload);
        setForm(customerToFormState(updated));
        if (updated.warnings?.length) {
          shopify.toast.show(updated.warnings.join(" "), { isError: true });
        } else {
          shopify.toast.show("Address updated");
        }
        setAddressFormOpen(false);
      } catch (err) {
        shopify.toast.show(err.message || "Failed to save address", {
          isError: true,
        });
      } finally {
        setAddressSaving(false);
      }
    },
    [form, customer, shopify]
  );

  const copyEmail = useCallback(async () => {
    if (!form.email) return;
    try {
      await navigator.clipboard.writeText(form.email);
      shopify.toast.show("Email copied");
    } catch {
      shopify.toast.show("Couldn't copy email", { isError: true });
    }
  }, [form.email, shopify]);

  const handleSave = useCallback(async () => {
    if (!draft) return;
    setSaving(true);
    try {
      const payload = buildCustomerPayload(draft);
      const updated = await updateCustomer(customer.id, payload);
      setForm(customerToFormState(updated));
      if (updated.warnings?.length) {
        shopify.toast.show(updated.warnings.join(" "), { isError: true });
      } else {
        shopify.toast.show("Customer updated");
      }
      modalRef.current?.hideOverlay?.();
    } catch (err) {
      shopify.toast.show(err.message || "Failed to save customer", {
        isError: true,
      });
    } finally {
      setSaving(false);
    }
  }, [draft, customer, shopify]);

  const handleUpdateTags = useCallback(async (fieldName, value) => {
    try {
      const payload = buildCustomerPayload({ ...form, tags: value });
      const updated = await updateCustomer(customer.id, payload);
      setForm(customerToFormState(updated));
      shopify.toast.show("Tags updated");
    } catch (err) {
      shopify.toast.show(err.message || "Failed to update tags", {
        isError: true,
      });
    }
  }, [form, customer.id, shopify]);

  const handleAfterHide = useCallback((event) => {
    if (event.target === event.currentTarget) {
      setEditing(null);
      setDraft(null);
    }
  }, []);

  const heading =
    form.displayName ||
    `${form.firstName} ${form.lastName}`.trim() ||
    form.email ||
    "Customer";

  return (
    <s-page heading={heading}>
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

      <s-query-container containerName="product-detail">
        <div className="product-detail-layout">
          <div className="product-detail-layout__main">
            <s-stack gap="base">
              <CustomerStats form={form} />
              <MetafieldsCard entityType="customer" entityId={customer.id} />
              <CustomerTimeline
                entityId={customer.id}
                listComments={listCustomerComments}
                addComment={addCustomerComment}
                deleteComment={deleteCustomerComment}
              />
            </s-stack>
          </div>

          <div className="product-detail-layout__aside">
            <s-stack gap="base">
              <CustomerSummaryCard
                form={form}
                editModalId={EDIT_MODAL_ID}
                manageAddressesModalId={MANAGE_ADDRESSES_MODAL_ID}
                company={company}
                onAddToCompany={() => setCompanyModalOpen(true)}
                onCopyEmail={copyEmail}
                onEdit={openEdit}
              />
              {company ? (
                <CustomerCompanyCard
                  company={company}
                  onRemove={handleRemoveCompany}
                  onManage={handleManageCompany}
                />
              ) : null}
              <TagsSection
                isEditingTags={isEditingTags}
                setIsEditingTags={setIsEditingTags}
                tagInput={tagInput}
                setTagInput={setTagInput}
                tagList={tagList}
                updateField={handleUpdateTags}
              />
              <NotesCard
                note={form.note}
                editModalId={EDIT_MODAL_ID}
                onEdit={() => openEdit("notes")}
              />
            </s-stack>
          </div>
        </div>
      </s-query-container>

      <CustomerEditModal
        editModalId={EDIT_MODAL_ID}
        modalRef={modalRef}
        editing={editing}
        draft={draft}
        saving={saving}
        languageOptions={languageOptions}
        availableTags={availableTags}
        onChangeDraft={updateDraft}
        onSave={handleSave}
        onAfterHide={handleAfterHide}
      />

      <CustomerAddressesModal
        manageModalId={MANAGE_ADDRESSES_MODAL_ID}
        address={form.address}
        recipientName={`${form.firstName} ${form.lastName}`.trim()}
        onEditAddress={openAddressEdit}
        onAddAddress={openAddressAdd}
      />

      <CustomerAddressModal
        open={addressFormOpen}
        address={addressDraft}
        title={addressFormTitle}
        saving={addressSaving}
        onSave={handleAddressSave}
        onClose={() => setAddressFormOpen(false)}
      />

      <AddToCompanyModal
        open={companyModalOpen}
        customerName={heading}
        customerAddress={form.address}
        assigning={companyAssigning}
        onAssign={handleAssignCompany}
        onClose={() => setCompanyModalOpen(false)}
      />
    </s-page>
  );
}
