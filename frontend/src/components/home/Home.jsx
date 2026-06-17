import React from "react";
import { useNavigate } from "react-router-dom";

export default function Home() {
  const navigate = useNavigate();

  return (
    <s-page heading="Home">
      <s-section heading="Welcome to chandani">
        <s-stack gap="base">
          <s-text color="subdued">
            Manage your store catalog from here.
          </s-text>
          <s-stack direction="inline" gap="small">
            <s-button variant="primary" onClick={() => navigate("/products")}>
              View products
            </s-button>
          </s-stack>
        </s-stack>
      </s-section>
    </s-page>
  );
}
