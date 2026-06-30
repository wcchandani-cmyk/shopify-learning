import { useRef } from "react";
import { getOrdinalSuffix } from "../../utils/orderDisplay";

export default function ConversionSummaryCard({ customer }) {
  const conversionModalRef = useRef(null);
  const sessionModalRef = useRef(null);

  const handleOpenConversion = (e) => {
    e.preventDefault();
    conversionModalRef.current?.showOverlay?.();
  };

  const handleCloseConversion = () => {
    conversionModalRef.current?.hideOverlay?.();
  };

  const handleOpenSession = () => {
    conversionModalRef.current?.hideOverlay?.();
    sessionModalRef.current?.showOverlay?.();
  };

  const handleCloseSession = () => {
    sessionModalRef.current?.hideOverlay?.();
  };

  const handleBackToConversion = () => {
    sessionModalRef.current?.hideOverlay?.();
    conversionModalRef.current?.showOverlay?.();
  };

  const orderNum = customer?.numberOfOrders || 1;

  return (
    <>
      <s-section heading="Conversion summary">
        {customer ? (
          <s-stack gap="small-200" className="order-conversion-summary">
            <s-stack direction="inline" gap="small-200" alignItems="center">
              <s-icon type="order" color="subdued" />
              <s-text>
                This is their {orderNum}
                {getOrdinalSuffix(orderNum)} order
              </s-text>
            </s-stack>
            <s-stack direction="inline" gap="small-200" alignItems="center">
              <s-icon type="globe" color="subdued" />
              <s-text>1st session from shopify.com</s-text>
            </s-stack>
            <s-stack direction="inline" gap="small-200" alignItems="center">
              <s-icon type="calendar" color="subdued" />
              <s-text>12 sessions over 13 days</s-text>
            </s-stack>
            <div style={{ marginTop: "12px" }}>
              <s-link href="#" onClick={handleOpenConversion}>
                View conversion details
              </s-link>
            </div>
          </s-stack>
        ) : (
          <s-text color="subdued">No conversion summary available</s-text>
        )}
      </s-section>

      {/* Conversion Details Modal */}
      <s-modal
        id="conversion-details-modal"
        ref={conversionModalRef}
        heading="Conversion details"
      >
        <s-stack gap="base">
          {/* Stats Box */}
          <s-stack direction="inline" gap="base">
            <s-box padding="base" background="subdued" borderRadius="base">
              <s-stack gap="extra-tight">
                <s-text color="subdued" size="small">Total sessions</s-text>
                <s-text fontWeight="bold" size="large">12</s-text>
              </s-stack>
            </s-box>
            <s-box padding="base" background="subdued" borderRadius="base">
              <s-stack gap="extra-tight">
                <s-text color="subdued" size="small">Days to conversion</s-text>
                <s-text fontWeight="bold" size="large">13</s-text>
              </s-stack>
            </s-box>
          </s-stack>

          {/* Visit Date & Button Row */}
          <s-stack direction="inline" gap="base" alignItems="center" justifyContent="space-between">
            <s-stack direction="inline" gap="small-200" alignItems="center">
              <s-icon type="info" color="subdued" />
              <s-text>5 June 2026</s-text>
            </s-stack>
            <s-button onClick={handleOpenSession}>View full sessions</s-button>
          </s-stack>

          {/* Returned Row */}
          <s-stack direction="inline" gap="small-200" alignItems="center">
            <s-icon type="refresh" color="subdued" />
            <s-text>Returned 10 times</s-text>
          </s-stack>
        </s-stack>

        <s-button slot="primary-action" onClick={handleCloseConversion}>
          Close
        </s-button>
      </s-modal>

      {/* Session Details Modal */}
      <s-modal id="session-details-modal" ref={sessionModalRef} heading="">
        <s-stack gap="base">
          {/* Custom header with back button */}
          <div
            className="session-modal-back-header"
            onClick={handleBackToConversion}
          >
            <s-icon type="chevron-left" />
            <span className="session-modal-back-title">Session details</span>
          </div>

          <s-stack gap="small-200" style={{ marginTop: "8px" }}>
            <s-stack direction="inline" gap="small-200" alignItems="center">
              <s-icon type="chat" color="subdued" />
              <s-text>Store visit was direct</s-text>
            </s-stack>
            <s-stack direction="inline" gap="small-200" alignItems="flex-start">
              <s-icon type="product" color="subdued" />
              <s-text>
                The first page they visited was{" "}
                <s-link
                  href="https://wcdev-chandani.myshopify.com"
                  target="_blank"
                >
                  wcdev-chandani.myshopify.com
                </s-link>
              </s-text>
            </s-stack>
            <s-stack direction="inline" gap="small-200" alignItems="center">
              <s-icon type="calendar" color="subdued" />
              <s-text>Visited on 5 June 2026 at 05:31 am</s-text>
            </s-stack>
          </s-stack>

          <s-stack gap="small-100">
            <s-text fontWeight="bold">UTM Parameters</s-text>
            <s-text color="subdued">
              No UTM parameters were available for this session.
            </s-text>
          </s-stack>
        </s-stack>

        <s-button slot="primary-action" onClick={handleCloseSession}>
          Close
        </s-button>
      </s-modal>
    </>
  );
}
