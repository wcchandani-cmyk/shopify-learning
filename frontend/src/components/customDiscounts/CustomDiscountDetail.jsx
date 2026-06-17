import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAppBridge } from "@shopify/app-bridge-react";
import {
  generateRandomDiscountCode,
  combineDateTime,
  validateCustomDiscount,
  getInitialCustomDiscountForm,
} from "../../utils/discountForm";
import {
  createCustomDiscount,
  updateCustomDiscount,
} from "../../services/customDiscountService";
import NoteBanner from "./NoteBanner";
import InternalNameSection from "./InternalNameSection";
import DiscountMethodSection from "./DiscountMethodSection";
import DiscountCodeSection from "./DiscountCodeSection";
import ShippingDiscountTypeSection from "./ShippingDiscountTypeSection";
import ShippingMethodSection from "./ShippingMethodSection";
import DiscountTypeSelectSection from "./DiscountTypeSelectSection";
import DiscountTypeRadioSection from "./DiscountTypeRadioSection";
import DiscountAmountSection from "./DiscountAmountSection";
import DiscountTiersSection from "./DiscountTiersSection";
import ConditionsSection from "./ConditionsSection";
import AdditionalOptionsSection from "./AdditionalOptionsSection";
import CustomDiscountSummaryCard from "./CustomDiscountSummaryCard";

import PageLoader from "../PageLoader";
import "../../styles/CustomDiscountDetail.css";

export default function CustomDiscountDetail({
  isNew = true,
  customizationData = null,
  customDiscountData = null,
  initialFunctionType = "1",
}) {
  const shopify = useAppBridge();
  const navigate = useNavigate();

  const activeData = customDiscountData || customizationData;

  const [loading, setLoading] = useState(!isNew && !activeData);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);

  const [form, setForm] = useState(() =>
    getInitialCustomDiscountForm(initialFunctionType)
  );

  useEffect(() => {
    if (activeData) {
      let config = {};
      try {
        config = JSON.parse(activeData.configuration || "{}");
      } catch (err) {
        console.error("Error parsing customization configuration:", err);
      }

      setForm({
        title: activeData.title || "",
        method: activeData.method || "Automatic",
        code: config.code || "",
        functionType: activeData.functionType || "1",
        combinesWithProduct: Boolean(activeData.combinesWithProduct),
        combinesWithOrder: Boolean(activeData.combinesWithOrder),
        combinesWithShipping: Boolean(activeData.combinesWithShipping),
        startDate: activeData.startsAt
          ? new Date(activeData.startsAt).toISOString().substring(0, 10)
          : new Date().toISOString().substring(0, 10),
        startTime: "12:00 AM",
        hasEndDate: Boolean(activeData.endsAt),
        endDate: activeData.endsAt
          ? new Date(activeData.endsAt).toISOString().substring(0, 10)
          : "",
        endTime: "12:00 AM",
        conditions: config.conditions || [],
        combination: config.combination || "all",
        discountType: config.discountType || "percentage",
        discountValue: config.discountValue || "",
        discountMessage: config.discountMessage || "",
        campaignType: config.campaignType || "conditional_discount",
        limitTotalUses: Boolean(config.limitTotalUses),
        limitTotalUsesValue: config.limitTotalUsesValue || "",
        limitOnePerCustomer: Boolean(config.limitOnePerCustomer),
        applyToEachEntitledItem: Boolean(config.applyToEachEntitledItem),
        tiers: config.tiers || [
          { id: Date.now(), message: "", quantity: "", discountValue: "" },
        ],
        shippingDiscountType: config.shippingDiscountType || "discount",
        shippingMethodScope: config.shippingMethodScope || "all",
        shippingMethods: config.shippingMethods || [],
        usedCount: activeData.usedCount || 0,
      });
      setLoading(false);
    }
  }, [activeData]);

  const updateField = (field, value) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleGenerateCode = () => {
    const randomCode = generateRandomDiscountCode();
    setForm((prev) => ({
      ...prev,
      code: randomCode,
      title: randomCode,
    }));
    shopify.toast.show("Code generated");
  };

  const handleCancel = () => {
    navigate("/custom-discounts");
  };

  const handleSave = async () => {
    if (saving) return;

    const validationError = validateCustomDiscount(form);
    if (validationError) {
      setSaveError(validationError);
      shopify.toast.show(validationError, { isError: true });
      return;
    }

    setSaving(true);
    setSaveError(null);

    try {
      const cleanTitle = form.title.trim();
      const startsAt = combineDateTime(form.startDate, form.startTime);
      const endsAt = form.hasEndDate
        ? combineDateTime(form.endDate, form.endTime)
        : null;

      const configuration = {
        conditions: form.conditions,
        combination: form.combination,
        discountType: form.discountType,
        discountValue:
          form.campaignType === "tiered_discount"
            ? ""
            : String(parseFloat(form.discountValue) || 0),
        discountMessage:
          form.campaignType === "tiered_discount"
            ? ""
            : form.discountMessage.trim(),
        campaignType: form.campaignType,
        title: cleanTitle,
        code: form.method === "Code" ? form.code.trim() : "",
        limitTotalUses: form.limitTotalUses,
        limitTotalUsesValue: form.limitTotalUses
          ? String(form.limitTotalUsesValue)
          : "",
        limitOnePerCustomer: form.limitOnePerCustomer,
        applyToEachEntitledItem: form.applyToEachEntitledItem,
        tiers: form.campaignType === "tiered_discount" ? form.tiers : [],
        shippingDiscountType: form.shippingDiscountType,
        shippingMethodScope: form.shippingMethodScope,
        shippingMethods:
          form.shippingMethodScope === "specific" ? form.shippingMethods : [],
        functionType: form.functionType,
      };

      const payload = {
        title: cleanTitle,
        method: form.method,
        code: form.method === "Code" ? form.code.trim() : "",
        startsAt,
        endsAt,
        combinesWithProduct: form.combinesWithProduct,
        combinesWithOrder: form.combinesWithOrder,
        combinesWithShipping: form.functionType === "2" ? false : form.combinesWithShipping,
        configuration,
        functionType: form.functionType,
      };

      const token = await shopify.idToken();
      if (isNew) {
        await createCustomDiscount(payload, token);
        shopify.toast.show("Custom discount created successfully");
      } else {
        const shopifyNumericId = activeData.shopifyId
          ? activeData.shopifyId.split("/").pop()
          : activeData.id;
        await updateCustomDiscount(shopifyNumericId, payload, token);
        shopify.toast.show("Custom discount updated successfully");
      }
      navigate("/custom-discounts");
    } catch (err) {
      const msg = err.message || "Failed to save custom discount";
      setSaveError(msg);
      shopify.toast.show(msg, { isError: true });
      setSaving(false);
    }
  };


  const isShipping = form.functionType === "2";
  const isCodeMethod = form.method === "Code";
  const isFreeShipping =
    isShipping && form.shippingDiscountType === "free_shipping";
  const showDiscountAmountOptions = !isFreeShipping;
  const isTieredDiscount = form.campaignType === "tiered_discount";

  if (loading) {
    return <PageLoader accessibilityLabel="Loading custom discount" />;
  }

  return (
    <s-page heading={isNew ? `Create custom discount` : form.title}>
      <s-link
        slot="breadcrumb-actions"
        href="/custom-discounts"
        onClick={(event) => {
          event.preventDefault();
          handleCancel();
        }}
      >
        Custom Discounts
      </s-link>

      <s-button
        slot="primary-action"
        variant="primary"
        onClick={handleSave}
        loading={saving || undefined}
      >
        Save
      </s-button>


      {saveError && (
        <s-banner tone="critical" heading="Could not save custom discount">
          {saveError}
        </s-banner>
      )}

      <s-query-container containerName="product-detail">
        <div className="custom-discount-detail-layout">
          <NoteBanner />

          <div className="product-detail-layout">
            <div className="product-detail-layout__main">
              <s-stack gap="base">
                <InternalNameSection
                  title={form.title}
                  onChangeTitle={(val) => updateField("title", val)}
                />

                <DiscountMethodSection
                  method={form.method}
                  onChangeMethod={(val) =>
                    setForm((prev) => ({
                      ...prev,
                      method: val,
                      ...(val === "Automatic" ? { code: "" } : {}),
                    }))
                  }
                />

                {isShipping && (
                  <ShippingDiscountTypeSection
                    shippingDiscountType={form.shippingDiscountType}
                    onChange={(val) => updateField("shippingDiscountType", val)}
                  />
                )}

                <DiscountTypeSelectSection
                  campaignType={form.campaignType}
                  onChangeCampaignType={(val) =>
                    updateField("campaignType", val)
                  }
                  method={form.method}
                  functionType={form.functionType}
                  shippingDiscountType={form.shippingDiscountType}
                />

                {isCodeMethod && (
                  <DiscountCodeSection
                    code={form.code}
                    onChangeCode={(val) =>
                      setForm((prev) => ({
                        ...prev,
                        code: val,
                        title: val,
                      }))
                    }
                    onGenerateCode={handleGenerateCode}
                  />
                )}

                {showDiscountAmountOptions && (
                  <>
                    <DiscountTypeRadioSection
                      discountType={form.discountType}
                      onChangeDiscountType={(type) => {
                        setForm((prev) => ({
                          ...prev,
                          discountType: type,
                          ...(type === "percentage"
                            ? { applyToEachEntitledItem: false }
                            : {}),
                        }));
                      }}
                      applyToEachEntitledItem={form.applyToEachEntitledItem}
                      onChangeApplyToEach={(val) =>
                        updateField("applyToEachEntitledItem", val)
                      }
                    />

                    {isTieredDiscount ? (
                      <DiscountTiersSection
                        tiers={form.tiers}
                        onChangeTiers={(val) => updateField("tiers", val)}
                        discountType={form.discountType}
                      />
                    ) : (
                      <DiscountAmountSection
                        discountType={form.discountType}
                        discountValue={form.discountValue}
                        onChangeDiscountValue={(val) =>
                          updateField("discountValue", val)
                        }
                        discountMessage={form.discountMessage}
                        onChangeDiscountMessage={(val) =>
                          updateField("discountMessage", val)
                        }
                      />
                    )}
                  </>
                )}

                {isShipping && (
                  <ShippingMethodSection
                    scope={form.shippingMethodScope}
                    onChangeScope={(val) =>
                      updateField("shippingMethodScope", val)
                    }
                    methods={form.shippingMethods}
                    onChangeMethods={(val) =>
                      updateField("shippingMethods", val)
                    }
                  />
                )}

                <ConditionsSection
                  conditions={form.conditions}
                  onChangeConditions={(val) => updateField("conditions", val)}
                  combination={form.combination}
                  onChangeCombination={(val) => updateField("combination", val)}
                  functionType={form.functionType}
                />

                <AdditionalOptionsSection
                  form={form}
                  updateField={updateField}
                />
              </s-stack>
            </div>

            <div className="product-detail-layout__aside">
              <s-stack gap="base">
                <CustomDiscountSummaryCard
                  isNew={isNew}
                  form={form}
                  campaignType={form.campaignType}
                  discountType={form.discountType}
                  status={activeData?.status || "active"}
                />
              </s-stack>
            </div>
          </div>
        </div>
      </s-query-container>
    </s-page>
  );
}
