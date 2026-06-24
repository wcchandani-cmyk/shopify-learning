import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getCustomDiscount } from "../../services/customDiscountService";
import CustomDiscountDetail from "./CustomDiscountDetail";
import PageLoader from "../shared/PageLoader";

export default function CustomDiscountEdit() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [customDiscountData, setCustomDiscountData] = useState(null);

  const fetchCustomDiscount = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getCustomDiscount(id);
      setCustomDiscountData(data);
    } catch (err) {
      setError(err.message || "Failed to load custom discount details");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchCustomDiscount();
  }, [fetchCustomDiscount]);

  if (loading) {
    return <PageLoader accessibilityLabel="Loading custom discount details" />;
  }

  if (error) {
    return (
      <s-page heading="Error">
        <s-link
          slot="breadcrumb-actions"
          href="/custom-discounts"
          onClick={(event) => {
            event.preventDefault();
            navigate("/custom-discounts");
          }}
        >
          Custom Discounts
        </s-link>
        <s-banner tone="critical" heading="Could not load custom discount">
          {error}
        </s-banner>
      </s-page>
    );
  }

  return (
    <CustomDiscountDetail
      isNew={false}
      customizationData={customDiscountData}
      initialFunctionType={customDiscountData?.functionType || "1"}
    />
  );
}
