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
            <div className="order-conversion-row">
              <s-icon type="order" color="subdued" />
              <span>
                This is their {orderNum}
                {getOrdinalSuffix(orderNum)} order
              </span>
            </div>
            <div className="order-conversion-row">
              <s-icon type="globe" color="subdued" />
              <span>1st session from shopify.com</span>
            </div>
            <div className="order-conversion-row">
              <s-icon type="calendar" color="subdued" />
              <span>12 sessions over 13 days</span>
            </div>
            <div style={{ marginTop: "12px" }}>
              <s-link href="#" onClick={handleOpenConversion}>
                View conversion details
              </s-link>
            </div>
          </s-stack>
        ) : (
          <div style={{ color: "#6d7175" }}>
            No conversion summary available
          </div>
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
          <div className="conversion-stats-box">
            <div className="conversion-stat-col">
              <div className="conversion-stat-label">Total sessions</div>
              <div className="conversion-stat-value">12</div>
            </div>
            <div className="conversion-stat-col">
              <div className="conversion-stat-label">Days to conversion</div>
              <div className="conversion-stat-value">13</div>
            </div>
          </div>

          {/* Visit Date & Button Row */}
          <div className="conversion-session-row">
            <div className="conversion-session-info">
              <s-icon type="info" color="subdued" />
              <span>5 June 2026</span>
            </div>
            <s-button onClick={handleOpenSession}>View full sessions</s-button>
          </div>

          {/* Returned Row */}
          <div className="conversion-returned-row">
            <s-icon type="refresh" color="subdued" />
            <span>Returned 10 times</span>
          </div>
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

          <s-stack gap="small-100" style={{ marginTop: "8px" }}>
            <div className="session-detail-item">
              <s-icon type="chat" color="subdued" />
              <span>Store visit was direct</span>
            </div>
            <div className="session-detail-item">
              <s-icon type="product" color="subdued" />
              <span>
                The first page they visited was{" "}
                <s-link
                  href="https://wcdev-chandani.myshopify.com"
                  target="_blank"
                >
                  wcdev-chandani.myshopify.com
                </s-link>
              </span>
            </div>
            <div className="session-detail-item">
              <s-icon type="calendar" color="subdued" />
              <span>Visited on 5 June 2026 at 05:31 am</span>
            </div>
          </s-stack>

          <div className="session-utm-section">
            <div className="session-utm-title">UTM Parameters</div>
            <div className="session-utm-desc">
              No UTM parameters were available for this session.
            </div>
          </div>
        </s-stack>

        <s-button slot="primary-action" onClick={handleCloseSession}>
          Close
        </s-button>
      </s-modal>
    </>
  );
}
