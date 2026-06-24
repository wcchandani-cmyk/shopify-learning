const { Op } = require("sequelize");
const Product = require("./model");
const Variant = require("../variant/model");

const toShopifyId = (node) => {
  if (node?.legacyResourceId != null) {
    return String(node.legacyResourceId);
  }
  if (!node?.id) return null;
  const parts = String(node.id).split("/");
  return parts[parts.length - 1];
};

const mapSelectedOptions = (selectedOptions = []) => ({
  option1: selectedOptions[0]?.value ?? null,
  option2: selectedOptions[1]?.value ?? null,
  option3: selectedOptions[2]?.value ?? null,
});

const mapProductOptionsJson = (productNode) => {
  const opts = productNode?.options;
  if (!Array.isArray(opts) || !opts.length) return null;

  const normalized = opts
    .map((option) => {
      const name = option?.name?.trim();
      if (!name) return null;

      let values = [];
      if (Array.isArray(option.values) && option.values.length) {
        values = option.values.map((v) => String(v).trim()).filter(Boolean);
      } else if (typeof option.values === "string" && option.values.trim()) {
        values = option.values
          .split(",")
          .map((v) => v.trim())
          .filter(Boolean);
      } else if (Array.isArray(option.optionValues)) {
        values = option.optionValues
          .map((v) => String(v?.name || "").trim())
          .filter(Boolean);
      }

      return { name, values };
    })
    .filter(Boolean);

  return normalized.length ? JSON.stringify(normalized) : null;
};

const normalizeProductStatus = (status) =>
  status ? String(status).toLowerCase() : null;

const normalizeInventoryPolicy = (policy) =>
  policy ? String(policy).toLowerCase() : null;

const pickProductImage = (productNode) => {
  const img = productNode?.featuredImage ||
    productNode?.featuredMedia?.preview?.image ||
    productNode?.image ||
    productNode?.images?.[0];
  return {
    imageUrl: img?.url || img?.src || null,
    imageAlt: img?.altText || img?.alt || productNode?.title || null,
  };
};

/** Collect the full image gallery from a Shopify product node. */
const pickProductImages = (productNode) => {
  const list = Array.isArray(productNode?.images) ? productNode.images : [];
  const gallery = list
    .map((img) => ({
      src: img?.src || img?.url || null,
      alt: img?.alt || img?.altText || productNode?.title || null,
    }))
    .filter((img) => img.src);

  if (gallery.length) return gallery;

  const featured = pickProductImage(productNode);
  return featured.imageUrl
    ? [{ src: featured.imageUrl, alt: featured.imageAlt }]
    : [];
};

const buildImagesJson = (productNode) => {
  const gallery = pickProductImages(productNode);
  return gallery.length ? JSON.stringify(gallery) : null;
};

/** Map REST webhook product payload to shape used by upsertProductWithVariants */
const mapWebhookProduct = (product) => {
  if (!product?.id) return null;

  const variants = (product.variants || []).map((variant) => ({
    id:
      variant.admin_graphql_api_id ||
      `gid://shopify/ProductVariant/${variant.id}`,
    legacyResourceId: String(variant.id),
    title: variant.title,
    price: variant.price,
    compareAtPrice: variant.compare_at_price,
    position: variant.position,
    inventoryPolicy: variant.inventory_policy,
    barcode: variant.barcode,
    sku: variant.sku,
    inventoryQuantity: variant.inventory_quantity,
    selectedOptions: [
      variant.option1 && { value: variant.option1 },
      variant.option2 && { value: variant.option2 },
      variant.option3 && { value: variant.option3 },
    ].filter(Boolean),
  }));

  return {
    id:
      product.admin_graphql_api_id ||
      `gid://shopify/Product/${product.id}`,
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

async function resolveProductAfterUpsert(shop, shopifyProductId, productPayload) {
  await Product.upsert(productPayload, {
    conflictFields: ["shopId", "shopifyId"],
  });

  const product = await Product.findOne({
    where: { shopId: shop.id, shopifyId: String(shopifyProductId) },
  });

  if (!product?.id) {
    throw new Error(
      `Could not resolve product id after sync (shopifyId=${shopifyProductId})`,
    );
  }

  return product;
}

async function upsertVariantForProduct(productId, variantShopifyId, fields) {
  if (!productId) {
    throw new Error("productId is required when saving a variant");
  }

  const shopifyId = String(variantShopifyId);
  let variant = await Variant.findOne({ where: { shopifyId } });

  if (variant) {
    await variant.update({ productId, ...fields });
    return variant;
  }

  return Variant.create({
    productId,
    shopifyId,
    ...fields,
  });
}

/** Upsert a Shopify product + its variants into the DB (API sync + webhooks). */
async function upsertProductWithVariants(shop, productNode) {
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

  const product = await resolveProductAfterUpsert(shop, shopifyId, productPayload);
  const productId = product.id;

  const variantNodes = productNode.variants?.nodes || [];
  const syncedVariantShopifyIds = [];

  for (const variantNode of variantNodes) {
    const variantShopifyId = toShopifyId(variantNode);
    if (!variantShopifyId) continue;

    syncedVariantShopifyIds.push(variantShopifyId);

    const existing = await Variant.findOne({ where: { shopifyId: variantShopifyId } });
    const shopifyQty = Number(variantNode.inventoryQuantity);
    const hasShopifyQty = Number.isFinite(shopifyQty) && shopifyQty > 0;
    const inventoryQuantity = hasShopifyQty
      ? shopifyQty
      : existing?.inventoryQuantity != null
        ? existing.inventoryQuantity
        : Number.isFinite(shopifyQty)
          ? shopifyQty
          : 0;

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
      where: {
        productId,
        shopifyId: { [Op.notIn]: syncedVariantShopifyIds },
      },
    });
  }

  return product;
}

module.exports = {
  mapWebhookProduct,
  upsertProductWithVariants,
  normalizeProductStatus,
};
