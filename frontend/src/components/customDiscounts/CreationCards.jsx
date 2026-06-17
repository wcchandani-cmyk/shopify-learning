import React from "react";
import "../../styles/CustomDiscountDetail.css";

export default function CreationCards({ onCreate }) {

  const handleCreate = (type) => {
    if (onCreate) {
      onCreate(type);
    }
  };

  return (
    <div
      className="creation-cards-grid"
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
        gap: "20px",
        marginBottom: "24px",
      }}
    >
      <s-section>
        <div className="mockup-container">
          <div>
            <div className="mockup-header">Cart Items</div>
            <div className="mockup-item-box">
              <div className="mockup-item-icon-wrapper">
                <div className="mockup-item-icon">👕</div>
                <div className="mockup-item-details">
                  <span className="mockup-item-title">
                    Classic Cotton T-Shirt
                  </span>
                  <span className="mockup-item-subtext">
                    Size: M | Color: Black
                  </span>
                </div>
              </div>
              <div className="mockup-item-price">
                <div className="mockup-item-price-original">$25.00</div>
                <div className="mockup-item-price-discounted">$20.00</div>
              </div>
            </div>
          </div>
          <div className="mockup-tag-badge">
            <div className="mockup-tag-badge-left">
              <span>🏷️</span>
              <span>SAVE20 (-$5.00)</span>
            </div>
            <span>Applied</span>
          </div>
        </div>

        <s-heading level="2">Product Discount</s-heading>
        <s-paragraph
          tone="subdued"
          style={{ marginTop: "8px", marginBottom: "20px", minHeight: "36px" }}
        >
          Apply discounts to a specific product or variant in the cart.
        </s-paragraph>
        <s-button onClick={() => handleCreate("1")}>Create Discount</s-button>
      </s-section>

      <s-section>
        <div className="mockup-container">
          <div>
            <div className="mockup-header">Order Summary</div>
            <div className="mockup-row">
              <span className="mockup-row-label">Subtotal</span>
              <span className="mockup-row-value">$50.00</span>
            </div>
            <div className="mockup-row">
              <span className="mockup-row-label">Shipping (Standard)</span>
              <span
                className="mockup-row-value-original"
                style={{ textDecoration: "line-through", color: "#8c9196" }}
              >
                $10.00
              </span>
            </div>
          </div>

          <div className="mockup-tag-badge" style={{ marginBottom: "8px" }}>
            <div className="mockup-tag-badge-left">
              <span>🏷️</span>
              <span>FREE_SHIP (-$10.00)</span>
            </div>
            <span>Free</span>
          </div>

          <div className="mockup-total-row">
            <span>Total</span>
            <span className="mockup-total-value">$50.00</span>
          </div>
        </div>

        <s-heading level="2">Shipping Discount</s-heading>
        <s-paragraph
          tone="subdued"
          style={{ marginTop: "8px", marginBottom: "20px", minHeight: "36px" }}
        >
          Apply discounts to multiple shipping rates at checkout.
        </s-paragraph>
        <s-button onClick={() => handleCreate("2")}>Create Discount</s-button>
      </s-section>

      <s-section>
        <div className="mockup-container">
          <div>
            <div className="mockup-header">Order Summary</div>
            <div className="mockup-row">
              <span className="mockup-row-label">Subtotal</span>
              <span className="mockup-row-value">$100.00</span>
            </div>
            <div className="mockup-row">
              <span className="mockup-row-label">Discount (WELCOME15)</span>
              <span className="mockup-row-value" style={{ color: "#d82c0d" }}>
                -$15.00
              </span>
            </div>
          </div>

          <div className="mockup-tag-badge" style={{ marginBottom: "8px" }}>
            <div className="mockup-tag-badge-left">
              <span>🏷️</span>
              <span>15% Off entire order</span>
            </div>
          </div>

          <div className="mockup-total-row">
            <span>Total</span>
            <span className="mockup-total-value">$85.00</span>
          </div>
        </div>

        <s-heading level="2">Order Discount</s-heading>
        <s-paragraph
          tone="subdued"
          style={{ marginTop: "8px", marginBottom: "20px", minHeight: "36px" }}
        >
          Apply discounts to entire orders based on your custom rules.
        </s-paragraph>
        <s-button onClick={() => handleCreate("3")}>Create Discount</s-button>
      </s-section>
    </div>
  );
}
