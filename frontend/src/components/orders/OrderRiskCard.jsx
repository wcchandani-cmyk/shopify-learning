import { useRef } from "react";

const ORDER_RISK_FACTORS = [
  {
    text: "The IP address used to place this order isn't available",
    positive: true,
  },
  { text: "Card Verification Value (CVV) isn't available" },
  { text: "Billing address or credit card's address wasn't available" },
  {
    text: "Billing address ZIP or postal code isn't available to match with credit card's registered address",
  },
  { text: "There were no payment attempts" },
  { text: "A payment method other than a credit card was used" },
  { text: "Location of IP address used to place the order isn't available" },
  {
    text: "Distance between shipping address and location of IP address isn't available",
  },
  {
    text: "The billing country or the country of the IP used to place the order isn't available",
  },
  {
    text: "Can't determine if a high risk internet connection was used because the IP address isn't available",
  },
];

export default function OrderRiskCard() {
  const modalRef = useRef(null);

  return (
    <>
      <s-section>
        <s-stack gap="small-200">
          <s-stack
            direction="inline"
            gap="base"
            alignItems="center"
            justifyContent="space-between"
          >
            <s-heading>Order risk</s-heading>
            <s-button
              variant="tertiary"
              icon="search"
              accessibilityLabel="About this order"
              onClick={() => modalRef.current?.showOverlay?.()}
            />
          </s-stack>
          <s-text color="subdued">Analysis not available</s-text>
        </s-stack>
      </s-section>

      <s-modal id="order-risk-modal" ref={modalRef} heading="About this order">
        <s-stack gap="base">
          {ORDER_RISK_FACTORS.map((factor, index) => (
            <div key={index} className="order-risk-factor">
              <s-icon
                type={factor.positive ? "check" : "info"}
                color={factor.positive ? "success" : "subdued"}
                size="small"
              />
              <span>{factor.text}</span>
            </div>
          ))}
          <div className="order-risk-footer">
            Learn more about{" "}
            <s-link
              href="https://help.shopify.com/manual/fraud/fraud-protect"
              target="_blank"
            >
              fraud analysis
            </s-link>
          </div>
        </s-stack>
      </s-modal>
    </>
  );
}
