import { useCallback, useState, useMemo, useRef, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useAppBridge } from "@shopify/app-bridge-react";
import { useOrderDetail } from "../../hooks/order/useOrderDetail";
import { useUnsavedChangesGuard } from "../../hooks/useUnsavedChangesGuard";
import {
  listOrderComments,
  addOrderComment,
  deleteOrderComment,
  updateOrder,
  cancelOrder,
} from "../../services/orderService";
import { listCustomers } from "../../services/customerService";
import { formatAddressSummary } from "../../utils/customerForm";
import { getInputEventValue } from "../../utils/fieldEvent";
import PageLoader from "../PageLoader";
import Timeline from "../shared/Timeline";
import TagsSection from "../shared/TagsSection";
import NotesCard from "../shared/NotesCard";
import SendInvoiceModal from "./SendInvoiceModal";
import MarkAsPaidModal from "./MarkAsPaidModal";
import CancelOrderModal from "./CancelOrderModal";
import OrderFulfillmentCard from "./OrderFulfillmentCard";
import OrderPaymentCard from "./OrderPaymentCard";
import OrderCustomerCard from "./OrderCustomerCard";
import ConversionSummaryCard from "./ConversionSummaryCard";
import OrderRiskCard from "./OrderRiskCard";
import {
  formatOrderDateLong,
  getPaymentBadge,
  getFulfillmentBadge,
  getFulfillmentDisplay,
  getFulfillmentMenuOptions,
} from "../../utils/orderDisplay";

export default function OrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const shopify = useAppBridge();
  const isDraftMode = location.pathname.startsWith("/drafts");
  const { order, loading, error, reload } = useOrderDetail(id);

  const editNoteModalRef = useRef(null);

  const [isEditingTags, setIsEditingTags] = useState(false);
  const [tagInput, setTagInput] = useState("");
  const [noteInput, setNoteInput] = useState("");
  const [sendInvoiceModalOpen, setSendInvoiceModalOpen] = useState(false);
  const [recordPaymentOpen, setRecordPaymentOpen] = useState(false);
  const [recordingPayment, setRecordingPayment] = useState(false);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [holdFormOpen, setHoldFormOpen] = useState(false);
  const [holdReason, setHoldReason] = useState("");

  const [draftFulfillmentStatus, setDraftFulfillmentStatus] = useState("");
  const [draftFinancialStatus, setDraftFinancialStatus] = useState("");

  const [allCustomers, setAllCustomers] = useState([]);
  const [loadingCustomers, setLoadingCustomers] = useState(false);

  const [draftTags, setDraftTags] = useState("");
  const [draftNote, setDraftNote] = useState("");
  const [draftCustomerId, setDraftCustomerId] = useState("");
  const [saving, setSaving] = useState(false);
  const [timelineTrigger, setTimelineTrigger] = useState(0);

  useEffect(() => {
    if (order) {
      setDraftTags(order.tags || "");
      setDraftNote(order.note || "");
      setDraftCustomerId(order.customer?.id || "");
      setDraftFulfillmentStatus(order.fulfillmentStatus || "unfulfilled");
      setDraftFinancialStatus(order.financialStatus || "");
    }
  }, [order]);

  const saveField = useCallback(async (fieldsToUpdate) => {
    if (!order) return;
    setSaving(true);
    try {
      const payload = {
        tags: draftTags,
        note: draftNote,
        customerId: draftCustomerId || null,
        fulfillmentStatus: draftFulfillmentStatus,
        financialStatus: draftFinancialStatus,
        holdReason: draftFulfillmentStatus === "on hold" ? holdReason : null,
        ...fieldsToUpdate,
      };
      await updateOrder(order.shopifyId, payload);
      shopify.toast.show("Order updated successfully");
      await reload(true);
      setTimelineTrigger((v) => v + 1);
    } catch (err) {
      shopify.toast.show(err.message || "Failed to update order", {
        isError: true,
      });
    } finally {
      setSaving(false);
    }
  }, [
    order,
    draftTags,
    draftNote,
    draftCustomerId,
    draftFulfillmentStatus,
    draftFinancialStatus,
    holdReason,
    shopify,
    reload,
  ]);

  const isDirty = false;

  const draftCustomer = useMemo(() => {
    if (!draftCustomerId) return null;
    if (order?.customer?.id === draftCustomerId) return order.customer;
    const found = allCustomers.find((c) => c.id === draftCustomerId);
    if (!found) return null;
    return {
      id: found.id,
      shopifyId: found.shopifyId,
      displayName: found.name,
      email: found.email,
      phone: found.phone || null,
      company: found.company || null,
      numberOfOrders: Math.max(found.ordersCount || 0, 1),
    };
  }, [draftCustomerId, order?.customer, allCustomers]);

  const warnUnsavedLeave = useCallback(() => {
    shopify.toast.show("Save changes before leaving", { isError: true });
  }, [shopify]);

  const { allowLeaveAfterSave } = useUnsavedChangesGuard(isDirty, warnUnsavedLeave);

  const handleSave = useCallback(() => {
    navigate(isDraftMode ? "/drafts" : "/orders");
  }, [navigate, isDraftMode]);

  const navigateAfterCancelRef = useRef(false);

  const handleCancelOrder = useCallback(
    async (payload) => {
      setCancelling(true);
      try {
        await cancelOrder(order.shopifyId, payload);
        shopify.toast.show("Order cancelled");
        allowLeaveAfterSave();
        navigateAfterCancelRef.current = true;
        setCancelModalOpen(false);
      } catch (err) {
        shopify.toast.show(err.message || "Failed to cancel order", {
          isError: true,
        });
      } finally {
        setCancelling(false);
      }
    },
    [order?.shopifyId, shopify, allowLeaveAfterSave]
  );

  const handleCancelModalClosed = useCallback(() => {
    setCancelModalOpen(false);
    if (navigateAfterCancelRef.current) {
      navigateAfterCancelRef.current = false;
      navigate(isDraftMode ? "/drafts" : "/orders");
    }
  }, [navigate, isDraftMode]);

  const customerOptions = useMemo(() => {
    return allCustomers.map((cust) => ({
      value: cust.id,
      label: cust.name || cust.displayName || "",
      email: cust.email || "",
    }));
  }, [allCustomers]);

  const loadCustomers = useCallback(() => {
    setLoadingCustomers(true);
    listCustomers({ limit: 100 })
      .then((data) => {
        setAllCustomers(data.customers || []);
      })
      .catch((err) => {
        console.error("Failed to load customers:", err);
      })
      .finally(() => {
        setLoadingCustomers(false);
      });
  }, []);

  useEffect(() => {
    loadCustomers();
  }, [loadCustomers]);

  const handleUpdateTags = useCallback(async (fieldName, value) => {
    setDraftTags(value);
    await saveField({ tags: value });
  }, [saveField]);

  const handleSaveNote = useCallback(async () => {
    setDraftNote(noteInput);
    await saveField({ note: noteInput });
  }, [noteInput, saveField]);

  const handleUpdateCustomer = useCallback(async (selectedCustomerId) => {
    setDraftCustomerId(selectedCustomerId);
    await saveField({ customerId: selectedCustomerId || null });
  }, [saveField]);

  const tagList = useMemo(() => {
    return draftTags
      ? draftTags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean)
      : [];
  }, [draftTags]);

  const handleBack = useCallback(() => {
    navigate(isDraftMode ? "/drafts" : "/orders");
  }, [navigate, isDraftMode]);

  const handleUpdateFulfillmentStatus = useCallback(async (status) => {
    setDraftFulfillmentStatus(status);
    await saveField({ fulfillmentStatus: status });
  }, [saveField]);

  const handleMarkAsFulfilled = useCallback(async () => {
    setDraftFulfillmentStatus("fulfilled");
    await saveField({ fulfillmentStatus: "fulfilled" });
  }, [saveField]);

  const handleConfirmHold = useCallback(async (reason) => {
    setDraftFulfillmentStatus("on hold");
    setHoldReason(reason);
    setHoldFormOpen(false);
    await saveField({ fulfillmentStatus: "on hold", holdReason: reason });
  }, [saveField]);

  const handleReleaseHold = useCallback(async () => {
    setHoldReason("");
    setDraftFulfillmentStatus("unfulfilled");
    await saveField({ fulfillmentStatus: "unfulfilled" });
  }, [saveField]);

  const handleRecordPayment = useCallback(async () => {
    if (!order) return;
    setRecordingPayment(true);
    try {
      await updateOrder(order.shopifyId, { financialStatus: "paid" });
      shopify.toast.show("Payment recorded");
      setDraftFinancialStatus("paid");
      setRecordPaymentOpen(false);
      await reload(true);
      setTimelineTrigger((v) => v + 1);
    } catch (err) {
      shopify.toast.show(err.message || "Failed to record payment", {
        isError: true,
      });
    } finally {
      setRecordingPayment(false);
    }
  }, [order, shopify, reload]);

  if (loading) {
    return (
      <s-page>
        <PageLoader accessibilityLabel="Loading order details" />
      </s-page>
    );
  }

  if (error || !order) {
    return (
      <s-page heading="Order details">
        <s-banner tone="critical" heading="Could not load order">
          {error || "Order not found"}
        </s-banner>
        <s-button onClick={handleBack} className="order-back-btn">
          Back to orders
        </s-button>
      </s-page>
    );
  }

  const billingStr = order.billingAddress
    ? formatAddressSummary(
      order.billingAddress,
      draftCustomer?.displayName || ""
    )
    : null;
  const shippingStr = order.shippingAddress
    ? formatAddressSummary(
      order.shippingAddress,
      draftCustomer?.displayName || ""
    )
    : null;

  const fulfillmentState = draftFulfillmentStatus || "unfulfilled";
  const fulfillment = getFulfillmentDisplay(fulfillmentState);
  const fulfillmentMenuOptions = getFulfillmentMenuOptions(fulfillmentState);
  const isOnHold =
    fulfillmentState === "on hold" || fulfillmentState === "on_hold";

  const isInProgress =
    String(fulfillmentState).toLowerCase().replace(/_/g, " ") === "in progress";
  const totalPrice = Number(order.totalPrice) || 0;
  const isPaid = draftFinancialStatus === "paid";
  const paidAmount = isPaid ? totalPrice : 0;
  const balance = Math.max(0, totalPrice - paidAmount);
  const itemsCount = (order.lineItems || []).reduce(
    (sum, item) => sum + (Number(item.quantity) || 0),
    0
  );

  return (
    <s-page
      heading={isDraftMode ? (order.draftName || order.name) : order.name}
      backAction={{ content: isDraftMode ? "Drafts" : "Orders", onClick: handleBack }}
    >
      <s-button
        slot="primary-action"
        variant="primary"
        onClick={handleSave}
        {...(saving ? { loading: true } : {})}
      >
        Save
      </s-button>

      {!isInProgress && (
        <s-button
          slot="secondary-actions"
          tone="critical"
          onClick={() => setCancelModalOpen(true)}
        >
          Cancel order
        </s-button>
      )}

      <div className="order-date-subheader" style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
        <span>{formatOrderDateLong(order.createdAt)} from {order.channel || "Online Store"}</span>
        {getPaymentBadge(order.financialStatus)}
        {getFulfillmentBadge(fulfillmentState)}
      </div>

      <s-query-container containerName="product-detail">
        <div className="product-detail-layout">
          <div className="product-detail-layout__main">
            <s-stack gap="base">
              {isDraftMode && order.financialStatus !== "pending" && (
                <s-banner heading="Completed" tone="success">
                  Order created on {formatOrderDateLong(order.createdAt)}. You can{" "}
                  <s-link
                    href={`/orders/${order.shopifyId}`}
                    onClick={(e) => {
                      e.preventDefault();
                      navigate(`/orders/${order.shopifyId}`);
                    }}
                  >
                    view the order
                  </s-link>{" "}
                  or{" "}
                  <s-link
                    href="/orders/new"
                    onClick={(e) => {
                      e.preventDefault();
                      navigate("/orders/new");
                    }}
                  >
                    create a new order
                  </s-link>
                  .
                </s-banner>
              )}

              {order.testOrder && (
                <s-banner heading="Test order" tone="warning">
                  Your payment gateway was in test mode when this order was
                  created.
                </s-banner>
              )}

              <OrderFulfillmentCard
                lineItems={order.lineItems || []}
                currency={order.currency}
                fulfillment={fulfillment}
                fulfillmentState={fulfillmentState}
                fulfillmentMenuOptions={fulfillmentMenuOptions}
                itemsCount={itemsCount}
                isOnHold={isOnHold}
                holdReason={holdReason}
                holdFormOpen={holdFormOpen}
                holdingOrder={false}
                onMarkFulfilled={handleMarkAsFulfilled}
                onUpdateStatus={handleUpdateFulfillmentStatus}
                onOpenHoldForm={() => setHoldFormOpen(true)}
                onCancelHold={() => setHoldFormOpen(false)}
                onConfirmHold={handleConfirmHold}
                onReleaseHold={handleReleaseHold}
              />

              <OrderPaymentCard
                currency={order.currency}
                subtotalPrice={order.subtotalPrice}
                totalShipping={order.totalShipping}
                totalTax={order.totalTax}
                totalPrice={totalPrice}
                paidAmount={paidAmount}
                balance={balance}
                itemsCount={itemsCount}
                isPaid={isPaid}
                collectingPayment={recordingPayment}
                onSendInvoice={() => setSendInvoiceModalOpen(true)}
                onManualPayment={() => setRecordPaymentOpen(true)}
                isDraft={isDraftMode}
              />

              <s-section>
                <Timeline
                  entityId={order.shopifyId}
                  listComments={listOrderComments}
                  addComment={addOrderComment}
                  deleteComment={deleteOrderComment}
                  reloadTrigger={timelineTrigger}
                />
              </s-section>
            </s-stack>
          </div>

          <div className="product-detail-layout__aside">
            <s-stack gap="base">
              <NotesCard
                note={draftNote}
                placeholder="No notes from customer"
                onEdit={() => {
                  setNoteInput(draftNote || "");
                  editNoteModalRef.current?.showOverlay?.();
                }}
              />

              <OrderCustomerCard
                customer={draftCustomer}
                customerOptions={customerOptions}
                loadingCustomers={loadingCustomers}
                shippingStr={shippingStr}
                billingStr={billingStr}
                onUpdateCustomer={handleUpdateCustomer}
                onCreateNewCustomer={() => navigate("/customers/new")}
              />

              <ConversionSummaryCard customer={draftCustomer} />

              <OrderRiskCard />

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

      <s-modal id="edit-note-modal" ref={editNoteModalRef} heading="Edit note">
        <s-stack gap="base">
          <s-text-area
            label="Notes"
            labelAccessibilityVisibility="exclusive"
            placeholder="Add a note..."
            value={noteInput}
            onInput={(e) => setNoteInput(getInputEventValue(e))}
          />
          <div className="note-modal-counter">{noteInput.length}/5000</div>
          <div className="note-modal-caption">
            To comment on an order or mention a staff member, use Timeline
            instead
          </div>
        </s-stack>

        <s-button
          slot="primary-action"
          variant="primary"
          onClick={async () => {
            await handleSaveNote();
            editNoteModalRef.current?.hideOverlay?.();
          }}
          {...(noteInput.length > 5000 ? { disabled: true } : {})}
        >
          Save
        </s-button>
        <s-button
          slot="secondary-actions"
          onClick={() => editNoteModalRef.current?.hideOverlay?.()}
        >
          Cancel
        </s-button>
      </s-modal>

      <SendInvoiceModal
        open={sendInvoiceModalOpen}
        onClose={() => setSendInvoiceModalOpen(false)}
        onReview={() => {
          setSendInvoiceModalOpen(false);
          shopify.toast.show("Invoice ready to review");
        }}
        customerEmail={draftCustomer?.email || order.email || ""}
      />

      <MarkAsPaidModal
        open={recordPaymentOpen}
        onClose={() => setRecordPaymentOpen(false)}
        onConfirm={handleRecordPayment}
        mode={isDraftMode ? "create" : "record"}
        total={totalPrice}
        balance={balance}
        currency={order.currency}
        saving={recordingPayment}
      />

      <CancelOrderModal
        open={cancelModalOpen}
        onClose={handleCancelModalClosed}
        onConfirm={handleCancelOrder}
        orderName={order.name || `#${order.orderNumber}`}
        refundAmount={totalPrice}
        currency={order.currency}
        canRefund={order.financialStatus === "paid" && totalPrice > 0}
        hasCustomer={Boolean(order.customer)}
        saving={cancelling}
      />
    </s-page>
  );
}
