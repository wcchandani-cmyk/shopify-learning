const { Op } = require("sequelize");
const Product = require("./model");
const Variant = require("../variant/model");

const toShopifyId = (node) =>
  node?.legacyResourceId != null
    ? String(node.legacyResourceId)
    : node?.id
    ? String(node.id).split("/").pop()
    : null;

const mapSelectedOptions = (opts = []) => ({
  option1: opts[0]?.value ?? null,
  option2: opts[1]?.value ?? null,
  option3: opts[2]?.value ?? null,
});

const mapProductOptionsJson = (node) => {
  const opts = node?.options;
  if (!Array.isArray(opts) || !opts.length) return null;
  const normalized = opts
    .map((o) => {
      const name = o?.name?.trim();
      if (!name) return null;
      let values = [];
      if (Array.isArray(o.values) && o.values.length)
        values = o.values.map((v) => String(v).trim()).filter(Boolean);
      else if (typeof o.values === "string" && o.values.trim())
        values = o.values
          .split(",")
          .map((v) => v.trim())
          .filter(Boolean);
      else if (Array.isArray(o.optionValues))
        values = o.optionValues
          .map((v) => String(v?.name || "").trim())
          .filter(Boolean);
      return values.length ? { name, values } : null;
    })
    .filter(Boolean);
  return normalized.length ? JSON.stringify(normalized) : null;
};

const normalizeProductStatus = (status) =>
  status ? String(status).toLowerCase() : null;
const normalizeInventoryPolicy = (policy) =>
  policy ? String(policy).toLowerCase() : null;

const pickProductImage = (node) => {
  const img =
    node?.featuredImage ||
    node?.featuredMedia?.preview?.image ||
    node?.image ||
    node?.images?.[0];
  return {
    imageUrl: img?.url || img?.src || null,
    imageAlt: img?.altText || img?.alt || node?.title || null,
  };
};

const pickProductImages = (node) => {
  const list = Array.isArray(node?.images) ? node.images : [];
  const gallery = list
    .map((img) => ({
      src: img?.src || img?.url || null,
      alt: img?.alt || img?.altText || node?.title || null,
    }))
    .filter((img) => img.src);
  if (gallery.length) return gallery;
  const featured = pickProductImage(node);
  return featured.imageUrl
    ? [{ src: featured.imageUrl, alt: featured.imageAlt }]
    : [];
};

const buildImagesJson = (node) => {
  const g = pickProductImages(node);
  return g.length ? JSON.stringify(g) : null;
};

const mapWebhookProduct = (product) => {
  if (!product?.id) return null;
  const variants = (product.variants || []).map((v) => ({
    id: v.admin_graphql_api_id || `gid://shopify/ProductVariant/${v.id}`,
    legacyResourceId: String(v.id),
    title: v.title,
    price: v.price,
    compareAtPrice: v.compare_at_price,
    position: v.position,
    inventoryPolicy: v.inventory_policy,
    barcode: v.barcode,
    sku: v.sku,
    inventoryQuantity: v.inventory_quantity,
    selectedOptions: [
      v.option1 && { value: v.option1 },
      v.option2 && { value: v.option2 },
      v.option3 && { value: v.option3 },
    ].filter(Boolean),
  }));

  return {
    id: product.admin_graphql_api_id || `gid://shopify/Product/${product.id}`,
    legacyResourceId: String(product.id),
    title: product.title,
    descriptionHtml: product.body_html,
    vendor: product.vendor,
    productType: product.product_type,
    handle: product.handle,
    tags: product.tags,
    status: product.status,
    createdAt: product.created_at,
    updatedAt: product.updated_at,
    publishedAt: product.published_at,
    image: product.image,
    images: product.images,
    options: product.options || [],
    variants: { nodes: variants },
  };
};

const resolveProductAfterUpsert = async (
  shop,
  shopifyProductId,
  productPayload
) => {
  await Product.upsert(productPayload, {
    conflictFields: ["shopId", "shopifyId"],
  });
  const product = await Product.findOne({
    where: { shopId: shop.id, shopifyId: String(shopifyProductId) },
  });
  if (!product?.id)
    throw new Error(
      `Could not resolve product id after sync (shopifyId=${shopifyProductId})`
    );
  return product;
};

const upsertVariantForProduct = async (productId, variantShopifyId, fields) => {
  if (!productId)
    throw new Error("productId is required when saving a variant");
  const shopifyId = String(variantShopifyId);
  const variant = await Variant.findOne({ where: { shopifyId } });
  if (variant) return variant.update({ productId, ...fields });
  return Variant.create({ productId, shopifyId, ...fields });
};

const upsertProductWithVariants = async (shop, productNode) => {
  const shopifyId = toShopifyId(productNode);
  if (!shopifyId) return null;

  const productPayload = {
    shopId: shop.id,
    shopifyId,
    title: productNode.title,
    bodyHtml: productNode.descriptionHtml,
    vendor: productNode.vendor,
    productType: productNode.productType || null,
    handle: productNode.handle,
    tags: Array.isArray(productNode.tags)
      ? productNode.tags.join(", ")
      : productNode.tags,
    status: normalizeProductStatus(productNode.status),
    adminGraphqlApiId: productNode.id,
    shopifyCreatedAt: productNode.createdAt,
    shopifyUpdatedAt: productNode.updatedAt,
    publishedAt: productNode.publishedAt,
    ...pickProductImage(productNode),
    imagesJson: buildImagesJson(productNode),
    optionsJson: mapProductOptionsJson(productNode),
  };

  const product = await resolveProductAfterUpsert(
    shop,
    shopifyId,
    productPayload
  );
  const productId = product.id;

  const variantNodes = productNode.variants?.nodes || [];
  const syncedVariantShopifyIds = [];

  for (const variantNode of variantNodes) {
    const variantShopifyId = toShopifyId(variantNode);
    if (!variantShopifyId) continue;
    syncedVariantShopifyIds.push(variantShopifyId);

    const existing = await Variant.findOne({
      where: { shopifyId: variantShopifyId },
    });
    const shopifyQty = Number(variantNode.inventoryQuantity);
    const hasShopifyQty = Number.isFinite(shopifyQty) && shopifyQty > 0;
    const inventoryQuantity = hasShopifyQty
      ? shopifyQty
      : existing?.inventoryQuantity ?? shopifyQty ?? 0;

    await upsertVariantForProduct(productId, variantShopifyId, {
      title: variantNode.title,
      price: variantNode.price,
      compareAtPrice: variantNode.compareAtPrice,
      position: variantNode.position,
      inventoryPolicy: normalizeInventoryPolicy(variantNode.inventoryPolicy),
      ...mapSelectedOptions(variantNode.selectedOptions),
      barcode: variantNode.barcode,
      sku: variantNode.sku,
      inventoryQuantity,
    });
  }

  if (syncedVariantShopifyIds.length > 0) {
    await Variant.destroy({
      where: { productId, shopifyId: { [Op.notIn]: syncedVariantShopifyIds } },
    });
  }

  return product;
};

module.exports = {
  mapWebhookProduct,
  upsertProductWithVariants,
  normalizeProductStatus,
};
