const { Op } = require("sequelize");
const Product = require("./model");
const Variant = require("../variant/model");
const { successResponse, errorResponse } = require("../../utils/response");
const { getRestClient, getGraphQLClient } = require("../../utils/shopify");
const {
  resolveShopForApi,
  isShopifyUnauthorized,
} = require("../../utils/shopAccess");
const {
  upsertProductWithVariants,
  mapWebhookProduct,
  normalizeProductStatus,
} = require("./productService");
const {
  PRODUCT_SET_MUTATION,
  TAXONOMY_SEARCH_QUERY,
  PRODUCT_TYPES_QUERY,
  PRODUCT_VENDORS_QUERY,
} = require("./queries");

const DEFAULT_PAGE_SIZE = 10;
const MAX_PAGE_SIZE = 50;

const parsePageSize = (value) =>
  Math.min(
    MAX_PAGE_SIZE,
    Math.max(1, parseInt(value, 10) || DEFAULT_PAGE_SIZE)
  );

const getShopRecord = async (req) =>
  resolveShopForApi(req.shopDomain, req.sessionToken);

// ---------------------------------------------------------------------------
// Product type helpers
// ---------------------------------------------------------------------------

// Distinct values for a free-text product column from our synced DB (fallback).
const fetchDbProductColumn = async (shopId, column) => {
  const rows = await Product.findAll({
    attributes: [column],
    where: {
      shopId,
      [column]: {
        [Op.and]: [{ [Op.ne]: null }, { [Op.ne]: "" }],
      },
    },
    group: [column],
    order: [[column, "ASC"]],
    raw: true,
  });

  return rows.map((row) => String(row[column] || "").trim()).filter(Boolean);
};

// Walk a Shopify StringConnection (productTypes / productVendors) to the end
// and return every value. These are free-text fields, so the only source of
// truth is the values currently assigned to products in the store.
const fetchShopifyStringConnection = async (shop, query, rootField) => {
  const { graphqlClient } = getGraphQLClient({
    shopDomain: shop.myshopifyDomain,
    accessToken: shop.token,
  });

  const values = [];
  let after = null;

  // Safety cap on pages (1000 * 20 = 20k values) to avoid an infinite loop.
  for (let page = 0; page < 20; page += 1) {
    const response = await graphqlClient.request(query, {
      variables: { first: 250, after },
    });

    if (response?.errors) {
      const message = Array.isArray(response.errors)
        ? response.errors.map((error) => error.message).join("; ")
        : response.errors.message || "Shopify GraphQL error";
      throw new Error(`${rootField}: ${message}`);
    }

    const connection = response?.data?.[rootField];
    values.push(...(connection?.nodes || []));

    if (!connection?.pageInfo?.hasNextPage) break;
    after = connection.pageInfo.endCursor;
  }

  return values.map((value) => String(value || "").trim()).filter(Boolean);
};

const fetchAllProductTypes = async (shop) => {
  try {
    const live = await fetchShopifyStringConnection(
      shop,
      PRODUCT_TYPES_QUERY,
      "productTypes"
    );
    if (live.length) return live;
  } catch (error) {
    console.error(
      "Live product types fetch failed, falling back to DB:",
      error.message
    );
  }
  return fetchDbProductColumn(shop.id, "productType");
};

const fetchAllProductVendors = async (shop) => {
  try {
    const live = await fetchShopifyStringConnection(
      shop,
      PRODUCT_VENDORS_QUERY,
      "productVendors"
    );
    if (live.length) return live;
  } catch (error) {
    console.error(
      "Live product vendors fetch failed, falling back to DB:",
      error.message
    );
  }
  return fetchDbProductColumn(shop.id, "vendor");
};

const withProductTypes = async (product, shop) => {
  const payload =
    typeof product.toJSON === "function" ? product.toJSON() : { ...product };
  payload.availableProductTypes = await fetchAllProductTypes(shop);
  return payload;
};

const loadProductWithVariants = (productId, shopId) =>
  Product.findOne({
    where: { id: productId, shopId },
    include: [{ model: Variant, as: "variants" }],
    order: [[{ model: Variant, as: "variants" }, "position", "ASC"]],
  });

// ---------------------------------------------------------------------------
// Options / image / inventory helpers (product flow only)
// ---------------------------------------------------------------------------

const variantPayloadKey = (variant) =>
  [variant.option1, variant.option2, variant.option3]
    .map((value) =>
      String(value || "")
        .trim()
        .toLowerCase()
    )
    .join("|");

function parseOptionsJson(optionsJson) {
  if (!optionsJson) return null;
  try {
    const parsed =
      typeof optionsJson === "string" ? JSON.parse(optionsJson) : optionsJson;
    if (!Array.isArray(parsed) || !parsed.length) return null;

    const normalized = parsed
      .map((option) => {
        const name = String(option?.name || "").trim();
        const values = Array.isArray(option?.values)
          ? option.values.map((v) => String(v).trim()).filter(Boolean)
          : [];
        if (!name || !values.length) return null;
        return { name, values };
      })
      .filter(Boolean);

    return normalized.length ? normalized : null;
  } catch {
    return null;
  }
}

function parseDataImageUrl(imageUrl) {
  if (
    !imageUrl ||
    typeof imageUrl !== "string" ||
    !imageUrl.startsWith("data:")
  ) {
    return null;
  }

  const match = imageUrl.match(/^data:([^;]+);base64,(.+)$/s);
  if (!match) return null;

  const mime = match[1];
  const ext = (mime.split("/")[1] || "png").replace(/[^a-z0-9]/gi, "") || "png";
  return {
    attachment: match[2],
    filename: `product.${ext}`,
  };
}

function buildSingleShopifyImage(image, fallbackAlt) {
  const alt = image.alt || fallbackAlt || "Product";

  const attachmentData = image.attachment?.data || image.data;
  if (attachmentData) {
    return {
      attachment: String(attachmentData),
      filename: image.attachment?.filename || image.filename || "product.png",
      alt,
    };
  }

  const fromDataUrl = parseDataImageUrl(image.src);
  if (fromDataUrl) {
    return { ...fromDataUrl, alt };
  }

  if (image.src && /^https?:\/\//i.test(image.src)) {
    return { src: image.src, alt };
  }

  return null;
}

function buildShopifyProductImages(payload) {
  const fallbackAlt = payload.title || "Product";

  // Preferred: full gallery array from the form.
  if (Array.isArray(payload.images)) {
    const built = payload.images
      .map((image) => buildSingleShopifyImage(image, fallbackAlt))
      .filter(Boolean);
    return built.length ? built : null;
  }

  // Backward compatible single-image payload.
  const single = buildSingleShopifyImage(
    {
      attachment: payload.imageAttachment,
      src: payload.imageUrl,
      alt: payload.imageAlt,
    },
    fallbackAlt
  );
  return single ? [single] : null;
}

function parsePayloadInventoryQuantity(variantData) {
  if (variantData.inventoryQuantity === undefined) return null;
  return parseInt(variantData.inventoryQuantity, 10) || 0;
}

const locationIdByShop = new Map();

async function getPrimaryLocationId(client, shopDomain) {
  if (locationIdByShop.has(shopDomain)) {
    return locationIdByShop.get(shopDomain);
  }

  const response = await client.get({
    path: "locations",
    query: { limit: 1 },
  });

  const location = response.body?.locations?.[0];
  if (!location?.id) {
    throw new Error("No Shopify location found for inventory");
  }

  locationIdByShop.set(shopDomain, location.id);
  return location.id;
}

async function fetchInventoryItemId(client, shopifyVariantId) {
  const response = await client.get({
    path: `variants/${shopifyVariantId}`,
  });
  return response.body?.variant?.inventory_item_id ?? null;
}

/**
 * Shopify no longer accepts inventory_quantity on variant create/update.
 * Use Inventory Level API to set available stock at the primary location.
 */
async function setVariantInventoryAvailable(shop, shopifyVariantId, available) {
  const quantity = parseInt(available, 10);
  if (!Number.isFinite(quantity) || quantity < 0) return false;

  const client = getRestClient(shop);

  try {
    const inventoryItemId = await fetchInventoryItemId(
      client,
      shopifyVariantId
    );
    if (!inventoryItemId) return false;

    const locationId = await getPrimaryLocationId(client, shop.myshopifyDomain);

    await client.post({
      path: "inventory_levels/set",
      type: "application/json",
      data: {
        location_id: locationId,
        inventory_item_id: inventoryItemId,
        available: quantity,
      },
    });

    return true;
  } catch (error) {
    console.warn(
      `[inventory] Could not set quantity for variant ${shopifyVariantId}:`,
      error.message
    );
    return false;
  }
}

function findVariantRowForPayload(rows, payloadVariant) {
  const variantId = parseInt(payloadVariant.id, 10);
  if (Number.isInteger(variantId) && variantId > 0) {
    const byId = rows.find((row) => Number(row.id) === variantId);
    if (byId) return byId;
  }

  const key = variantPayloadKey(payloadVariant);
  return rows.find((row) => variantPayloadKey(row) === key) || null;
}

/** Always write form quantities to DB (Shopify sync/webhooks often return 0). */
async function persistPayloadInventoryToDb(productId, payloadVariants = []) {
  if (!payloadVariants.length) return;

  const rows = await Variant.findAll({
    where: { productId },
    order: [["position", "ASC"]],
  });

  for (const payloadVariant of payloadVariants) {
    const qty = parsePayloadInventoryQuantity(payloadVariant);
    if (qty === null) continue;

    const row = findVariantRowForPayload(rows, payloadVariant);
    if (!row) continue;

    await Variant.update(
      { inventoryQuantity: qty },
      { where: { id: row.id, productId } }
    );
  }
}

/** Set stock on Shopify, then mirror the same quantity in DB. */
async function applyInventoryFromPayload(
  shop,
  productId,
  payloadVariants = []
) {
  if (!payloadVariants.length) return;

  const rows = await Variant.findAll({
    where: { productId },
    order: [["position", "ASC"]],
  });

  for (const payloadVariant of payloadVariants) {
    const qty = parsePayloadInventoryQuantity(payloadVariant);
    if (qty === null) continue;

    const row = findVariantRowForPayload(rows, payloadVariant);
    if (!row?.shopifyId) continue;

    await setVariantInventoryAvailable(shop, row.shopifyId, qty);
    await Variant.update(
      { inventoryQuantity: qty },
      { where: { id: row.id, productId } }
    );
  }
}

// ---------------------------------------------------------------------------
// Product Shopify + DB operations
// ---------------------------------------------------------------------------

function defaultVariantRow(template) {
  return {
    title: "Default Title",
    sku: "",
    price: template?.price != null ? String(template.price) : "0.00",
    inventoryQuantity:
      template?.inventoryQuantity != null
        ? parseInt(template.inventoryQuantity, 10) || 0
        : 0,
    option1: "Default Title",
    option2: null,
    option3: null,
    isNew: true,
  };
}

/** Shopify cannot set product options to []; ensure at least one variant with option1. */
function normalizePayloadForShopify(payload) {
  const variants = Array.isArray(payload.variants) ? [...payload.variants] : [];
  const options = parseOptionsJson(payload.optionsJson);
  const template = variants[0];

  let nextVariants = variants.filter((variant) => {
    const option1 = String(variant.option1 || variant.title || "").trim();
    return Boolean(option1);
  });

  if (!nextVariants.length) {
    nextVariants = [defaultVariantRow(template)];
  }

  return {
    ...payload,
    optionsJson: options ? payload.optionsJson : null,
    variants: nextVariants,
  };
}

async function applyPayloadOverridesToDb(productId, payload) {
  const updates = {};
  if (payload.optionsJson !== undefined) {
    updates.optionsJson = payload.optionsJson || null;
  }
  if (payload.categoryId !== undefined) {
    updates.categoryId = payload.categoryId || null;
    updates.categoryName = payload.categoryName || null;
  }
  if (Object.keys(updates).length) {
    await Product.update(updates, { where: { id: productId } });
  }
}

const DEFAULT_OPTION_NAME = "Title";
const DEFAULT_OPTION_VALUE = "Default Title";

function toProductGid(shopifyId) {
  const id = String(shopifyId || "").trim();
  return id.startsWith("gid://") ? id : `gid://shopify/Product/${id}`;
}

function gidToNumericId(gid) {
  const match = String(gid || "").match(/(\d+)$/);
  return match ? match[1] : null;
}

function splitTagsToArray(tags) {
  if (Array.isArray(tags)) {
    return tags.map((tag) => String(tag).trim()).filter(Boolean);
  }
  return String(tags || "")
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

function buildVariantSetInput(variant, optionNames) {
  const values = [variant.option1, variant.option2, variant.option3];

  const optionValues = optionNames.length
    ? optionNames.map((name, index) => ({
        optionName: name,
        name: String(values[index] || "").trim() || DEFAULT_OPTION_VALUE,
      }))
    : [
        {
          optionName: DEFAULT_OPTION_NAME,
          name:
            String(variant.option1 || variant.title || "").trim() ||
            DEFAULT_OPTION_VALUE,
        },
      ];

  const input = { optionValues };
  if (variant.price != null && variant.price !== "") {
    input.price = String(variant.price);
  }
  if (variant.sku) {
    input.sku = String(variant.sku).trim();
  }
  return input;
}

function buildProductSetInput(payload, { productGid } = {}) {
  const options = parseOptionsJson(payload.optionsJson);

  const input = {
    title: String(payload.title || "").trim(),
    descriptionHtml: payload.bodyHtml || "",
    vendor: payload.vendor || "",
    productType: payload.productType || "",
    tags: splitTagsToArray(payload.tags),
    status: (normalizeProductStatus(payload.status) || "draft").toUpperCase(),
  };

  if (productGid) input.id = productGid;
  if (payload.handle) input.handle = String(payload.handle).trim();
  if (payload.templateSuffix !== undefined) {
    input.templateSuffix = payload.templateSuffix || null;
  }
  if (payload.categoryId !== undefined) {
    input.category = payload.categoryId
      ? String(payload.categoryId).trim()
      : null;
  }

  let optionNames = [];
  if (options?.length) {
    optionNames = options.map((option) => option.name);
    input.productOptions = options.map((option, index) => ({
      name: option.name,
      position: index + 1,
      values: option.values.map((value) => ({ name: value })),
    }));
  } else {
    input.productOptions = [
      {
        name: DEFAULT_OPTION_NAME,
        position: 1,
        values: [{ name: DEFAULT_OPTION_VALUE }],
      },
    ];
  }

  const allVariants = Array.isArray(payload.variants) ? payload.variants : [];
  const sourceVariants = optionNames.length
    ? allVariants
    : allVariants.slice(0, 1);
  const variants = sourceVariants.length
    ? sourceVariants
    : [defaultVariantRow()];

  input.variants = variants.map((variant) =>
    buildVariantSetInput(variant, optionNames)
  );

  return input;
}

async function runProductSet(shop, input) {
  const { graphqlClient } = getGraphQLClient({
    shopDomain: shop.myshopifyDomain,
    accessToken: shop.token,
  });

  const response = await graphqlClient.request(PRODUCT_SET_MUTATION, {
    variables: { input, synchronous: true },
  });

  if (response?.errors) {
    const message = Array.isArray(response.errors)
      ? response.errors.map((error) => error.message).join("; ")
      : response.errors.message || "Shopify GraphQL error";
    const err = new Error(message);
    err.statusCode = 502;
    throw err;
  }

  const result = response?.data?.productSet;
  const userErrors = result?.userErrors || [];
  if (userErrors.length) {
    const err = new Error(
      userErrors.map((error) => error.message).join("; ") ||
        "Shopify rejected the product"
    );
    err.statusCode = 422;
    throw err;
  }

  const productId = result?.product?.id;
  if (!productId) {
    const err = new Error("Shopify did not return the product");
    err.statusCode = 502;
    throw err;
  }
  return productId;
}

async function applyProductImagesRest(shop, shopifyProductId, payload) {
  const images = buildShopifyProductImages(payload);
  if (!images) return;

  const client = getRestClient(shop);
  await client.put({
    path: `products/${shopifyProductId}`,
    type: "application/json",
    data: { product: { id: Number(shopifyProductId), images } },
  });
}

async function syncProductFromShopify(shop, shopifyProductId) {
  const client = getRestClient(shop);
  const response = await client.get({
    path: `products/${shopifyProductId}`,
  });

  const restProduct = response.body?.product;
  if (!restProduct?.id) {
    const err = new Error("Product not found on Shopify");
    err.statusCode = 404;
    throw err;
  }

  const productNode = mapWebhookProduct(restProduct);
  const product = await upsertProductWithVariants(shop, productNode);
  return loadProductWithVariants(product.id, shop.id);
}

async function createProductOnShopifyAndDb(shop, payload) {
  const normalizedPayload = normalizePayloadForShopify(payload);

  const title = String(normalizedPayload.title || "").trim();
  if (!title) {
    const err = new Error("Product title is required");
    err.statusCode = 400;
    throw err;
  }

  const input = buildProductSetInput(normalizedPayload);
  const productGid = await runProductSet(shop, input);
  const shopifyProductId = gidToNumericId(productGid);

  await applyProductImagesRest(shop, shopifyProductId, {
    ...normalizedPayload,
    title,
  });

  const saved = await syncProductFromShopify(shop, shopifyProductId);
  await applyPayloadOverridesToDb(saved.id, normalizedPayload);
  await applyInventoryFromPayload(shop, saved.id, normalizedPayload.variants);
  await persistPayloadInventoryToDb(saved.id, normalizedPayload.variants);
  return loadProductWithVariants(saved.id, shop.id);
}

async function createProductFlow(shop, payload) {
  return createProductOnShopifyAndDb(shop, payload);
}

async function updateProductFlow(shop, product, payload) {
  const normalizedPayload = normalizePayloadForShopify(payload);
  const variants = normalizedPayload.variants;

  await applyPayloadOverridesToDb(product.id, normalizedPayload);

  const input = buildProductSetInput(normalizedPayload, {
    productGid: toProductGid(product.shopifyId),
  });
  await runProductSet(shop, input);

  await applyProductImagesRest(shop, product.shopifyId, normalizedPayload);

  await syncProductFromShopify(shop, product.shopifyId);

  await applyPayloadOverridesToDb(product.id, normalizedPayload);
  await applyInventoryFromPayload(shop, product.id, variants);
  await persistPayloadInventoryToDb(product.id, variants);

  return loadProductWithVariants(product.id, shop.id);
}

async function deleteProductsFlow(shop, productIds) {
  const ids = Array.isArray(productIds)
    ? [
        ...new Set(
          productIds.map((id) => parseInt(id, 10)).filter((id) => id > 0)
        ),
      ]
    : [];

  if (!ids.length) {
    const err = new Error("No valid product ids to delete");
    err.statusCode = 400;
    throw err;
  }

  const products = await Product.findAll({
    where: { id: ids, shopId: shop.id },
  });

  if (!products.length) {
    const err = new Error("No matching products found");
    err.statusCode = 404;
    throw err;
  }

  const client = getRestClient(shop);
  const deletedIds = [];

  for (const product of products) {
    await client.delete({
      path: `products/${product.shopifyId}`,
    });
    deletedIds.push(product.id);
  }

  await Product.destroy({
    where: { id: deletedIds, shopId: shop.id },
  });

  return { deletedCount: deletedIds.length, deletedIds };
}

const listProducts = async (req, res) => {
  try {
    const shop = await getShopRecord(req);

    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = parsePageSize(req.query.limit);
    const offset = (page - 1) * limit;

    const { count: total, rows: idRows } = await Product.findAndCountAll({
      where: { shopId: shop.id },
      attributes: ["id"],
      order: [["updatedAt", "DESC"]],
      limit,
      offset,
    });

    const ids = idRows.map((row) => row.id);
    let products = [];

    if (ids.length > 0) {
      const rows = await Product.findAll({
        where: { id: ids },
        include: [{ model: Variant, as: "variants" }],
        order: [[{ model: Variant, as: "variants" }, "position", "ASC"]],
      });
      const byId = new Map(rows.map((p) => [p.id, p]));
      products = ids.map((id) => byId.get(id)).filter(Boolean);
    }

    const totalPages = Math.max(1, Math.ceil(total / limit));
    const pageProducts = products.slice(0, limit);

    console.log(
      `[list] page=${page} limit=${limit} returned=${pageProducts.length} totalInDb=${total}`
    );

    const productTypes = await fetchAllProductTypes(shop);

    successResponse(res, 200, "Products fetched successfully", {
      returnedCount: pageProducts.length,
      products: pageProducts,
      productTypes,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    });
  } catch (error) {
    console.error("Error listing products:", error);
    const status = error.statusCode || 500;
    errorResponse(
      res,
      status,
      error.message || "Failed to list products",
      error
    );
  }
};

const deleteProducts = async (req, res) => {
  try {
    const shop = await getShopRecord(req);
    const ids = Array.isArray(req.body?.ids) ? req.body.ids : [];
    const result = await deleteProductsFlow(shop, ids);

    successResponse(res, 200, "Products deleted successfully", result);
  } catch (error) {
    console.error("Error deleting products:", error);
    if (isShopifyUnauthorized(error)) {
      return errorResponse(
        res,
        401,
        "Shopify session expired. Reload the app from Shopify admin and try again.",
        error
      );
    }
    const status = error.statusCode || 500;
    errorResponse(
      res,
      status,
      error.message || "Failed to delete products",
      error
    );
  }
};

const createProduct = async (req, res) => {
  try {
    const shop = await getShopRecord(req);
    const created = await createProductFlow(shop, req.body);
    const payload = await withProductTypes(created, shop);
    successResponse(res, 201, "Product created successfully", payload);
  } catch (error) {
    console.error("Error creating product:", error);
    if (isShopifyUnauthorized(error)) {
      return errorResponse(
        res,
        401,
        "Shopify session expired. Reload the app from Shopify admin and try again.",
        error
      );
    }
    const status = error.statusCode || 500;
    errorResponse(
      res,
      status,
      error.message || "Failed to create product",
      error
    );
  }
};

const updateProduct = async (req, res) => {
  try {
    const shop = await getShopRecord(req);
    const id = parseInt(req.params.id, 10);

    if (!Number.isInteger(id) || id < 1) {
      return errorResponse(res, 400, "Invalid product id");
    }

    const product = await Product.findOne({
      where: { id, shopId: shop.id },
    });

    if (!product) {
      return errorResponse(res, 404, "Product not found");
    }

    const updated = await updateProductFlow(shop, product, req.body);
    const payload = await withProductTypes(updated, shop);
    successResponse(res, 200, "Product updated successfully", payload);
  } catch (error) {
    console.error("Error updating product:", error);
    if (isShopifyUnauthorized(error)) {
      return errorResponse(
        res,
        401,
        "Shopify session expired. Reload the app from Shopify admin and try again.",
        error
      );
    }
    const status = error.statusCode || 500;
    errorResponse(
      res,
      status,
      error.message || "Failed to update product",
      error
    );
  }
};

const listProductTypes = async (req, res) => {
  try {
    const shop = await getShopRecord(req);
    const types = await fetchAllProductTypes(shop);

    successResponse(res, 200, "Product types fetched successfully", {
      types,
    });
  } catch (error) {
    console.error("Error listing product types:", error);
    const status = error.statusCode || 500;
    errorResponse(
      res,
      status,
      error.message || "Failed to list product types",
      error
    );
  }
};

const listProductVendors = async (req, res) => {
  try {
    const shop = await getShopRecord(req);
    const vendors = await fetchAllProductVendors(shop);

    successResponse(res, 200, "Product vendors fetched successfully", {
      vendors,
    });
  } catch (error) {
    console.error("Error listing product vendors:", error);
    const status = error.statusCode || 500;
    errorResponse(
      res,
      status,
      error.message || "Failed to list product vendors",
      error
    );
  }
};

const searchTaxonomy = async (req, res) => {
  try {
    const shop = await getShopRecord(req);
    const search = String(req.query.search || "").trim();
    const childrenOf = req.query.childrenOf
      ? String(req.query.childrenOf)
      : null;

    const { graphqlClient } = getGraphQLClient({
      shopDomain: shop.myshopifyDomain,
      accessToken: shop.token,
    });

    const response = await graphqlClient.request(TAXONOMY_SEARCH_QUERY, {
      variables: {
        search: search || null,
        childrenOf,
        first: 25,
      },
    });

    const nodes = response?.data?.taxonomy?.categories?.nodes || [];
    const categories = nodes.map((node) => ({
      id: node.id,
      name: node.name,
      fullName: node.fullName,
      isLeaf: node.isLeaf,
      isRoot: node.isRoot,
    }));

    successResponse(res, 200, "Categories fetched successfully", {
      categories,
    });
  } catch (error) {
    console.error("Error searching taxonomy:", error);
    if (isShopifyUnauthorized(error)) {
      return errorResponse(
        res,
        401,
        "Shopify session expired. Reload the app from Shopify admin and try again.",
        error
      );
    }
    const status = error.statusCode || 500;
    errorResponse(
      res,
      status,
      error.message || "Failed to search categories",
      error
    );
  }
};

const getProduct = async (req, res) => {
  try {
    const shop = await getShopRecord(req);
    const id = parseInt(req.params.id, 10);

    if (!Number.isInteger(id) || id < 1) {
      return errorResponse(res, 400, "Invalid product id");
    }

    const product = await Product.findOne({
      where: { id, shopId: shop.id },
      include: [{ model: Variant, as: "variants" }],
      order: [[{ model: Variant, as: "variants" }, "position", "ASC"]],
    });

    if (!product) {
      return errorResponse(res, 404, "Product not found");
    }

    const payload = await withProductTypes(product, shop);
    successResponse(res, 200, "Product fetched successfully", payload);
  } catch (error) {
    console.error("Error fetching product:", error);
    const status = error.statusCode || 500;
    errorResponse(
      res,
      status,
      error.message || "Failed to fetch product",
      error
    );
  }
};

module.exports = {
  listProducts,
  listProductTypes,
  listProductVendors,
  searchTaxonomy,
  getProduct,
  createProduct,
  updateProduct,
  deleteProducts,
};
