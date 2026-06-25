const { Op } = require("sequelize");
const Product = require("./model");
const Variant = require("../variant/model");
const { successResponse, errorResponse } = require("../../utils/response");
const { getRestClient, getGraphQLClient } = require("../../utils/shopify");
const { isShopifyUnauthorized } = require("../../utils/shopAccess");
const { upsertProductWithVariants, mapWebhookProduct, normalizeProductStatus } = require("./productService");
const { PRODUCT_SET_MUTATION, TAXONOMY_SEARCH_QUERY, PRODUCT_TYPES_QUERY, PRODUCT_VENDORS_QUERY } = require("./queries");
const { parsePageSize: baseParsePageSize } = require("../../utils/controllerHelper");

const parsePageSize = (value) => baseParsePageSize(value, 10, 50);
const getShopRecord = (req) => req.shop;

const handleControllerError = (res, err, defaultMsg) => {
  console.error(defaultMsg, err);
  if (isShopifyUnauthorized(err)) {
    return errorResponse(res, 401, "Shopify session expired. Reload the app from Shopify admin and try again.", err);
  }
  errorResponse(res, err.statusCode || 500, err.message || defaultMsg, err);
};

const fetchDbProductColumn = async (shopId, column) => {
  const rows = await Product.findAll({
    attributes: [column],
    where: { shopId, [column]: { [Op.and]: [{ [Op.ne]: null }, { [Op.ne]: "" }] } },
    group: [column],
    order: [[column, "ASC"]],
    raw: true,
  });
  return rows.map((r) => String(r[column] || "").trim()).filter(Boolean);
};

const fetchShopifyStringConnection = async (shop, query, rootField) => {
  const { graphqlClient } = getGraphQLClient({ shopDomain: shop.myshopifyDomain, accessToken: shop.token });
  const values = [];
  let after = null;

  for (let page = 0; page < 20; page += 1) {
    const response = await graphqlClient.request(query, { variables: { first: 250, after } });
    if (response?.errors) {
      const msg = Array.isArray(response.errors) ? response.errors.map((e) => e.message).join("; ") : response.errors.message || "Shopify GraphQL error";
      throw new Error(`${rootField}: ${msg}`);
    }
    const connection = response?.data?.[rootField];
    values.push(...(connection?.nodes || []));
    if (!connection?.pageInfo?.hasNextPage) break;
    after = connection.pageInfo.endCursor;
  }
  return values.map((v) => String(v || "").trim()).filter(Boolean);
};

const fetchAllProductTypes = async (shop) => {
  try {
    const live = await fetchShopifyStringConnection(shop, PRODUCT_TYPES_QUERY, "productTypes");
    if (live.length) return live;
  } catch (err) {
    console.error("Live product types fetch failed, falling back to DB:", err.message);
  }
  return fetchDbProductColumn(shop.id, "productType");
};

const fetchAllProductVendors = async (shop) => {
  try {
    const live = await fetchShopifyStringConnection(shop, PRODUCT_VENDORS_QUERY, "productVendors");
    if (live.length) return live;
  } catch (err) {
    console.error("Live product vendors fetch failed, falling back to DB:", err.message);
  }
  return fetchDbProductColumn(shop.id, "vendor");
};

const withProductTypes = async (product, shop) => ({
  ...(typeof product.toJSON === "function" ? product.toJSON() : product),
  availableProductTypes: await fetchAllProductTypes(shop),
});

const loadProductWithVariants = (productId, shopId) => Product.findOne({
  where: { id: productId, shopId },
  include: [{ model: Variant, as: "variants" }],
  order: [[{ model: Variant, as: "variants" }, "position", "ASC"]],
});

const variantPayloadKey = (variant) => [variant.option1, variant.option2, variant.option3]
  .map((v) => String(v || "").trim().toLowerCase())
  .join("|");

const parseOptionsJson = (optionsJson) => {
  if (!optionsJson) return null;
  try {
    const parsed = typeof optionsJson === "string" ? JSON.parse(optionsJson) : optionsJson;
    if (!Array.isArray(parsed) || !parsed.length) return null;
    const normalized = parsed
      .map((opt) => {
        const name = String(opt?.name || "").trim();
        const values = Array.isArray(opt?.values) ? opt.values.map((v) => String(v).trim()).filter(Boolean) : [];
        return name && values.length ? { name, values } : null;
      })
      .filter(Boolean);
    return normalized.length ? normalized : null;
  } catch {
    return null;
  }
};

const parseDataImageUrl = (imageUrl) => {
  if (!imageUrl || typeof imageUrl !== "string" || !imageUrl.startsWith("data:")) return null;
  const match = imageUrl.match(/^data:([^;]+);base64,(.+)$/s);
  if (!match) return null;
  const ext = (match[1].split("/")[1] || "png").replace(/[^a-z0-9]/gi, "") || "png";
  return { attachment: match[2], filename: `product.${ext}` };
};

const buildSingleShopifyImage = (image, fallbackAlt) => {
  const alt = image.alt || fallbackAlt || "Product";
  const attachmentData = image.attachment?.data || image.data;
  if (attachmentData) return { attachment: String(attachmentData), filename: image.attachment?.filename || image.filename || "product.png", alt };
  const fromDataUrl = parseDataImageUrl(image.src);
  if (fromDataUrl) return { ...fromDataUrl, alt };
  if (image.src && /^https?:\/\//i.test(image.src)) return { src: image.src, alt };
  return null;
};

const buildShopifyProductImages = (payload) => {
  const fallbackAlt = payload.title || "Product";
  if (Array.isArray(payload.images)) {
    const built = payload.images.map((img) => buildSingleShopifyImage(img, fallbackAlt)).filter(Boolean);
    return built.length ? built : null;
  }
  const single = buildSingleShopifyImage({ attachment: payload.imageAttachment, src: payload.imageUrl, alt: payload.imageAlt }, fallbackAlt);
  return single ? [single] : null;
};

const parsePayloadInventoryQuantity = (v) => v.inventoryQuantity === undefined ? null : (parseInt(v.inventoryQuantity, 10) || 0);

const locationIdByShop = new Map();

const getPrimaryLocationId = async (client, shopDomain) => {
  if (locationIdByShop.has(shopDomain)) return locationIdByShop.get(shopDomain);
  const response = await client.get({ path: "locations", query: { limit: 1 } });
  const location = response.body?.locations?.[0];
  if (!location?.id) throw new Error("No Shopify location found for inventory");
  locationIdByShop.set(shopDomain, location.id);
  return location.id;
};

const fetchInventoryItemId = async (client, shopifyVariantId) => {
  const response = await client.get({ path: `variants/${shopifyVariantId}` });
  return response.body?.variant?.inventory_item_id ?? null;
};

const setVariantInventoryAvailable = async (shop, shopifyVariantId, available) => {
  const qty = parseInt(available, 10);
  if (!Number.isFinite(qty) || qty < 0) return false;
  const client = getRestClient(shop);
  try {
    const itemId = await fetchInventoryItemId(client, shopifyVariantId);
    if (!itemId) return false;
    const locId = await getPrimaryLocationId(client, shop.myshopifyDomain);
    await client.post({
      path: "inventory_levels/set",
      type: "application/json",
      data: { location_id: locId, inventory_item_id: itemId, available: qty },
    });
    return true;
  } catch (err) {
    console.warn(`[inventory] Could not set quantity for variant ${shopifyVariantId}:`, err.message);
    return false;
  }
};

const findVariantRowForPayload = (rows, payloadVariant) => {
  const varId = parseInt(payloadVariant.id, 10);
  if (Number.isInteger(varId) && varId > 0) {
    const byId = rows.find((r) => Number(r.id) === varId);
    if (byId) return byId;
  }
  const key = variantPayloadKey(payloadVariant);
  return rows.find((r) => variantPayloadKey(r) === key) || null;
};

const persistPayloadInventoryToDb = async (productId, payloadVariants = []) => {
  if (!payloadVariants.length) return;
  const rows = await Variant.findAll({ where: { productId }, order: [["position", "ASC"]] });
  for (const pVar of payloadVariants) {
    const qty = parsePayloadInventoryQuantity(pVar);
    if (qty === null) continue;
    const row = findVariantRowForPayload(rows, pVar);
    if (row) await Variant.update({ inventoryQuantity: qty }, { where: { id: row.id, productId } });
  }
};

const applyInventoryFromPayload = async (shop, productId, payloadVariants = []) => {
  if (!payloadVariants.length) return;
  const rows = await Variant.findAll({ where: { productId }, order: [["position", "ASC"]] });
  for (const pVar of payloadVariants) {
    const qty = parsePayloadInventoryQuantity(pVar);
    if (qty === null) continue;
    const row = findVariantRowForPayload(rows, pVar);
    if (row?.shopifyId) {
      await setVariantInventoryAvailable(shop, row.shopifyId, qty);
      await Variant.update({ inventoryQuantity: qty }, { where: { id: row.id, productId } });
    }
  }
};

const defaultVariantRow = (tpl) => ({
  title: "Default Title",
  sku: "",
  price: tpl?.price != null ? String(tpl.price) : "0.00",
  inventoryQuantity: tpl?.inventoryQuantity != null ? (parseInt(tpl.inventoryQuantity, 10) || 0) : 0,
  option1: "Default Title",
  option2: null,
  option3: null,
  isNew: true,
});

const normalizePayloadForShopify = (payload) => {
  const variants = Array.isArray(payload.variants) ? [...payload.variants] : [];
  const options = parseOptionsJson(payload.optionsJson);
  const nextVariants = variants.filter((v) => String(v.option1 || v.title || "").trim());
  return {
    ...payload,
    optionsJson: options ? payload.optionsJson : null,
    variants: nextVariants.length ? nextVariants : [defaultVariantRow(variants[0])],
  };
};

const applyPayloadOverridesToDb = async (productId, payload) => {
  const updates = {};
  if (payload.optionsJson !== undefined) updates.optionsJson = payload.optionsJson || null;
  if (payload.categoryId !== undefined) {
    updates.categoryId = payload.categoryId || null;
    updates.categoryName = payload.categoryName || null;
  }
  if (Object.keys(updates).length) await Product.update(updates, { where: { id: productId } });
};

const DEFAULT_OPTION_NAME = "Title";
const DEFAULT_OPTION_VALUE = "Default Title";

const toProductGid = (shopifyId) => {
  const id = String(shopifyId || "").trim();
  return id.startsWith("gid://") ? id : `gid://shopify/Product/${id}`;
};

const gidToNumericId = (gid) => (String(gid || "").match(/(\d+)$/) || [])[1] || null;

const splitTagsToArray = (tags) => Array.isArray(tags) ? tags.map((t) => String(t).trim()).filter(Boolean) : String(tags || "").split(",").map((t) => t.trim()).filter(Boolean);

const buildVariantSetInput = (variant, optionNames) => {
  const vals = [variant.option1, variant.option2, variant.option3];
  const optionValues = optionNames.length
    ? optionNames.map((name, i) => ({ optionName: name, name: String(vals[i] || "").trim() || DEFAULT_OPTION_VALUE }))
    : [{ optionName: DEFAULT_OPTION_NAME, name: String(variant.option1 || variant.title || "").trim() || DEFAULT_OPTION_VALUE }];
  const input = { optionValues };
  if (variant.price != null && variant.price !== "") input.price = String(variant.price);
  if (variant.sku) input.sku = String(variant.sku).trim();
  return input;
};

const buildProductSetInput = (payload, { productGid } = {}) => {
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
  if (payload.templateSuffix !== undefined) input.templateSuffix = payload.templateSuffix || null;
  if (payload.categoryId !== undefined) input.category = payload.categoryId ? String(payload.categoryId).trim() : null;

  let optionNames = [];
  if (options?.length) {
    optionNames = options.map((o) => o.name);
    input.productOptions = options.map((o, idx) => ({ name: o.name, position: idx + 1, values: o.values.map((v) => ({ name: v })) }));
  } else {
    input.productOptions = [{ name: DEFAULT_OPTION_NAME, position: 1, values: [{ name: DEFAULT_OPTION_VALUE }] }];
  }

  const allVars = Array.isArray(payload.variants) ? payload.variants : [];
  const sourceVars = optionNames.length ? allVars : allVars.slice(0, 1);
  const variants = sourceVars.length ? sourceVars : [defaultVariantRow()];

  input.variants = variants.map((v) => buildVariantSetInput(v, optionNames));
  return input;
};

const runProductSet = async (shop, input) => {
  const { graphqlClient } = getGraphQLClient({ shopDomain: shop.myshopifyDomain, accessToken: shop.token });
  const response = await graphqlClient.request(PRODUCT_SET_MUTATION, { variables: { input, synchronous: true } });

  if (response?.errors) {
    const err = new Error(Array.isArray(response.errors) ? response.errors.map((e) => e.message).join("; ") : response.errors.message || "Shopify GraphQL error");
    err.statusCode = 502;
    throw err;
  }

  const result = response?.data?.productSet;
  const userErrors = result?.userErrors || [];
  if (userErrors.length) {
    const err = new Error(userErrors.map((e) => e.message).join("; ") || "Shopify rejected the product");
    err.statusCode = 422;
    throw err;
  }

  if (!result?.product?.id) {
    const err = new Error("Shopify did not return the product");
    err.statusCode = 502;
    throw err;
  }
  return result.product.id;
};

const applyProductImagesRest = async (shop, shopifyProductId, payload) => {
  const images = buildShopifyProductImages(payload);
  if (!images) return;
  await getRestClient(shop).put({
    path: `products/${shopifyProductId}`,
    type: "application/json",
    data: { product: { id: Number(shopifyProductId), images } },
  });
};

const syncProductFromShopify = async (shop, shopifyProductId) => {
  const response = await getRestClient(shop).get({ path: `products/${shopifyProductId}` });
  if (!response.body?.product?.id) {
    const err = new Error("Product not found on Shopify");
    err.statusCode = 404;
    throw err;
  }
  const product = await upsertProductWithVariants(shop, mapWebhookProduct(response.body.product));
  return loadProductWithVariants(product.id, shop.id);
};

const createProductFlow = async (shop, payload) => {
  const normalized = normalizePayloadForShopify(payload);
  if (!String(normalized.title || "").trim()) {
    const err = new Error("Product title is required");
    err.statusCode = 400;
    throw err;
  }
  const productGid = await runProductSet(shop, buildProductSetInput(normalized));
  const shopifyProductId = gidToNumericId(productGid);

  await applyProductImagesRest(shop, shopifyProductId, normalized);
  const saved = await syncProductFromShopify(shop, shopifyProductId);
  await applyPayloadOverridesToDb(saved.id, normalized);
  await applyInventoryFromPayload(shop, saved.id, normalized.variants);
  await persistPayloadInventoryToDb(saved.id, normalized.variants);
  return loadProductWithVariants(saved.id, shop.id);
};

const updateProductFlow = async (shop, product, payload) => {
  const normalized = normalizePayloadForShopify(payload);
  await applyPayloadOverridesToDb(product.id, normalized);
  await runProductSet(shop, buildProductSetInput(normalized, { productGid: toProductGid(product.shopifyId) }));
  await applyProductImagesRest(shop, product.shopifyId, normalized);
  await syncProductFromShopify(shop, product.shopifyId);
  await applyPayloadOverridesToDb(product.id, normalized);
  await applyInventoryFromPayload(shop, product.id, normalized.variants);
  await persistPayloadInventoryToDb(product.id, normalized.variants);
  return loadProductWithVariants(product.id, shop.id);
};

const deleteProductsFlow = async (shop, productIds) => {
  const ids = [...new Set((Array.isArray(productIds) ? productIds : []).map((id) => parseInt(id, 10)).filter((id) => id > 0))];
  if (!ids.length) {
    const err = new Error("No valid product ids to delete");
    err.statusCode = 400;
    throw err;
  }
  const products = await Product.findAll({ where: { id: ids, shopId: shop.id } });
  if (!products.length) {
    const err = new Error("No matching products found");
    err.statusCode = 404;
    throw err;
  }

  const client = getRestClient(shop);
  const deletedIds = [];
  for (const product of products) {
    await client.delete({ path: `products/${product.shopifyId}` });
    deletedIds.push(product.id);
  }

  await Product.destroy({ where: { id: deletedIds, shopId: shop.id } });
  return { deletedCount: deletedIds.length, deletedIds };
};

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

    const ids = idRows.map((r) => r.id);
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

    console.log(`[list] page=${page} limit=${limit} returned=${pageProducts.length} totalInDb=${total}`);
    const productTypes = await fetchAllProductTypes(shop);

    successResponse(res, 200, "Products fetched successfully", {
      returnedCount: pageProducts.length,
      products: pageProducts,
      productTypes,
      pagination: { page, limit, total, totalPages, hasNextPage: page < totalPages, hasPreviousPage: page > 1 },
    });
  } catch (error) {
    handleControllerError(res, error, "Failed to list products");
  }
};

const deleteProducts = async (req, res) => {
  try {
    const shop = await getShopRecord(req);
    const result = await deleteProductsFlow(shop, req.body?.ids || []);
    successResponse(res, 200, "Products deleted successfully", result);
  } catch (error) {
    handleControllerError(res, error, "Failed to delete products");
  }
};

const createProduct = async (req, res) => {
  try {
    const shop = await getShopRecord(req);
    const created = await createProductFlow(shop, req.body);
    const payload = await withProductTypes(created, shop);
    successResponse(res, 201, "Product created successfully", payload);
  } catch (error) {
    handleControllerError(res, error, "Failed to create product");
  }
};

const updateProduct = async (req, res) => {
  try {
    const shop = await getShopRecord(req);
    const id = parseInt(req.params.id, 10);
    if (!Number.isInteger(id) || id < 1) return errorResponse(res, 400, "Invalid product id");

    const product = await Product.findOne({ where: { id, shopId: shop.id } });
    if (!product) return errorResponse(res, 404, "Product not found");

    const updated = await updateProductFlow(shop, product, req.body);
    const payload = await withProductTypes(updated, shop);
    successResponse(res, 200, "Product updated successfully", payload);
  } catch (error) {
    handleControllerError(res, error, "Failed to update product");
  }
};

const listProductTypes = async (req, res) => {
  try {
    const shop = await getShopRecord(req);
    const types = await fetchAllProductTypes(shop);
    successResponse(res, 200, "Product types fetched successfully", { types });
  } catch (error) {
    handleControllerError(res, error, "Failed to list product types");
  }
};

const listProductVendors = async (req, res) => {
  try {
    const shop = await getShopRecord(req);
    const vendors = await fetchAllProductVendors(shop);
    successResponse(res, 200, "Product vendors fetched successfully", { vendors });
  } catch (error) {
    handleControllerError(res, error, "Failed to list product vendors");
  }
};

const searchTaxonomy = async (req, res) => {
  try {
    const shop = await getShopRecord(req);
    const search = String(req.query.search || "").trim();
    const childrenOf = req.query.childrenOf ? String(req.query.childrenOf) : null;
    const { graphqlClient } = getGraphQLClient({ shopDomain: shop.myshopifyDomain, accessToken: shop.token });

    const response = await graphqlClient.request(TAXONOMY_SEARCH_QUERY, { variables: { search: search || null, childrenOf, first: 25 } });
    const nodes = response?.data?.taxonomy?.categories?.nodes || [];
    const categories = nodes.map((node) => ({
      id: node.id,
      name: node.name,
      fullName: node.fullName,
      isLeaf: node.isLeaf,
      isRoot: node.isRoot,
    }));

    successResponse(res, 200, "Categories fetched successfully", { categories });
  } catch (error) {
    handleControllerError(res, error, "Failed to search categories");
  }
};

const getProduct = async (req, res) => {
  try {
    const shop = await getShopRecord(req);
    const id = parseInt(req.params.id, 10);
    if (!Number.isInteger(id) || id < 1) return errorResponse(res, 400, "Invalid product id");

    const product = await Product.findOne({
      where: { id, shopId: shop.id },
      include: [{ model: Variant, as: "variants" }],
      order: [[{ model: Variant, as: "variants" }, "position", "ASC"]],
    });
    if (!product) return errorResponse(res, 404, "Product not found");

    const payload = await withProductTypes(product, shop);
    successResponse(res, 200, "Product fetched successfully", payload);
  } catch (error) {
    handleControllerError(res, error, "Failed to fetch product");
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
