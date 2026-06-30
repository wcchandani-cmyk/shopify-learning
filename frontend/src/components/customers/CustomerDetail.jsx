import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppBridge } from "@shopify/app-bridge-react";
import {
  TAX_SETTING_OPTIONS,
  FALLBACK_LANGUAGE_OPTIONS,
  buildCustomerPayload,
  buildLanguageOptions,
  customerToFormState,
  customerHasAddress,
  formatAddressSummary,
} from "../../utils/customerForm";
import { createCustomer, updateCustomer } from "../../services/customerService";
import { getShopLocales } from "../../services/shopService";
import { getCheckboxChecked, getInputEventValue } from "../../utils/fieldEvent";
import { exclusiveFieldLabel } from "../../utils/formFields";
import CustomerAddressModal from "./CustomerAddressModal";
import SearchableSelect from "../shared/SearchableSelect";
import PhoneField from "./PhoneField";
import TagsSection from "../shared/TagsSection";
import MetafieldsCard from "../shared/metafields/MetafieldsCard";
import "../../styles/CustomerDetail.css";

export default function CustomerDetail({ customer, isNew = false, onSaved }) {
  const shopify = useAppBridge();
  const navigate = useNavigate();
  const [form, setForm] = useState(() => customerToFormState(customer));
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [addressModalOpen, setAddressModalOpen] = useState(false);
  const [languageOptions, setLanguageOptions] = useState([]);
  const [isEditingTags, setIsEditingTags] = useState(false);
  const [tagInput, setTagInput] = useState("");

  const tagList = useMemo(() => {
    return form.tags
      ? form.tags
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean)
      : [];
  }, [form.tags]);

  useEffect(() => {
    setForm(customerToFormState(customer));
    setSaveError(null);
  }, [customer]);

  useEffect(() => {
    let active = true;
    getShopLocales()
      .then((locales) => {
        if (!active) return;
        const options = buildLanguageOptions(locales);
        setLanguageOptions(
          options.length > 0 ? options : FALLBACK_LANGUAGE_OPTIONS
        );

        const primary = locales.find((item) => item.primary)?.locale;
        setForm((prev) => {
          const known = options.some((opt) => opt.value === prev.locale);
          if (known || !primary) return prev;
          return { ...prev, locale: primary };
        });
      })
      .catch(() => {
        if (active) setLanguageOptions(FALLBACK_LANGUAGE_OPTIONS);
      });
    return () => {
      active = false;
    };
  }, []);

  const updateField = useCallback((field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  }, []);

  const handleAddressSave = useCallback((draft) => {
    setForm((prev) => ({ ...prev, address: { ...draft } }));
    setAddressModalOpen(false);
  }, []);

  const hasAddress = customerHasAddress(form.address);
  const addressSummary = formatAddressSummary(
    form.address,
    `${form.firstName} ${form.lastName}`.trim()
  );

  const handleBack = useCallback(() => {
    navigate("/customers");
  }, [navigate]);

  const handleSave = useCallback(async () => {
    const hasName = form.firstName.trim() || form.lastName.trim();
    if (!hasName && !form.email.trim() && !form.phone.trim()) {
      const message = "Enter a name, email, or phone number";
      setSaveError(message);
      shopify.toast.show(message, { isError: true });
      return;
    }

    setSaving(true);
    setSaveError(null);

    try {
      const payload = buildCustomerPayload(form);
      const data = isNew
        ? await createCustomer(payload)
        : await updateCustomer(customer.id, payload);

      shopify.toast.show(isNew ? "Customer created" : "Customer saved");
      onSaved?.(data);
    } catch (err) {
      const message = err.message || "Failed to save customer";
      setSaveError(message);
      shopify.toast.show(message, { isError: true });
    } finally {
      setSaving(false);
    }
  }, [form, isNew, customer, shopify, onSaved]);

  const pageHeading = isNew
    ? "New customer"
    : form.firstName || form.lastName
    ? `${form.firstName} ${form.lastName}`.trim()
    : "Customer";

  return (
    <s-page heading={pageHeading}>
      <s-link
        slot="breadcrumb-actions"
        href="/customers"
        onClick={(event) => {
          event.preventDefault();
          handleBack();
        }}
      >
        Customers
      </s-link>
      <s-button
        slot="primary-action"
        variant="primary"
        onClick={handleSave}
        {...(saving ? { loading: true } : {})}
      >
        Save
      </s-button>

      {saveError ? <s-banner tone="critical">{saveError}</s-banner> : null}

      <s-query-container containerName="product-detail">
        <div className="product-detail-layout">
          <div className="product-detail-layout__main">
            <s-stack gap="base">
              <s-section heading="Customer overview">
                <s-stack gap="base">
                  <s-grid gap="base" gridTemplateColumns="1fr 1fr">
                    <s-text-field
                      label="First name"
                      value={form.firstName}
                      onInput={(event) =>
                        updateField("firstName", getInputEventValue(event))
                      }
                    />
                    <s-text-field
                      label="Last name"
                      value={form.lastName}
                      onInput={(event) =>
                        updateField("lastName", getInputEventValue(event))
                      }
                    />
                  </s-grid>

                  <SearchableSelect
                    label="Language"
                    details="This customer will receive notifications in this language."
                    value={form.locale}
                    onChange={(val) => updateField("locale", val)}
                    options={languageOptions}
                    placeholder="Search language…"
                  />

                  <s-text-field
                    label="Email"
                    type="email"
                    value={form.email}
                    onInput={(event) =>
                      updateField("email", getInputEventValue(event))
                    }
                  />

                  <PhoneField
                    label="Phone number"
                    value={form.phone}
                    onChange={(phone) => updateField("phone", phone)}
                  />

                  <s-stack gap="small-50">
                    <s-checkbox
                      label="Customer agreed to receive marketing emails."
                      checked={form.emailSubscribed}
                      onChange={(event) =>
                        updateField(
                          "emailSubscribed",
                          getCheckboxChecked(event)
                        )
                      }
                    />

                    <s-checkbox
                      label="Customer agreed to receive SMS marketing text messages."
                      checked={form.smsSubscribed}
                      onChange={(event) =>
                        updateField("smsSubscribed", getCheckboxChecked(event))
                      }
                    />
                  </s-stack>

                  <s-box padding="base" background="subdued" borderRadius="base">
                    <s-text tone="subdued" size="small">
                      You should ask your customers for permission before you
                      subscribe them to your marketing emails or SMS.
                    </s-text>
                  </s-box>
                </s-stack>
              </s-section>

              <s-section heading="Default address">
                <s-stack gap="base">
                  <s-text color="subdued">
                    The primary address of this customer
                  </s-text>
                  <s-clickable
                    className="address-add-card"
                    onClick={() => setAddressModalOpen(true)}
                  >
                    <span className="address-add-card__left">
                      <span className="address-add-card__icon">+</span>
                      <span className="address-add-card__text">
                        {hasAddress ? addressSummary : "Add address"}
                      </span>
                    </span>
                    <span className="address-add-card__chevron">›</span>
                  </s-clickable>
                </s-stack>
              </s-section>

              <s-section heading="Tax details">
                <s-select
                  label="Tax settings"
                  value={form.taxSetting}
                  onChange={(event) =>
                    updateField("taxSetting", getInputEventValue(event))
                  }
                >
                  {TAX_SETTING_OPTIONS.map((option) => (
                    <s-option key={option.value} value={option.value}>
                      {option.label}
                    </s-option>
                  ))}
                </s-select>
              </s-section>

              <MetafieldsCard
                entityType="customer"
                entityId={isNew ? "new" : customer.id}
              />
            </s-stack>
          </div>

          <div className="product-detail-layout__aside">
            <s-stack gap="base">
              <s-section heading="Notes">
                <s-stack gap="small-200">
                  <s-text color="subdued">
                    Notes are private and won't be shared with the customer.
                  </s-text>
                  <s-text-area
                    label="Notes"
                    {...exclusiveFieldLabel}
                    value={form.note}
                    onInput={(event) =>
                      updateField("note", getInputEventValue(event))
                    }
                  />
                </s-stack>
              </s-section>

              <TagsSection
                isEditingTags={isEditingTags}
                setIsEditingTags={setIsEditingTags}
                tagInput={tagInput}
                setTagInput={setTagInput}
                tagList={tagList}
                updateField={updateField}
              />
            </s-stack>
          </div>
        </div>
      </s-query-container>

      <CustomerAddressModal
        open={addressModalOpen}
        address={form.address}
        onSave={handleAddressSave}
        onClose={() => setAddressModalOpen(false)}
      />
    </s-page>
  );
}
