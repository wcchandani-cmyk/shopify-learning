import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAppBridge } from "@shopify/app-bridge-react";
import { createOrder, getPaymentTermsTemplates } from "../../services/orderService";
import { listCustomers, getCustomer } from "../../services/customerService";
import { getShopCurrencies, getShopDetails } from "../../services/shopService";
import { formatMoney, formatAddressSummary } from "../../utils/customerForm";
import { getInputEventValue } from "../../utils/fieldEvent";
import { currencyLabel } from "../../utils/orderDisplay";
import TagsSection from "../shared/TagsSection";

import NotesCard from "../shared/NotesCard";
import OrderPaymentSection from "./OrderPaymentSection";
import OrderItemThumbnail from "./OrderItemThumbnail";
import AddCustomItemModal from "./AddCustomItemModal";
import AddProductModal from "./AddProductModal";
import DiscountModal from "./DiscountModal";
import ShippingModal from "./ShippingModal";
import SendInvoiceModal from "./SendInvoiceModal";
import MarkAsPaidModal from "./MarkAsPaidModal";
import OrderCustomerCard from "./OrderCustomerCard";


const MARKETS_ADMIN_URL = "shopify://admin/markets";

export default function CreateOrderForm() {
  const navigate = useNavigate();
  const location = useLocation();
  const shopify = useAppBridge();
  const isDraftMode = location.pathname.startsWith("/drafts");

  const editNoteModalRef = useRef(null);

  const [lineItems, setLineItems] = useState([]);
  const [note, setNote] = useState("");
  const [noteInput, setNoteInput] = useState("");
  const [tags, setTags] = useState("");
  const [isEditingTags, setIsEditingTags] = useState(false);
  const [tagInput, setTagInput] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [currencyInfo, setCurrencyInfo] = useState({
    primary: "USD",
    enabled: ["USD"],
  });

  const [discount, setDiscount] = useState(null);
  const [shipping, setShipping] = useState(null);


  const [customerOptions, setCustomerOptions] = useState([]);
  const [selectedCustomerShopifyId, setSelectedCustomerShopifyId] =
    useState(() => {
      const query = new URLSearchParams(window.location.search);
      return query.get("customerShopifyId") || "";
    });
  const [loadingCustomers, setLoadingCustomers] = useState(false);

  const [customItemModalOpen, setCustomItemModalOpen] = useState(false);
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [discountModalOpen, setDiscountModalOpen] = useState(false);
  const [shippingModalOpen, setShippingModalOpen] = useState(false);
  const [sendInvoiceModalOpen, setSendInvoiceModalOpen] = useState(false);
  const [markAsPaidModalOpen, setMarkAsPaidModalOpen] = useState(false);
  const [shopFromLabel, setShopFromLabel] = useState("");
  const [saving, setSaving] = useState(false);

  const [paymentDueLater, setPaymentDueLater] = useState(false);
  const [paymentTermsTemplates, setPaymentTermsTemplates] = useState([]);
  const [paymentTermsTemplateId, setPaymentTermsTemplateId] = useState("");

  useEffect(() => {
    setLoadingCustomers(true);
    listCustomers({ page: 1, limit: 100 })
      .then((data) => {
        const options = (data?.customers ?? []).map((c) => ({
          value: String(c.shopifyId),
          label: c.name,
          email: c.email || "",
          id: c.id,
        }));
        setCustomerOptions(options);
      })
      .catch((err) => {
        console.error("Failed to load customers for order selection:", err);
      })
      .finally(() => setLoadingCustomers(false));
  }, []);



  useEffect(() => {
    getShopCurrencies()
      .then((data) => {
        const info = {
          primary: data?.primary || "USD",
          enabled: data?.enabled?.length
            ? data.enabled
            : [data?.primary || "USD"],
        };
        setCurrencyInfo(info);
        setCurrency(info.primary);
      })
      .catch((err) => {
        console.error("Failed to load shop currencies:", err);
      });
  }, []);


  useEffect(() => {
    getPaymentTermsTemplates()
      .then((terms) => {
        setPaymentTermsTemplates(terms);
        const due =
          terms.find((t) => t.type === "RECEIPT") || terms[0];
        if (due) setPaymentTermsTemplateId(due.id);
      })
      .catch((err) => {
        console.error("Failed to load payment terms:", err);
      });
  }, []);

  useEffect(() => {
    getShopDetails()
      .then((shop) => {
        if (!shop?.email) return;
        setShopFromLabel(
          shop.name ? `"${shop.name}" <${shop.email}>` : shop.email
        );
      })
      .catch((err) => {
        console.error("Failed to load shop details:", err);
      });
  }, []);


  const [selectedCustomerDetail, setSelectedCustomerDetail] = useState(null);

  const [loadingCustomerDetail, setLoadingCustomerDetail] = useState(false);

  useEffect(() => {
    if (!selectedCustomerShopifyId) {
      setSelectedCustomerDetail(null);
      return;
    }
    const option = customerOptions.find(
      (opt) => opt.value === selectedCustomerShopifyId
    );
    if (!option?.id) return;

    setLoadingCustomerDetail(true);
    getCustomer(option.id)
      .then((data) => {
        setSelectedCustomerDetail(data);
      })
      .catch((err) => {
        console.error("Failed to load customer details:", err);
      })
      .finally(() => setLoadingCustomerDetail(false));
  }, [selectedCustomerShopifyId, customerOptions]);


  const shippingStr = useMemo(() => {
    if (!selectedCustomerDetail?.address) return "";
    const addr = {
      ...selectedCustomerDetail.address,
      provinceCode: selectedCustomerDetail.address.provinceCode || selectedCustomerDetail.address.province,
      countryCode: selectedCustomerDetail.address.countryCode || selectedCustomerDetail.address.country,
    };
    return formatAddressSummary(
      addr,
      selectedCustomerDetail.displayName || ""
    );
  }, [selectedCustomerDetail]);

  const billingStr = shippingStr;


  const handleAddCustomItem = useCallback((item) => {
    setLineItems((prev) => [...prev, item]);
  }, []);

  const handleAddProducts = useCallback((items) => {
    setLineItems((prev) => [...prev, ...items]);
  }, []);

  const handleRemoveItem = useCallback((index) => {
    setLineItems((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleUpdateQty = useCallback((index, qty) => {
    setLineItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, quantity: qty } : item))
    );
  }, []);

  const itemCount = useMemo(
    () => lineItems.reduce((sum, item) => sum + item.quantity, 0),
    [lineItems]
  );

  const subtotal = useMemo(
    () => lineItems.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [lineItems]
  );

  const discountAmount = useMemo(() => {
    if (!discount) return 0;
    if (discount.type === "percentage") {
      return (subtotal * (Number(discount.value) || 0)) / 100;
    }
    return Number(discount.value) || 0;
  }, [discount, subtotal]);

  const shippingAmount = useMemo(
    () => (shipping ? Number(shipping.amount) || 0 : 0),
    [shipping]
  );

  const total = useMemo(
    () => Math.max(0, subtotal - discountAmount + shippingAmount),
    [subtotal, discountAmount, shippingAmount]
  );

  const handleCreate = useCallback(
    async (financialStatus, paymentMethod = null) => {
      if (!lineItems.length || saving) return;
      setSaving(true);
      try {
        const selectedTerm = paymentTermsTemplates.find(
          (t) => t.id === paymentTermsTemplateId
        );
        const useDueLater =
          financialStatus === "pending" && paymentDueLater && !!selectedTerm;

        const payload = {
          lineItems,
          note,
          tags: isDraftMode && !tags.split(",").map((t) => t.trim()).includes("Draft")
            ? (tags ? `${tags}, Draft` : "Draft")
            : tags,
          currency,
          customerShopifyId: selectedCustomerShopifyId || null,
          financialStatus,
          paymentMethod,
          subtotalPrice: subtotal,
          totalPrice: total,
          paymentDueLater: useDueLater,
          paymentTerms: useDueLater
            ? { templateId: selectedTerm.id, type: selectedTerm.type }
            : null,

          discount: discount
            ? {
                type: discount.type,
                value: discount.value,
                amount: Number(discountAmount.toFixed(2)),
                reason: discount.reason || "",
              }
            : null,
          shipping:
            shippingAmount > 0
              ? { title: shipping.title, amount: shippingAmount }
              : null,
        };

        await createOrder(payload);

        shopify.toast.show("Order created successfully");
        if (isDraftMode || financialStatus === "pending") {
          navigate("/drafts");
        } else {
          navigate("/orders");
        }
      } catch (err) {
        shopify.toast.show(err.message || "Failed to create order", {
          isError: true,
        });
      } finally {
        setSaving(false);
      }
    },
    [
      lineItems,
      note,
      tags,
      currency,
      selectedCustomerShopifyId,
      subtotal,
      total,
      paymentDueLater,
      paymentTermsTemplates,
      paymentTermsTemplateId,

      discount,
      discountAmount,
      shipping,
      shippingAmount,
      saving,
      shopify,
      navigate,
      isDraftMode,
    ]
  );

  const tagList = useMemo(
    () =>
      tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
    [tags]
  );

  const handleUpdateTags = useCallback((_, value) => setTags(value), []);

  const otherCurrencies = useMemo(
    () => currencyInfo.enabled.filter((code) => code !== currencyInfo.primary),
    [currencyInfo]
  );

  const selectedCustomerEmail = useMemo(
    () =>
      customerOptions.find(
        (opt) => opt.value === selectedCustomerShopifyId
      )?.email || "",
    [customerOptions, selectedCustomerShopifyId]
  );

  const handleReviewInvoice = useCallback(() => {
    setSendInvoiceModalOpen(false);
    handleCreate("pending");
  }, [handleCreate]);

  const hasItems = lineItems.length > 0;

  return (
    <s-page
      heading="Create order"
      backAction={{
        content: isDraftMode ? "Drafts" : "Orders",
        onClick: () => navigate(isDraftMode ? "/drafts" : "/orders"),
      }}
    >
      <s-button
        slot="primary-action"
        variant="primary"
        onClick={() => handleCreate("pending")}
        disabled={!hasItems || saving}
        {...(saving ? { loading: true } : {})}
      >
        Save
      </s-button>
      <s-query-container containerName="product-detail">
        <div className="product-detail-layout">
          <div className="product-detail-layout__main">
            <s-stack gap="base">
              <s-section heading="Products">
                <div className="order-form-actions-bar">
                  <s-button
                    variant="secondary"
                    icon="plus"
                    onClick={() => setProductModalOpen(true)}
                  >
                    Add product
                  </s-button>
                  <s-button
                    variant="secondary"
                    icon="plus"
                    onClick={() => setCustomItemModalOpen(true)}
                  >
                    Add custom item
                  </s-button>
                </div>

                {hasItems ? (
                  <div className="order-form-items-list">
                    {lineItems.map((item, index) => (
                      <div key={index} className="order-form-item-row">
                        <div className="order-line-item-info">
                          <OrderItemThumbnail
                            imageUrl={item.imageUrl}
                            imageAlt={item.imageAlt}
                            title={item.title}
                          />
                          <div>
                            <div className="order-line-item-title">
                              {item.title}
                            </div>
                            {item.isCustom ? (
                              <div className="order-line-item-meta">
                                Custom item
                              </div>
                            ) : null}
                          </div>
                        </div>
                        <div className="order-form-item-controls">
                          <span className="order-line-item-price-link">
                            {formatMoney(item.price, currency)}
                          </span>
                          <s-text-field
                            label="Quantity"
                            labelAccessibilityVisibility="exclusive"
                            type="number"
                            value={String(item.quantity)}
                            onInput={(e) =>
                              handleUpdateQty(
                                index,
                                Math.max(
                                  1,
                                  parseInt(getInputEventValue(e), 10) || 1
                                )
                              )
                            }
                            className="order-form-qty-input"
                          />
                          <div className="order-form-item-total">
                            {formatMoney(item.price * item.quantity, currency)}
                          </div>
                          <s-button
                            variant="tertiary"
                            icon="x"
                            accessibilityLabel="Remove item"
                            onClick={() => handleRemoveItem(index)}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : null}
              </s-section>

              <OrderPaymentSection
                currency={currency}
                hasItems={hasItems}
                itemCount={itemCount}
                subtotal={subtotal}
                discount={discount}
                discountAmount={discountAmount}
                shipping={shipping}
                shippingAmount={shippingAmount}
                total={total}
                saving={saving}
                paymentDueLater={paymentDueLater}
                onTogglePaymentDueLater={setPaymentDueLater}
                paymentTermsTemplates={paymentTermsTemplates}
                paymentTermsTemplateId={paymentTermsTemplateId}
                onChangePaymentTerm={setPaymentTermsTemplateId}
                onAddDiscount={() => setDiscountModalOpen(true)}
                onAddShipping={() => setShippingModalOpen(true)}
                onCreate={handleCreate}
                onMarkAsPaid={() => setMarkAsPaidModalOpen(true)}
                onSendInvoice={() => setSendInvoiceModalOpen(true)}
              />
            </s-stack>
          </div>

          <div className="product-detail-layout__aside">
            <s-stack gap="base">
              <NotesCard
                note={note}
                placeholder="No notes"
                onEdit={() => {
                  setNoteInput(note || "");
                  editNoteModalRef.current?.showOverlay?.();
                }}
              />

              <OrderCustomerCard
                customer={selectedCustomerDetail}
                customerOptions={customerOptions}
                loadingCustomers={loadingCustomers || loadingCustomerDetail}
                shippingStr={shippingStr}
                billingStr={billingStr}
                onUpdateCustomer={setSelectedCustomerShopifyId}
                onCreateNewCustomer={() => navigate("/customers/new")}
              />


              <s-section>
                <s-stack gap="base">
                  <s-stack
                    direction="inline"
                    gap="base"
                    alignItems="center"
                    justifyContent="space-between"
                  >
                    <s-heading>Markets</s-heading>
                    <a
                      className="order-markets-link"
                      href={MARKETS_ADMIN_URL}
                      target="_top"
                      aria-label="Manage markets"
                    >
                      <s-icon type="settings" />
                    </a>
                  </s-stack>

                  <div>
                    <a
                      className="order-market-badge"
                      href={MARKETS_ADMIN_URL}
                      target="_top"
                    >
                      <s-badge icon="globe">United States</s-badge>
                    </a>
                  </div>

                  <div>
                    <label className="order-currency-label">Currency</label>
                    <select
                      className="order-currency-select"
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value)}
                    >
                      <optgroup label="Market currency">
                        <option value={currencyInfo.primary}>
                          {currencyLabel(currencyInfo.primary)}
                        </option>
                      </optgroup>
                      {otherCurrencies.length > 0 && (
                        <optgroup label="Other currencies">
                          {otherCurrencies.map((code) => (
                            <option key={code} value={code}>
                              {currencyLabel(code)}
                            </option>
                          ))}
                        </optgroup>
                      )}
                    </select>
                  </div>
                </s-stack>
              </s-section>

              <TagsSection
                isEditingTags={isEditingTags}
                setIsEditingTags={setIsEditingTags}
                tagInput={tagInput}
                setTagInput={setTagInput}
                tagList={tagList}
                updateField={handleUpdateTags}
              />
            </s-stack>
          </div>
        </div>
      </s-query-container>

      <AddCustomItemModal
        open={customItemModalOpen}
        onClose={() => setCustomItemModalOpen(false)}
        onAdd={handleAddCustomItem}
      />
      <AddProductModal
        open={productModalOpen}
        onClose={() => setProductModalOpen(false)}
        onAdd={handleAddProducts}
      />
      <DiscountModal
        open={discountModalOpen}
        current={discount}
        onClose={() => setDiscountModalOpen(false)}
        onApply={setDiscount}
        onRemove={() => setDiscount(null)}
      />
      <ShippingModal
        open={shippingModalOpen}
        current={shipping}
        onClose={() => setShippingModalOpen(false)}
        onApply={setShipping}
        onRemove={() => setShipping(null)}
      />
      <SendInvoiceModal
        open={sendInvoiceModalOpen}
        onClose={() => setSendInvoiceModalOpen(false)}
        onReview={handleReviewInvoice}
        customerEmail={selectedCustomerEmail}
        fromLabel={shopFromLabel}
        saving={saving}
      />
      <MarkAsPaidModal
        open={markAsPaidModalOpen}
        onClose={() => setMarkAsPaidModalOpen(false)}
        onConfirm={(method) => {
          setMarkAsPaidModalOpen(false);
          handleCreate("paid", method);
        }}
        total={total}
        currency={currency}
        saving={saving}
      />

      <s-modal
        id="create-order-note-modal"
        ref={editNoteModalRef}
        heading="Edit note"
      >
        <s-text-area
          label="Notes"
          labelAccessibilityVisibility="exclusive"
          placeholder="Add a note..."
          value={noteInput}
          onInput={(e) => setNoteInput(getInputEventValue(e))}
        />
        <s-button
          slot="primary-action"
          variant="primary"
          onClick={() => {
            setNote(noteInput);
            editNoteModalRef.current?.hideOverlay?.();
          }}
        >
          Save
        </s-button>
        <s-button
          slot="secondary-actions"
          variant="tertiary"
          onClick={() => editNoteModalRef.current?.hideOverlay?.()}
        >
          Cancel
        </s-button>
      </s-modal>
    </s-page>
  );
}
