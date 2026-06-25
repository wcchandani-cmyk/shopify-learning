const { MetafieldDefinition, Metafield, Product, Variant, Customer } = require("../../models/associations");
const { successResponse, errorResponse } = require("../../utils/response");
const { getGraphQLClient } = require("../../utils/shopify");
const { handleError } = require("../../utils/controllerHelper");
const {
  DEFINITION_CREATE,
  DEFINITION_UPDATE,
  DEFINITION_DELETE,
  DEFINITION_LOOKUP,
  METAFIELDS_SET,
  METAFIELDS_DELETE,
  METAFEILD_TYPE,
} = require("./graphqlQuery");

const getClient = (shop) => getGraphQLClient({ shopDomain: shop.myshopifyDomain, accessToken: shop.token }).graphqlClient;

const wrap = (fallback, handler) => async (req, res) => {
  try {
    await handler(req, res);
  } catch (error) {
    console.error(`${fallback}:`, error);
    handleError(res, error, fallback);
  }
};

const OWNER_TYPE = { product: "PRODUCT", variant: "PRODUCTVARIANT", customer: "CUSTOMER", company: "COMPANY" };

const throwUserErrors = (errors, fallback) => {
  if (Array.isArray(errors) && errors.length) {
    const err = new Error(errors.map((e) => e?.message).filter(Boolean).join("; ") || fallback);
    err.statusCode = 422;
    throw err;
  }
};

const parseValidations = (json) => {
  if (!json) return [];
  try {
    const arr = typeof json === "string" ? JSON.parse(json) : json;
    return Array.isArray(arr) ? arr.filter((r) => r?.name) : [];
  } catch {
    return [];
  }
};

const resolveOwnerGid = async (shop, entityType, entityId) => {
  const raw = String(entityId ?? "").trim();
  if (!raw || raw === "new" || raw === "0") return null;
  if (raw.startsWith("gid://")) return raw;
  if (entityType === "company") return `gid://shopify/Company/${raw}`;

  if (entityType === "product") {
    const product = await Product.findOne({ where: { id: raw, shopId: shop.id } });
    return product ? `gid://shopify/Product/${product.shopifyId}` : null;
  }
  if (entityType === "variant") {
    const variant = await Variant.findOne({
      where: { id: raw },
      include: [{ model: Product, as: "product", where: { shopId: shop.id }, attributes: [] }],
    });
    return variant ? `gid://shopify/ProductVariant/${variant.shopifyId}` : null;
  }
  if (entityType === "customer") {
    const customer = await Customer.findOne({ where: { id: raw, shopId: shop.id } });
    return customer ? `gid://shopify/Customer/${customer.shopifyId}` : null;
  }
  return null;
};

const buildDefinitionInput = (def, { includeType }) => {
  const input = {
    name: def.name,
    namespace: def.namespace || "custom",
    key: def.key,
    ownerType: OWNER_TYPE[def.entityType],
    description: def.description || "",
    pin: !!def.pinned,
  };
  if (includeType) input.type = def.type;

  const validations = parseValidations(def.validationRulesJson);
  const uniqueRule = validations.find((v) => v.name === "unique_values");
  const realValidations = validations.filter((v) => v.name !== "unique_values");
  if (realValidations.length) input.validations = realValidations;

  const capabilityByField = { useAsCollectionFilter: "adminFilterable", useAsSmartCollectionCondition: "smartCollectionCondition" };
  const capabilities = {};
  let storefrontEligible = false;

  getCapabilityOptions(def.type, def.entityType).forEach((opt) => {
    if (opt.field === "storefrontApiAccess") {
      storefrontEligible = true;
      return;
    }
    const capKey = capabilityByField[opt.field];
    if (capKey) capabilities[capKey] = { enabled: !!def[opt.field] };
  });

  if (uniqueRule) capabilities.uniqueValues = { enabled: uniqueRule.value === "true" || uniqueRule.value === true };
  if (Object.keys(capabilities).length) input.capabilities = capabilities;
  if (storefrontEligible) input.access = { storefront: def.storefrontApiAccess ? "PUBLIC_READ" : "NONE" };

  return input;
};

const lookupDefinitionId = async (client, { entityType, namespace, key }) => {
  const ownerType = OWNER_TYPE[entityType];
  if (!ownerType) return null;
  const response = await client.request(DEFINITION_LOOKUP, { variables: { ownerType, namespace: namespace || "custom", key } });
  return response?.data?.metafieldDefinitions?.nodes?.[0]?.id || null;
};

const createShopifyDefinition = async (client, def) => {
  const response = await client.request(DEFINITION_CREATE, { variables: { definition: buildDefinitionInput(def, { includeType: true }) } });
  const payload = response?.data?.metafieldDefinitionCreate;
  throwUserErrors(payload?.userErrors, "Failed to create metafield definition in Shopify");

  const id = payload?.createdDefinition?.id;
  if (!id) throw new Error("Shopify did not return a metafield definition id");
  return id;
};

const ensureShopifyDefinition = async (client, definition) => {
  if (definition.shopifyId) return definition.shopifyId;
  const shopifyId = (await lookupDefinitionId(client, definition)) || (await createShopifyDefinition(client, definition));
  await definition.update({ shopifyId });
  return shopifyId;
};

const toSentenceCase = (str) => {
  const spaced = String(str || "").replace(/[_-]/g, " ").trim().toLowerCase();
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
};

const formatLabel = (str) => {
  const overrides = {
    single_line_text_field: "Single-line text",
    multi_line_text_field: "Multi-line text",
    rich_text_field: "Rich text",
    number_integer: "Integer",
    number_decimal: "Decimal",
    url: "URL",
    json: "JSON",
    id: "ID",
  };
  return overrides[str] || toSentenceCase(str);
};

const withTypeLabel = (def) => {
  const json = typeof def?.toJSON === "function" ? def.toJSON() : def;
  return { ...json, typeLabel: formatLabel(String(json.type || "").replace(/^list\./, "")) };
};

const listDefinitions = wrap("Failed to list definitions", async (req, res) => {
  const { entityType } = req.query;
  if (!entityType) return errorResponse(res, 400, "entityType query param is required");

  const definitions = await MetafieldDefinition.findAll({
    where: { shopId: req.shop.id, entityType },
    order: [["pinned", "DESC"], ["updatedAt", "DESC"]],
  });

  successResponse(res, 200, "Definitions fetched successfully", { definitions: definitions.map(withTypeLabel) });
});

const createDefinition = wrap("Failed to create definition", async (req, res) => {
  const shop = req.shop;
  const {
    entityType,
    namespace = "custom",
    key,
    name,
    type,
    description = "",
    storefrontApiAccess = false,
    pinned = true,
    validationRulesJson = null,
    useAsCollectionFilter = false,
    useAsAnalyticsFilter = false,
    useAsSmartCollectionCondition = false,
  } = req.body;

  if (!entityType || !key || !name || !type) return errorResponse(res, 400, "entityType, key, name, and type are required");

  const existing = await MetafieldDefinition.findOne({ where: { shopId: shop.id, entityType, namespace, key } });
  if (existing) return errorResponse(res, 400, `A definition with key '${namespace}.${key}' already exists for ${entityType}`);

  const defData = {
    entityType, namespace, key, name, type, description, storefrontApiAccess, pinned,
    validationRulesJson, useAsCollectionFilter, useAsAnalyticsFilter, useAsSmartCollectionCondition,
  };

  const client = getClient(shop);
  const shopifyId = (await lookupDefinitionId(client, defData)) || (await createShopifyDefinition(client, defData));
  const definition = await MetafieldDefinition.create({ shopId: shop.id, shopifyId, ...defData });

  successResponse(res, 201, "Definition created successfully", { definition });
});

const updateDefinition = wrap("Failed to update definition", async (req, res) => {
  const shop = req.shop;
  const definition = await MetafieldDefinition.findOne({ where: { id: req.params.id, shopId: shop.id } });
  if (!definition) return errorResponse(res, 404, "Definition not found");

  const updates = {};
  [
    "name", "description", "pinned", "storefrontApiAccess", "validationRulesJson",
    "useAsCollectionFilter", "useAsAnalyticsFilter", "useAsSmartCollectionCondition",
  ].forEach((field) => {
    if (req.body[field] !== undefined) updates[field] = req.body[field];
  });

  const client = getClient(shop);
  await ensureShopifyDefinition(client, definition);

  const response = await client.request(DEFINITION_UPDATE, {
    variables: { definition: buildDefinitionInput({ ...definition.toJSON(), ...updates }, { includeType: false }) },
  });
  throwUserErrors(response?.data?.metafieldDefinitionUpdate?.userErrors, "Failed to update metafield definition in Shopify");

  await definition.update(updates);
  successResponse(res, 200, "Definition updated successfully", { definition });
});

const deleteDefinition = wrap("Failed to delete definition", async (req, res) => {
  const shop = req.shop;
  const definition = await MetafieldDefinition.findOne({ where: { id: req.params.id, shopId: shop.id } });
  if (!definition) return errorResponse(res, 404, "Definition not found");

  const client = getClient(shop);
  const shopifyId = definition.shopifyId || (await lookupDefinitionId(client, definition));
  if (shopifyId) {
    const response = await client.request(DEFINITION_DELETE, { variables: { id: shopifyId, deleteAllAssociatedMetafields: true } });
    throwUserErrors(response?.data?.metafieldDefinitionDelete?.userErrors, "Failed to delete metafield definition in Shopify");
  }

  await definition.destroy();
  successResponse(res, 200, "Definition deleted successfully", { id: req.params.id });
});

const getMetafields = wrap("Failed to get metafields", async (req, res) => {
  const shop = req.shop;
  const { entityType, entityId } = req.query;
  if (!entityType || !entityId) return errorResponse(res, 400, "entityType and entityId are required");

  const definitions = await MetafieldDefinition.findAll({
    where: { shopId: shop.id, entityType },
    order: [["pinned", "DESC"], ["updatedAt", "DESC"]],
  });

  const values = await Metafield.findAll({ where: { shopId: shop.id, entityId: String(entityId) } });
  const valuesMap = new Map(values.map((v) => [v.definitionId, v]));

  const metafields = definitions.map((definition) => {
    const record = valuesMap.get(definition.id);
    return {
      definition: withTypeLabel(definition),
      value: record ? record.value : null,
      metafieldId: record ? record.id : null,
    };
  });

  successResponse(res, 200, "Metafields fetched successfully", { metafields });
});

const saveMetafields = wrap("Failed to save metafields", async (req, res) => {
  const shop = req.shop;
  const { entityType, entityId, values } = req.body;
  if (!entityType || !entityId || !values || typeof values !== "object") {
    return errorResponse(res, 400, "entityType, entityId, and values object are required");
  }

  const ownerId = await resolveOwnerGid(shop, entityType, entityId);
  if (!ownerId) {
    return errorResponse(res, 400, "Could not resolve the Shopify owner for this entity. Save the record first.");
  }

  const client = getClient(shop);
  const toSet = [];
  const toDelete = [];
  const dbOps = [];

  for (const [definitionIdStr, val] of Object.entries(values)) {
    const definitionId = parseInt(definitionIdStr, 10);
    const value = val === null || val === undefined ? null : String(val).trim();

    const definition = await MetafieldDefinition.findOne({ where: { id: definitionId, shopId: shop.id, entityType } });
    if (!definition) continue;

    await ensureShopifyDefinition(client, definition);

    if (!value) {
      toDelete.push({ ownerId, namespace: definition.namespace, key: definition.key });
      dbOps.push({ kind: "delete", definitionId });
    } else {
      toSet.push({ ownerId, namespace: definition.namespace, key: definition.key, type: definition.type, value });
      dbOps.push({ kind: "set", definitionId, value });
    }
  }

  if (toSet.length) {
    const response = await client.request(METAFIELDS_SET, { variables: { metafields: toSet } });
    throwUserErrors(response?.data?.metafieldsSet?.userErrors, "Failed to save metafields in Shopify");
  }
  if (toDelete.length) {
    const response = await client.request(METAFIELDS_DELETE, { variables: { metafields: toDelete } });
    throwUserErrors(response?.data?.metafieldsDelete?.userErrors, "Failed to clear metafields in Shopify");
  }

  const saved = [];
  for (const op of dbOps) {
    if (op.kind === "delete") {
      await Metafield.destroy({ where: { shopId: shop.id, definitionId: op.definitionId, entityId: String(entityId) } });
    } else {
      const [metafield] = await Metafield.upsert(
        { shopId: shop.id, definitionId: op.definitionId, entityId: String(entityId), value: op.value },
        { conflictFields: ["shopId", "definitionId", "entityId"] }
      );
      saved.push(metafield);
    }
  }

  successResponse(res, 200, "Metafields saved successfully", { saved });
});

const getCapabilityOptions = (typeName, entityType) => {
  const baseType = String(typeName || "").replace(/^list\./, "");
  const ENTITY_CAPS = {
    product: ["adminFilterable", "smartCollectionCondition", "storefront"],
    variant: ["adminFilterable", "smartCollectionCondition", "storefront"],
    company: ["adminFilterable", "storefront"],
    customer: ["storefront"],
  };
  const caps = ENTITY_CAPS[entityType] || ["storefront"];
  const NON_FILTERABLE = ["json", "rich_text_field"];
  const SMART_TYPES = ["boolean", "number_integer", "number_decimal", "integer", "decimal", "rating", "single_line_text_field"];
  const resourceLabel = entityType || "resource";

  const all = {
    adminFilterable: {
      key: "adminFilterable",
      field: "useAsCollectionFilter",
      label: `Filter on the ${resourceLabel} list and in the Admin API`,
      eligible: !NON_FILTERABLE.includes(baseType),
    },
    smartCollectionCondition: {
      key: "smartCollectionCondition",
      field: "useAsSmartCollectionCondition",
      label: "Use as a condition in smart collections",
      eligible: SMART_TYPES.includes(baseType),
    },
    storefront: {
      key: "storefront",
      field: "storefrontApiAccess",
      label: "Storefront API access",
      eligible: true,
    },
    analytics: {
      key: "analytics",
      field: "useAsAnalyticsFilter",
      label: "Filter or group data in Analytics",
      eligible: !NON_FILTERABLE.includes(baseType),
    },
  };

  return caps.map((c) => all[c]).filter((o) => o && o.eligible).map(({ eligible, ...rest }) => rest);
};

const getIcon = (typeVal, category) => {
  const t = String(typeVal || "").toLowerCase();
  const c = String(category || "").toLowerCase();
  return t.includes("multi_line_text_field") ? "paragraph"
    : t.includes("rich_text_field") ? "rich_text"
    : t.includes("text") ? "text"
    : t.includes("integer") || t.includes("decimal") || t === "number" ? "number"
    : t.includes("image") || t.includes("file") ? "file"
    : t.includes("reference") ? "reference"
    : c.includes("measurement") ? "number"
    : c.includes("date") || c.includes("time") ? "calendar"
    : t.includes("url") || t.includes("link") ? "link"
    : t === "boolean" ? "boolean"
    : t === "color" ? "color"
    : t === "language" ? "language"
    : t === "json" ? "json"
    : "default";
};

const PRESETS = [
  { value: "choice_list", label: "Choice list", annotation: "Single line text", baseType: "single_line_text_field", group: "Text", icon: "text" },
  { value: "email", label: "Email", annotation: "Single line text", baseType: "single_line_text_field", group: "Text", icon: "text" },
  { value: "image", label: "Image", annotation: "File", baseType: "file_reference", group: "Media", icon: "file" },
  { value: "video", label: "Video", annotation: "File", baseType: "file_reference", group: "Media", icon: "file" },
];

const RECOMMENDED = [
  { value: "single_line_text_field", baseType: "single_line_text_field" },
  { value: "multi_line_text_field", baseType: "multi_line_text_field" },
  { value: "number_integer", baseType: "number_integer" },
  { value: "image", label: "Image", annotation: "File", baseType: "file_reference", icon: "file" },
];

const GROUP_OVERRIDES = { DATE_TIME: "Date and time", TRUE_FALSE: "True or false" };
const SKIPPED_TYPES = ["metaobject_reference", "mixed_reference"];

const getMetafieldTypes = wrap("Failed to fetch metafield types", async (req, res) => {
  const shop = req.shop;
  const { entityType } = req.query;
  const { graphqlClient } = getGraphQLClient({ shopDomain: shop.myshopifyDomain, accessToken: shop.token });

  const response = await graphqlClient.request(METAFEILD_TYPE);
  const types = response?.data?.metafieldDefinitionTypes || [];

  const findType = (name) => types.find((t) => t.name === name);
  const groupName = (str) => GROUP_OVERRIDES[str] || toSentenceCase(str);

  const buildItem = (cfg) => {
    const base = findType(cfg.baseType);
    if (!base) return null;
    return {
      value: cfg.value,
      label: cfg.label || formatLabel(cfg.baseType),
      annotation: cfg.annotation,
      baseType: cfg.baseType,
      icon: cfg.icon || getIcon(cfg.baseType, base.category),
      validations: base.supportedValidations || [],
      options: getCapabilityOptions(cfg.baseType, entityType),
      supportsList: types.some((t) => t.name === `list.${cfg.baseType}`),
    };
  };

  const categoriesMap = {};
  types.forEach(({ name, category }) => {
    if (name.startsWith("list.") || SKIPPED_TYPES.includes(name)) return;
    const label = groupName(category || "other");
    (categoriesMap[label] ||= []).push(buildItem({ value: name, baseType: name }));
  });

  PRESETS.forEach((preset) => {
    const item = buildItem(preset);
    if (item) (categoriesMap[preset.group] ||= []).push(item);
  });

  const groups = [];
  const recommended = RECOMMENDED.map(buildItem).filter(Boolean);
  if (recommended.length > 0) groups.push({ group: "Recommended", items: recommended });

  Object.entries(categoriesMap).forEach(([group, items]) => {
    groups.push({ group, items: items.sort((a, b) => a.label.localeCompare(b.label)) });
  });

  successResponse(res, 200, "Metafield types fetched successfully from Shopify", { groups });
});

module.exports = {
  listDefinitions,
  createDefinition,
  updateDefinition,
  deleteDefinition,
  getMetafields,
  saveMetafields,
  getMetafieldTypes,
};
