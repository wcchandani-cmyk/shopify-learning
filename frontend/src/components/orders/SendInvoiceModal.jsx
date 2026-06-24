import { useCallback, useEffect, useState } from "react";
import { getInputEventValue, getCheckboxChecked } from "../../utils/fieldEvent";
import { useOverlayModal } from "../../hooks/useOverlayModal";

const SEND_INVOICE_MODAL_ID = "send-invoice-modal";

export default function SendInvoiceModal({
  open,
  onClose,
  onReview,
  customerEmail = "",
  fromLabel = "",
  saving = false,
}) {
  const { modalRef, onAfterHide } = useOverlayModal(open, onClose);
  const [to, setTo] = useState("");
  const [cc, setCc] = useState("");
  const [bcc, setBcc] = useState("");
  const [showCcBcc, setShowCcBcc] = useState(false);
  const [subject, setSubject] = useState("Invoice {{name}}");
  const [message, setMessage] = useState("");
  const [lockPrices, setLockPrices] = useState(true);
  const [allowDiscountCodes, setAllowDiscountCodes] = useState(false);

  useEffect(() => {
    if (open) setTo(customerEmail || "");
  }, [open, customerEmail]);

  const handleReview = useCallback(() => {
    onReview({
      to: to.trim(),
      cc: cc.trim(),
      bcc: bcc.trim(),
      subject: subject.trim(),
      message: message.trim(),
      lockPrices,
      allowDiscountCodes,
    });
  }, [to, cc, bcc, subject, message, lockPrices, allowDiscountCodes, onReview]);

  return (
    <s-modal
      id={SEND_INVOICE_MODAL_ID}
      ref={modalRef}
      heading="Send invoice"
      onAfterHide={onAfterHide}
    >
      <s-stack gap="base">
        <s-grid gap="base" gridTemplateColumns="1fr 1fr">
          <s-text-field
            label="To"
            type="email"
            value={to}
            onInput={(e) => setTo(getInputEventValue(e))}
          />
          <s-select label="From" value="shop">
            <s-option value="shop">{fromLabel || "Store email"}</s-option>
          </s-select>
        </s-grid>

        <button
          type="button"
          className="send-invoice-ccbcc-link"
          onClick={() => setShowCcBcc((prev) => !prev)}
        >
          Cc and Bcc recipients
          <s-icon type={showCcBcc ? "chevron-up" : "chevron-down"} />
        </button>

        {showCcBcc && (
          <s-grid gap="base" gridTemplateColumns="1fr 1fr">
            <s-text-field
              label="Cc"
              type="email"
              value={cc}
              onInput={(e) => setCc(getInputEventValue(e))}
            />
            <s-text-field
              label="Bcc"
              type="email"
              value={bcc}
              onInput={(e) => setBcc(getInputEventValue(e))}
            />
          </s-grid>
        )}

        <s-text-field
          label="Subject"
          value={subject}
          onInput={(e) => setSubject(getInputEventValue(e))}
        />

        <s-text-area
          label="Custom message (optional)"
          value={message}
          onInput={(e) => setMessage(getInputEventValue(e))}
        />

        <div className="send-invoice-option-box">
          <div className="send-invoice-option-row">
            <s-icon type="lock" />
            <div className="send-invoice-option-text">
              <div className="send-invoice-option-title">Product prices</div>
              <div className="send-invoice-option-desc">
                Lock all product prices so they don't change
              </div>
            </div>
            <s-switch
              checked={lockPrices || undefined}
              onChange={(e) => setLockPrices(getCheckboxChecked(e))}
            />
          </div>

          <div className="send-invoice-option-row">
            <s-icon type="settings" />
            <div className="send-invoice-option-text">
              <div className="send-invoice-option-title">Discount codes</div>
              <div className="send-invoice-option-desc">
                Allow your customer to enter discount codes
              </div>
            </div>
            <s-switch
              checked={allowDiscountCodes || undefined}
              onChange={(e) => setAllowDiscountCodes(getCheckboxChecked(e))}
            />
          </div>
        </div>
      </s-stack>

      <s-button
        slot="primary-action"
        variant="primary"
        onClick={handleReview}
        {...(saving ? { loading: true } : {})}
      >
        Review invoice
      </s-button>
      <s-button slot="secondary-actions" variant="tertiary" onClick={onClose}>
        Cancel
      </s-button>
    </s-modal>
  );
}
