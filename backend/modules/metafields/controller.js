const { MetafieldDefinition, Metafield } = require("../../models/associations");
const { successResponse, errorResponse } = require("../../utils/response");
const { resolveShopForApi } = require("../../utils/shopAccess");
const { getGraphQLClient } = require("../../utils/shopify");

const getShopRecord = (req) =>
  resolveShopForApi(req.shopDomain, req.sessionToken);

const wrap = (fallback, handler) => async (req, res) => {
  try {
    await handler(req, res);
  } catch (error) {
    console.error(`${fallback}:`, error);
    errorResponse(res, error.statusCode || 500, error.message || fallback, error);
  }
};

const toSentenceCase = (str) => {
  const spaced = String(str || "").replace(/[_-]/g, " ").trim().toLowerCase();
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
};

const formatLabel = (str) => {
  if (!str) return "";
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
  const baseType = String(json.type || "").replace(/^list\./, "");
  return { ...json, typeLabel: formatLabel(baseType) };
};

const listDefinitions = wrap("Failed to list definitions", async (req, res) => {
  const shop = await getShopRecord(req);
  const { entityType } = req.query;
  if (!entityType) {
    return errorResponse(res, 400, "entityType query param is required");
  }

  const definitions = await MetafieldDefinition.findAll({
    where: { shopId: shop.id, entityType },
    order: [["pinned", "DESC"], ["updatedAt", "DESC"]],
  });

  successResponse(res, 200, "Definitions fetched successfully", {
    definitions: definitions.map(withTypeLabel),
  });
});

const createDefinition = wrap("Failed to create definition", async (req, res) => {
  const shop = await getShopRecord(req);
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

  if (!entityType || !key || !name || !type) {
    return errorResponse(res, 400, "entityType, key, name, and type are required");
  }

  const existing = await MetafieldDefinition.findOne({
    where: { shopId: shop.id, entityType, namespace, key },
  });
  if (existing) {
    return errorResponse(
      res,
      400,
      `A definition with key '${namespace}.${key}' already exists for ${entityType}`
    );
  }

  const definition = await MetafieldDefinition.create({
    shopId: shop.id,
    entityType,
    namespace,
    key,
    name,
    type,
    description,
    storefrontApiAccess,
    pinned,
    validationRulesJson,
    useAsCollectionFilter,
    useAsAnalyticsFilter,
    useAsSmartCollectionCondition,
  });

  successResponse(res, 201, "Definition created successfully", { definition });
});

const updateDefinition = wrap("Failed to update definition", async (req, res) => {
  const shop = await getShopRecord(req);
  const { id } = req.params;

  const definition = await MetafieldDefinition.findOne({
    where: { id, shopId: shop.id },
  });
  if (!definition) {
    return errorResponse(res, 404, "Definition not found");
  }

  const editableFields = [
    "name",
    "description",
    "pinned",
    "storefrontApiAccess",
    "validationRulesJson",
    "useAsCollectionFilter",
    "useAsAnalyticsFilter",
    "useAsSmartCollectionCondition",
  ];
  const updates = {};
  editableFields.forEach((field) => {
    if (req.body[field] !== undefined) updates[field] = req.body[field];
  });

  await definition.update(updates);
  successResponse(res, 200, "Definition updated successfully", { definition });
});

const deleteDefinition = wrap("Failed to delete definition", async (req, res) => {
  const shop = await getShopRecord(req);
  const { id } = req.params;

  const definition = await MetafieldDefinition.findOne({
    where: { id, shopId: shop.id },
  });
  if (!definition) {
    return errorResponse(res, 404, "Definition not found");
  }

  await definition.destroy();
  successResponse(res, 200, "Definition deleted successfully", { id });
});

const getMetafields = wrap("Failed to get metafields", async (req, res) => {
  const shop = await getShopRecord(req);
  const { entityType, entityId } = req.query;
  if (!entityType || !entityId) {
    return errorResponse(res, 400, "entityType and entityId are required");
  }

  const definitions = await MetafieldDefinition.findAll({
    where: { shopId: shop.id, entityType },
    order: [["pinned", "DESC"], ["updatedAt", "DESC"]],
  });

  const values = await Metafield.findAll({
    where: { shopId: shop.id, entityId: String(entityId) },
  });
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
  const shop = await getShopRecord(req);
  const { entityType, entityId, values } = req.body;
  if (!entityType || !entityId || !values || typeof values !== "object") {
    return errorResponse(
      res,
      400,
      "entityType, entityId, and values object are required"
    );
  }

  const saved = [];
  for (const [definitionIdStr, val] of Object.entries(values)) {
    const definitionId = parseInt(definitionIdStr, 10);
    const value = val === null || val === undefined ? null : String(val).trim();

    const definition = await MetafieldDefinition.findOne({
      where: { id: definitionId, shopId: shop.id, entityType },
    });
    if (!definition) continue;

    if (!value) {
      await Metafield.destroy({
        where: { shopId: shop.id, definitionId, entityId: String(entityId) },
      });
    } else {
      const [metafield] = await Metafield.upsert(
        { shopId: shop.id, definitionId, entityId: String(entityId), value },
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
    product: ["adminFilterable", "smartCollectionCondition", "storefront", "analytics"],
    variant: ["adminFilterable", "smartCollectionCondition", "storefront"],
    company: ["adminFilterable", "storefront"],
    customer: ["storefront"],
  };
  const caps = ENTITY_CAPS[entityType] || ["storefront"];

  const NON_FILTERABLE = ["json", "rich_text_field"];
  const SMART_TYPES = [
    "boolean",
    "number_integer",
    "number_decimal",
    "integer",
    "decimal",
    "rating",
    "single_line_text_field",
  ];
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

  return caps
    .map((c) => all[c])
    .filter((o) => o && o.eligible)
    .map(({ eligible, ...rest }) => rest);
};

const getIcon = (typeVal, category) => {
  const t = String(typeVal || "").toLowerCase();
  const c = String(category || "").toLowerCase();
  if (t.includes("multi_line_text_field")) return "paragraph";
  if (t.includes("rich_text_field")) return "rich_text";
  if (t.includes("text")) return "text";
  if (t.includes("integer") || t.includes("decimal") || t === "number") return "number";
  if (t.includes("image") || t.includes("file")) return "file";
  if (t.includes("reference")) return "reference";
  if (c.includes("measurement")) return "number";
  if (c.includes("date") || c.includes("time")) return "calendar";
  if (t.includes("url") || t.includes("link")) return "link";
  if (t === "boolean") return "boolean";
  if (t === "color") return "color";
  if (t === "language") return "language";
  if (t === "json") return "json";
  return "default";
};

const PRESETS = [
  {
    value: "choice_list",
    label: "Choice list",
    annotation: "Single line text",
    baseType: "single_line_text_field",
    group: "Text",
    icon: "text",
  },
  {
    value: "email",
    label: "Email",
    annotation: "Single line text",
    baseType: "single_line_text_field",
    group: "Text",
    icon: "text",
  },
  {
    value: "image",
    label: "Image",
    annotation: "File",
    baseType: "file_reference",
    group: "Media",
    icon: "file",
  },
  {
    value: "video",
    label: "Video",
    annotation: "File",
    baseType: "file_reference",
    group: "Media",
    icon: "file",
  },
];

const RECOMMENDED = [
  { value: "single_line_text_field", baseType: "single_line_text_field" },
  { value: "multi_line_text_field", baseType: "multi_line_text_field" },
  { value: "number_integer", baseType: "number_integer" },
  {
    value: "image",
    label: "Image",
    annotation: "File",
    baseType: "file_reference",
    icon: "file",
  },
];

const GROUP_OVERRIDES = {
  DATE_TIME: "Date and time",
  TRUE_FALSE: "True or false",
};

const SKIPPED_TYPES = ["metaobject_reference", "mixed_reference"];

const getMetafieldTypes = wrap("Failed to fetch metafield types", async (req, res) => {
  const shop = await getShopRecord(req);
  const { entityType } = req.query;
  const { graphqlClient } = getGraphQLClient({
    shopDomain: shop.myshopifyDomain,
    accessToken: shop.token,
  });

  const query = `
    query {
      metafieldDefinitionTypes {
        name
        category
        supportedValidations {
          name
          type
        }
      }
    }
  `;

  const response = await graphqlClient.request(query);
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
  if (recommended.length > 0) {
    groups.push({ group: "Recommended", items: recommended });
  }
  Object.entries(categoriesMap).forEach(([group, items]) => {
    groups.push({
      group,
      items: items.sort((a, b) => a.label.localeCompare(b.label)),
    });
  });

  successResponse(res, 200, "Metafield types fetched successfully from Shopify", {
    groups,
  });
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
