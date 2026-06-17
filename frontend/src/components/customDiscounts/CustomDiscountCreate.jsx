import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import CustomDiscountDetail from "./CustomDiscountDetail";
import CreationCards from "./CreationCards";

export default function CustomDiscountCreate() {
  const navigate = useNavigate();
  const [selectedType, setSelectedType] = useState(null);

  if (selectedType) {
    return (
      <div>
        <CustomDiscountDetail isNew={true} initialFunctionType={selectedType} />
      </div>
    );
  }

  return (
    <s-page heading="Select discount type">
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

      <div style={{ padding: "24px 0" }}>
        <CreationCards onCreate={setSelectedType} />
      </div>
    </s-page>
  );
}
