const { successResponse, errorResponse } = require("../../utils/response");
const { getGraphQLClient } = require("../../utils/shopify");
const { handleError } = require("../../utils/controllerHelper");

const CheckoutUpsell = require("./model");
const {
  CHECKOUT_UPSELL_TYPE,
  CREATE_UPSELL_DEFINITION,
  CREATE_UPSELL_METAOBJECT,
  UPDATE_UPSELL_METAOBJECT,
  DELETE_UPSELL_METAOBJECT,
  CREATE_AUTOMATIC_MUTATION,
  UPDATE_AUTOMATIC_MUTATION,
  DELETE_AUTOMATIC_MUTATION,
  ENABLE_MUTATION,
  DISABLE_MUTATION,
  METAFIELDS_SET_MUTATION,
  GET_COLLECTION_PRODUCTS,
} = require("./graphqlQuery");

const METAOBJECT_GID_PREFIX = "gid://shopify/Metaobject/";
const UPSELL_FIELD_KEY = "upsell_config";
const FUNCTION_HANDLE = "custom-discount";

const CONFIG_METAFIELD = {
  namespace: "$app:custom-discount",
  key: "function-configuration",
};

const getShopAndClient = async (req) => {
  const shop = req.shop;
  const { graphqlClient } = getGraphQLClient({
    shopDomain: shop.myshopifyDomain,
    accessToken: shop.token,
  });
  return { shop, graphqlClient };
};

const ensureUpsellDefinition = async (graphqlClient) => {
  const res = await graphqlClient.request(CREATE_UPSELL_DEFINITION, {
    variables: {
      definition: {
        type: CHECKOUT_UPSELL_TYPE,
        name: "Checkout Upsell Campaign",
        access: {
          admin: "MERCHANT_READ",
          storefront: "PUBLIC_READ",
        },
        capabilities: {
          publishable: { enabled: true },
        },
        fieldDefinitions: [
          {
            key: UPSELL_FIELD_KEY,
            name: "Upsell Config",
            type: "json",
          },
        ],
      },
    },
  });

  const errors = res?.data?.metaobjectDefinitionCreate?.userErrors || [];
  const hasFatal = errors.some((e) => e.code !== "TAKEN");
  if (hasFatal) throw new Error(errors.map((e) => e.message).join("; "));
};

const parsePayloadArray = (val) => {
  if (Array.isArray(val)) return val;
  if (typeof val === "string") {
    try {
      return JSON.parse(val);
    } catch (e) {
      return [];
    }
  }
  return [];
};

const getCollectionProducts = async (graphqlClient, collectionId) => {
  const productIds = [];
  let hasNext = true;
  let cursor = null;

  while (hasNext) {
    const res = await graphqlClient.request(GET_COLLECTION_PRODUCTS, {
      variables: { id: collectionId, cursor },
    });

    const products = res.data?.collection?.products;
    if (!products) break;

    (products.nodes || []).forEach((p) => {
      if (p.id) productIds.push(p.id);
    });
    hasNext = products.pageInfo?.hasNextPage || false;
    cursor = products.pageInfo?.endCursor || null;
  }

  return productIds;
};

const resolveTriggerProductIds = async (
  graphqlClient,
  triggerType,
  triggerProductsArr,
  triggerCollectionsArr
) => {
  if (triggerType !== "collections") {
    return triggerProductsArr.map((p) => p.id).filter(Boolean);
  }

  let resolved = [];
  for (const coll of triggerCollectionsArr) {
    if (coll.id) {
      const prodIds = await getCollectionProducts(graphqlClient, coll.id);
      resolved = [...resolved, ...prodIds];
    }
  }
  return [...new Set(resolved)];
};

const firstTrigger = (triggerType, triggerProductsArr, triggerCollectionsArr) => {
  const source =
    triggerType === "collections" ? triggerCollectionsArr : triggerProductsArr;
  return {
    triggerProductId: source[0]?.id || "",
    triggerProductTitle: source[0]?.title || "",
  };
};

const buildUpsellFields = (data) => [
  {
    key: UPSELL_FIELD_KEY,
    value: JSON.stringify({
      title: data.title,
      triggerType: data.triggerType || "products",
      triggerProducts: data.triggerProducts || [],
      triggerCollections: data.triggerCollections || [],
      triggerProductIds: data.triggerProductIds || [],
      triggerProductId: data.triggerProductId || "",
      triggerProductTitle: data.triggerProductTitle || "",
      upsellProductId: data.upsellProductId,
      upsellProductTitle: data.upsellProductTitle || "",
      offerTitle: data.offerTitle || "",
      discountPercentage: Number(data.discountPercentage) || 0,
      isActive: data.isActive,
    }),
  },
];

const toHandle = (title) =>
  `checkout-upsell-${String(title || "rule")
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .slice(0, 200)}`;

exports.getAll = async (req, res) => {
  try {
    const shop = req.shop;
    const upsells = await CheckoutUpsell.findAll({
      where: { shopId: shop.id },
      order: [["createdAt", "DESC"]],
    });
    successResponse(res, 200, "Checkout upsells fetched", { upsells });
  } catch (error) {
    handleError(res, error, "Failed to fetch checkout upsells");
  }
};

exports.getById = async (req, res) => {
  try {
    const shop = req.shop;
    const upsell = await CheckoutUpsell.findOne({
      where: { id: req.params.id, shopId: shop.id },
    });
    if (!upsell) return errorResponse(res, 404, "Checkout upsell not found");
    successResponse(res, 200, "Checkout upsell fetched", { upsell });
  } catch (error) {
    handleError(res, error, "Failed to fetch checkout upsell");
  }
};

exports.create = async (req, res) => {
  try {
    const { shop, graphqlClient } = await getShopAndClient(req);
    const {
      title,
      triggerType = "products",
      triggerProducts = [],
      triggerCollections = [],
      upsellProductId,
      upsellProductTitle = "",
      offerTitle = "",
      discountPercentage = 0,
      isActive = true,
    } = req.body;

    if (!title || !upsellProductId) {
      return errorResponse(res, 400, "title and upsellProductId are required");
    }

    const triggerProductsArr = parsePayloadArray(triggerProducts);
    const triggerCollectionsArr = parsePayloadArray(triggerCollections);

    const resolvedProductIds = await resolveTriggerProductIds(
      graphqlClient,
      triggerType,
      triggerProductsArr,
      triggerCollectionsArr
    );
    const { triggerProductId, triggerProductTitle } = firstTrigger(
      triggerType,
      triggerProductsArr,
      triggerCollectionsArr
    );

    await ensureUpsellDefinition(graphqlClient);

    // 1. Create Shopify Metaobject for storefront view
    const metaobjectRes = await graphqlClient.request(CREATE_UPSELL_METAOBJECT, {
      variables: {
        metaobject: {
          type: CHECKOUT_UPSELL_TYPE,
          handle: toHandle(title),
          capabilities: {
            publishable: { status: isActive ? "ACTIVE" : "DRAFT" },
          },
          fields: buildUpsellFields({
            title,
            triggerType,
            triggerProducts: triggerProductsArr,
            triggerCollections: triggerCollectionsArr,
            triggerProductIds: resolvedProductIds,
            triggerProductId,
            triggerProductTitle,
            upsellProductId,
            upsellProductTitle,
            offerTitle,
            discountPercentage,
            isActive,
          }),
        },
      },
    });

    const metaErrors = metaobjectRes?.data?.metaobjectCreate?.userErrors;
    if (metaErrors?.length) {
      return errorResponse(res, 400, "Shopify rejected the Metaobject creation", metaErrors);
    }

    const shopifyMetaobject = metaobjectRes.data.metaobjectCreate.metaobject;
    const metaobjectId = shopifyMetaobject.id.replace(METAOBJECT_GID_PREFIX, "");

    // 2. Create Shopify Automatic Discount Node
    const discountRes = await graphqlClient.request(CREATE_AUTOMATIC_MUTATION, {
      variables: {
        automaticAppDiscount: {
          title: `Upsell - ${title}`,
          functionHandle: FUNCTION_HANDLE,
          discountClasses: ["PRODUCT"],
          startsAt: new Date().toISOString(),
          endsAt: null,
          combinesWith: {
            productDiscounts: true,
            orderDiscounts: true,
            shippingDiscounts: true,
          },
          metafields: [
            {
              namespace: CONFIG_METAFIELD.namespace,
              key: CONFIG_METAFIELD.key,
              type: "json",
              value: JSON.stringify({
                title: `Upsell - ${title}`,
                campaignType: "checkout_upsell",
                discountType: "percentage",
                discountValue: Number(discountPercentage) || 0,
                discountMessage: offerTitle || `Upsell: ${title}`,
                triggerType,
                triggerProductIds: resolvedProductIds,
                upsellProductId,
              }),
            },
          ],
        },
      },
    });

    const discountErrors = discountRes?.data?.discountAutomaticAppCreate?.userErrors;
    if (discountErrors?.length) {
      return errorResponse(res, 400, "Shopify rejected the automatic discount creation", discountErrors);
    }

    const rawDiscountId = discountRes.data.discountAutomaticAppCreate.automaticAppDiscount.discountId;
    const discountId = rawDiscountId.replace("gid://shopify/DiscountAutomaticNode/", "");

    // If campaign is set to inactive (draft), deactivate the discount node
    if (!isActive) {
      await graphqlClient.request(DISABLE_MUTATION, {
        variables: { id: rawDiscountId },
      });
    }

    // 3. Create database entry
    const upsell = await CheckoutUpsell.create({
      shopId: shop.id,
      metaobjectId,
      discountId,
      title,
      triggerType,
      triggerProducts: JSON.stringify(triggerProductsArr),
      triggerCollections: JSON.stringify(triggerCollectionsArr),
      triggerProductIds: JSON.stringify(resolvedProductIds),
      triggerProductId,
      triggerProductTitle,
      upsellProductId,
      upsellProductTitle,
      offerTitle,
      discountPercentage: Number(discountPercentage) || 0,
      isActive,
    });

    successResponse(res, 201, "Checkout upsell created successfully", { upsell });
  } catch (error) {
    console.error("Error creating checkout upsell:", error);
    handleError(res, error, "Failed to create checkout upsell");
  }
};

exports.update = async (req, res) => {
  try {
    const { shop, graphqlClient } = await getShopAndClient(req);
    const upsell = await CheckoutUpsell.findOne({
      where: { id: req.params.id, shopId: shop.id },
    });
    if (!upsell) return errorResponse(res, 404, "Checkout upsell not found");

    const pick = (key, fallback) =>
      req.body[key] !== undefined ? req.body[key] : fallback;

    const title = pick("title", upsell.title);
    const triggerType = pick("triggerType", upsell.triggerType || "products");
    const triggerProductsArr = parsePayloadArray(
      pick("triggerProducts", upsell.triggerProducts)
    );
    const triggerCollectionsArr = parsePayloadArray(
      pick("triggerCollections", upsell.triggerCollections)
    );
    const upsellProductId = pick("upsellProductId", upsell.upsellProductId);
    const upsellProductTitle = pick("upsellProductTitle", upsell.upsellProductTitle);
    const offerTitle = pick("offerTitle", upsell.offerTitle);
    const discountPercentage = pick("discountPercentage", upsell.discountPercentage);
    const isActive = pick("isActive", upsell.isActive);

    const resolvedProductIds = await resolveTriggerProductIds(
      graphqlClient,
      triggerType,
      triggerProductsArr,
      triggerCollectionsArr
    );
    const { triggerProductId, triggerProductTitle } = firstTrigger(
      triggerType,
      triggerProductsArr,
      triggerCollectionsArr
    );

    // 1. Update Metaobject on Shopify
    const shopifyMetaId = `${METAOBJECT_GID_PREFIX}${upsell.metaobjectId}`;
    const metaobjectRes = await graphqlClient.request(UPDATE_UPSELL_METAOBJECT, {
      variables: {
        id: shopifyMetaId,
        metaobject: {
          handle: toHandle(title),
          capabilities: {
            publishable: { status: isActive ? "ACTIVE" : "DRAFT" },
          },
          fields: buildUpsellFields({
            title,
            triggerType,
            triggerProducts: triggerProductsArr,
            triggerCollections: triggerCollectionsArr,
            triggerProductIds: resolvedProductIds,
            triggerProductId,
            triggerProductTitle,
            upsellProductId,
            upsellProductTitle,
            offerTitle,
            discountPercentage,
            isActive,
          }),
        },
      },
    });

    const metaErrors = metaobjectRes?.data?.metaobjectUpdate?.userErrors;
    if (metaErrors?.length) {
      return errorResponse(res, 400, "Shopify rejected the Metaobject update", metaErrors);
    }

    // 2. Update/Create Automatic App Discount Node
    let discountId = upsell.discountId;
    const discountNodeId = `gid://shopify/DiscountAutomaticNode/${discountId}`;
    const metafieldValue = JSON.stringify({
      title: `Upsell - ${title}`,
      campaignType: "checkout_upsell",
      discountType: "percentage",
      discountValue: Number(discountPercentage) || 0,
      discountMessage: offerTitle || `Upsell: ${title}`,
      triggerType,
      triggerProductIds: resolvedProductIds,
      upsellProductId,
    });

    if (discountId) {
      // Update existing discount details
      const updateDiscRes = await graphqlClient.request(UPDATE_AUTOMATIC_MUTATION, {
        variables: {
          id: discountNodeId,
          automaticAppDiscount: {
            title: `Upsell - ${title}`,
            startsAt: new Date().toISOString(),
            endsAt: null,
            combinesWith: {
              productDiscounts: true,
              orderDiscounts: true,
              shippingDiscounts: true,
            },
          },
        },
      });

      const discErrors = updateDiscRes?.data?.discountAutomaticAppUpdate?.userErrors;
      if (discErrors?.length) {
        return errorResponse(res, 400, "Shopify rejected the automatic discount update", discErrors);
      }

      // Update Metafield directly using metafieldsSet mutation
      await graphqlClient.request(METAFIELDS_SET_MUTATION, {
        variables: {
          metafields: [
            {
              ownerId: discountNodeId,
              namespace: CONFIG_METAFIELD.namespace,
              key: CONFIG_METAFIELD.key,
              type: "json",
              value: metafieldValue,
            },
          ],
        },
      });

      // Update active status
      if (isActive) {
        await graphqlClient.request(ENABLE_MUTATION, { variables: { id: discountNodeId } });
      } else {
        await graphqlClient.request(DISABLE_MUTATION, { variables: { id: discountNodeId } });
      }
    } else {
      // Recreate discount node if it got lost/missing
      const newDiscRes = await graphqlClient.request(CREATE_AUTOMATIC_MUTATION, {
        variables: {
          automaticAppDiscount: {
            title: `Upsell - ${title}`,
            functionHandle: FUNCTION_HANDLE,
            discountClasses: ["PRODUCT"],
            startsAt: new Date().toISOString(),
            endsAt: null,
            combinesWith: {
              productDiscounts: true,
              orderDiscounts: true,
              shippingDiscounts: true,
            },
            metafields: [
              {
                namespace: CONFIG_METAFIELD.namespace,
                key: CONFIG_METAFIELD.key,
                type: "json",
                value: metafieldValue,
              },
            ],
          },
        },
      });

      const newDiscErrors = newDiscRes?.data?.discountAutomaticAppCreate?.userErrors;
      if (newDiscErrors?.length) {
        return errorResponse(res, 400, "Shopify rejected the automatic discount registration", newDiscErrors);
      }

      const rawNewId = newDiscRes.data.discountAutomaticAppCreate.automaticAppDiscount.discountId;
      discountId = rawNewId.replace("gid://shopify/DiscountAutomaticNode/", "");

      if (!isActive) {
        await graphqlClient.request(DISABLE_MUTATION, { variables: { id: rawNewId } });
      }
    }

    // 3. Update DB
    await upsell.update({
      title,
      triggerType,
      triggerProducts: JSON.stringify(triggerProductsArr),
      triggerCollections: JSON.stringify(triggerCollectionsArr),
      triggerProductIds: JSON.stringify(resolvedProductIds),
      triggerProductId,
      triggerProductTitle,
      upsellProductId,
      upsellProductTitle,
      offerTitle,
      discountPercentage: Number(discountPercentage) || 0,
      discountId,
      isActive,
    });

    successResponse(res, 200, "Checkout upsell updated successfully", { upsell });
  } catch (error) {
    console.error("Error updating checkout upsell:", error);
    handleError(res, error, "Failed to update checkout upsell");
  }
};

exports.deleted = async (req, res) => {
  try {
    const { shop, graphqlClient } = await getShopAndClient(req);
    const upsell = await CheckoutUpsell.findOne({
      where: { id: req.params.id, shopId: shop.id },
    });
    if (!upsell) return errorResponse(res, 404, "Checkout upsell not found");

    // 1. Delete Metaobject from Shopify — ignore if already gone
    if (upsell.metaobjectId) {
      try {
        const shopifyMetaId = `${METAOBJECT_GID_PREFIX}${upsell.metaobjectId}`;
        await graphqlClient.request(DELETE_UPSELL_METAOBJECT, { variables: { id: shopifyMetaId } });
      } catch (e) {
        console.warn("Metaobject delete skipped (already removed or not found):", e.message);
      }
    }

    // 2. Delete Discount Node from Shopify — ignore if already gone
    if (upsell.discountId) {
      try {
        const discountNodeId = `gid://shopify/DiscountAutomaticNode/${upsell.discountId}`;
        await graphqlClient.request(DELETE_AUTOMATIC_MUTATION, { variables: { id: discountNodeId } });
      } catch (e) {
        console.warn("Discount delete skipped (already removed or not found):", e.message);
      }
    }

    // 3. Always destroy the DB row
    await upsell.destroy();

    successResponse(res, 200, "Checkout upsell deleted successfully", { deletedId: req.params.id });
  } catch (error) {
    console.error("Error deleting checkout upsell:", error);
    handleError(res, error, "Failed to delete checkout upsell");
  }
};
