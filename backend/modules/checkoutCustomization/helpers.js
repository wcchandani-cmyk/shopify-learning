const VALID_TYPES = ["custom_field", "custom_content", "line_item_actions"];

const parseJson = (val, fallback = []) => {
  if (val && typeof val === "object") return val;
  if (typeof val === "string") {
    try { return JSON.parse(val); } catch { return fallback; }
  }
  return fallback;
};

const buildPayload = (body, type) => {
  const base = {
    type,
    internalName: String(body.internalName || "").trim(),
    displayRule: body.displayRule || "all",
    isActive: body.isActive !== undefined ? Boolean(body.isActive) : true,
  };

  if (type === "custom_field") {
    return {
      ...base,
      blockVisibility: body.blockVisibility || "Dynamic",
      displayConditions: JSON.stringify(parseJson(body.displayConditions)),
      orderFieldSetting: body.orderFieldSetting || "order_metafield",
      heading: body.heading || null,
      subheading: body.subheading || null,
      fields: JSON.stringify(parseJson(body.fields)),
    };
  }

  if (type === "custom_content") {
    return {
      ...base,
      blockVisibility: body.blockVisibility || "Dynamic",
      displayConditions: JSON.stringify(parseJson(body.displayConditions)),
      heading: body.heading || null,
      contents: JSON.stringify(parseJson(body.contents)),
    };
  }

  if (type === "line_item_actions") {
    return {
      ...base,
      displayConditions: JSON.stringify(parseJson(body.displayConditions)),
      showActionsExpanded: body.showActionsExpanded !== undefined ? Boolean(body.showActionsExpanded) : true,
      subscriptionSelector: body.subscriptionSelector !== undefined ? Boolean(body.subscriptionSelector) : false,
      variantSelector: body.variantSelector !== undefined ? Boolean(body.variantSelector) : true,
      quantity: body.quantity !== undefined ? Boolean(body.quantity) : true,
      removeButton: body.removeButton !== undefined ? Boolean(body.removeButton) : true,
    };
  }

  return base;
};

const buildUpdatePayload = (body, record) => {
  const pick = (key, fallback) => body[key] !== undefined ? body[key] : fallback;
  const type = record.type;

  const base = {
    internalName: String(pick("internalName", record.internalName)).trim(),
    displayRule: pick("displayRule", record.displayRule),
    isActive: Boolean(pick("isActive", record.isActive)),
  };

  if (type === "custom_field") {
    return {
      ...base,
      blockVisibility: pick("blockVisibility", record.blockVisibility),
      displayConditions: JSON.stringify(parseJson(pick("displayConditions", record.displayConditions))),
      orderFieldSetting: pick("orderFieldSetting", record.orderFieldSetting),
      heading: pick("heading", record.heading) || null,
      subheading: pick("subheading", record.subheading) || null,
      fields: JSON.stringify(parseJson(pick("fields", record.fields))),
    };
  }

  if (type === "custom_content") {
    return {
      ...base,
      blockVisibility: pick("blockVisibility", record.blockVisibility),
      displayConditions: JSON.stringify(parseJson(pick("displayConditions", record.displayConditions))),
      heading: pick("heading", record.heading) || null,
      contents: JSON.stringify(parseJson(pick("contents", record.contents))),
    };
  }

  if (type === "line_item_actions") {
    return {
      ...base,
      displayConditions: JSON.stringify(parseJson(pick("displayConditions", record.displayConditions))),
      showActionsExpanded: Boolean(pick("showActionsExpanded", record.showActionsExpanded)),
      subscriptionSelector: Boolean(pick("subscriptionSelector", record.subscriptionSelector)),
      variantSelector: Boolean(pick("variantSelector", record.variantSelector)),
      quantity: Boolean(pick("quantity", record.quantity)),
      removeButton: Boolean(pick("removeButton", record.removeButton)),
    };
  }

  return base;
};

module.exports = { VALID_TYPES, parseJson, buildPayload, buildUpdatePayload };
