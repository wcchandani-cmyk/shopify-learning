import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAppBridge } from "@shopify/app-bridge-react";
import { getDiscount } from "../../services/discountService";
import DiscountDetail from "./DiscountDetail";
import PageLoader from "../PageLoader";

export default function DiscountEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const shopify = useAppBridge();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [discount, setDiscount] = useState(null);

  useEffect(() => {
    let active = true;

    async function loadDiscount() {
      try {
        setLoading(true);
        const token = await shopify.idToken();
        const data = await getDiscount(id, token);
        if (active) {
          setDiscount(data);
          setError(null);
        }
      } catch (err) {
        if (active) {
          setError(err.message || "Failed to load discount");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadDiscount();

    return () => {
      active = false;
    };
  }, [id, shopify]);

  if (loading) {
    return (
      <s-page heading="Discount">
        <s-link
          slot="breadcrumb-actions"
          href="/discounts"
          onClick={(event) => {
            event.preventDefault();
            navigate("/discounts");
          }}
        >
          Discounts
        </s-link>
        <PageLoader accessibilityLabel="Loading discount details" />
      </s-page>
    );
  }

  if (error || !discount) {
    return (
      <s-page heading="Error loading discount">
        <s-section>
          <s-banner tone="critical" heading="Could not load discount">
            {error || "Discount not found"}
          </s-banner>
        </s-section>
      </s-page>
    );
  }

  return (
    <DiscountDetail
      isNew={false}
      type={discount.type}
      discountData={discount}
    />
  );
}
