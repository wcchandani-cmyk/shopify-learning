const { Op } = require("sequelize");

const { successResponse, errorResponse } = require("../../utils/response");
const { getGraphQLClient } = require("../../utils/shopify");
const { parsePageSize, handleError } = require("../../utils/controllerHelper");
const CustomDiscount = require("./model");

const getShopRecord = (req) => req.shop;

const {
  CREATE_AUTOMATIC_MUTATION,
  CREATE_CODE_MUTATION,
  UPDATE_AUTOMATIC_MUTATION,
  UPDATE_CODE_MUTATION,
  METAFIELDS_SET_MUTATION,
  DELETE_AUTOMATIC_MUTATION,
  DELETE_CODE_MUTATION,
  ENABLE_MUTATION,
  DISABLE_MUTATION,
  ENABLE_CODE_MUTATION,
  DISABLE_CODE_MUTATION,
} = require("./graphqlQuery");

const FUNCTION_HANDLE = "custom-discount";

const DISCOUNT_CLASSES_BY_TYPE = {
  1: ["PRODUCT"],
  2: ["SHIPPING"],
  3: ["ORDER"],
};

const CONFIG_METAFIELD = {
  namespace: "$app:custom-discount",
  key: "function-configuration",
};

const getDiscountClasses = (functionType) =>
  DISCOUNT_CLASSES_BY_TYPE[String(functionType)] || ["PRODUCT"];

const getCombinesWith = (
  functionType,
  combinesWithProduct,
  combinesWithOrder,
  combinesWithShipping,
  configuration
) => {
  const fType = String(functionType || "1");
  const shipType = configuration?.shippingDiscountType || "discount";
  return {
    productDiscounts: Boolean(combinesWithProduct),
    orderDiscounts: Boolean(combinesWithOrder),
    shippingDiscounts:
      fType === "2" && shipType === "free_shipping"
        ? false
        : Boolean(combinesWithShipping),
  };
};

const formatShopifyErrors = (errors) => {
  const messages = errors.map((e) => e.message);
  const titleConflict = messages.some((m) =>
    /title must be unique/i.test(m || "")
  );
  if (titleConflict) {
    return `A discount with this title already exists in Shopify. Either choose a different title, or remove the existing one from Shopify Admin → Discounts before recreating it.`;
  }
  return `Shopify error: ${messages.join(", ")}`;
};

const createShopifyDiscount = async ({
  graphqlClient,
  method,
  title,
  code,
  startsAt,
  endsAt,
  combinesWith,
  functionConfigValue,
  configuration,
  discountClasses,
}) => {
  if (method === "Automatic") {
    const variables = {
      automaticAppDiscount: {
        title,
        functionHandle: FUNCTION_HANDLE,
        discountClasses,
        startsAt: startsAt || new Date().toISOString(),
        endsAt: endsAt || null,
        combinesWith,
        metafields: [
          {
            namespace: CONFIG_METAFIELD.namespace,
            key: CONFIG_METAFIELD.key,
            type: "json",
            value: functionConfigValue,
          },
        ],
      },
    };

    const shopifyRes = await graphqlClient.request(CREATE_AUTOMATIC_MUTATION, {
      variables,
    });
    const errors =
      shopifyRes.data?.discountAutomaticAppCreate?.userErrors || [];
    if (errors.length > 0) {
      throw new Error(formatShopifyErrors(errors));
    }
    return shopifyRes.data?.discountAutomaticAppCreate?.automaticAppDiscount
      ?.discountId;
  } else {
    const variables = {
      codeAppDiscount: {
        title,
        code,
        functionHandle: FUNCTION_HANDLE,
        discountClasses,
        startsAt: startsAt || new Date().toISOString(),
        endsAt: endsAt || null,
        combinesWith,
        metafields: [
          {
            namespace: CONFIG_METAFIELD.namespace,
            key: CONFIG_METAFIELD.key,
            type: "json",
            value: functionConfigValue,
          },
        ],
        usageLimit:
          configuration?.limitTotalUses && configuration?.limitTotalUsesValue
            ? parseInt(configuration.limitTotalUsesValue, 10)
            : null,
        appliesOncePerCustomer: Boolean(configuration?.limitOnePerCustomer),
      },
    };

    const shopifyRes = await graphqlClient.request(CREATE_CODE_MUTATION, {
      variables,
    });
    const errors = shopifyRes.data?.discountCodeAppCreate?.userErrors || [];
    if (errors.length > 0) {
      throw new Error(formatShopifyErrors(errors));
    }
    return shopifyRes.data?.discountCodeAppCreate?.codeAppDiscount?.discountId;
  }
};

const setConfigMetafield = async ({
  graphqlClient,
  ownerId,
  functionConfigValue,
}) => {
  const res = await graphqlClient.request(METAFIELDS_SET_MUTATION, {
    variables: {
      metafields: [
        {
          ownerId,
          namespace: CONFIG_METAFIELD.namespace,
          key: CONFIG_METAFIELD.key,
          type: "json",
          value: functionConfigValue,
        },
      ],
    },
  });
  const errors = res.data?.metafieldsSet?.userErrors || [];
  if (errors.length > 0) {
    throw new Error(
      `Shopify metafield error: ${errors.map((e) => e.message).join(", ")}`
    );
  }
};

const listCustomDiscounts = async (req, res) => {
  try {
    const shop = await getShopRecord(req);
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = parsePageSize(req.query.limit, 10, 50);
    const offset = (page - 1) * limit;

    const { count: total, rows: customizations } =
      await CustomDiscount.findAndCountAll({
        where: { shopId: shop.id },
        order: [["updatedAt", "DESC"]],
        limit,
        offset,
      });

    const totalPages = Math.max(1, Math.ceil(total / limit));

    successResponse(res, 200, "Custom discounts fetched successfully", {
      customizations,
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
    console.error("Error listing custom discounts:", error);
    handleError(res, error, "Failed to list custom discounts");
  }
};

const getCustomDiscount = async (req, res) => {
  try {
    const shop = await getShopRecord(req);
    const { id } = req.params;

    const customization = await CustomDiscount.findOne({
      where: {
        shopifyId: {
          [Op.like]: `%/${id}`,
        },
        shopId: shop.id,
      },
    });

    if (!customization) {
      return errorResponse(res, 404, "Custom discount not found");
    }

    successResponse(
      res,
      200,
      "Custom discount fetched successfully",
      customization
    );
  } catch (error) {
    console.error("Error fetching custom discount:", error);
    handleError(res, error, "Failed to fetch custom discount");
  }
};

const createCustomDiscount = async (req, res) => {
  try {
    const shop = await getShopRecord(req);
    const {
      title,
      method,
      code,
      startsAt,
      endsAt,
      combinesWithProduct,
      combinesWithOrder,
      combinesWithShipping,
      configuration, // JSON object
      functionType,
    } = req.body;

    if (!title || !method || !configuration) {
      return errorResponse(res, 400, "Missing required fields");
    }

    if (method === "Code" && !code) {
      return errorResponse(
        res,
        400,
        "Discount code is required for Code method"
      );
    }

    const { graphqlClient } = getGraphQLClient({
      shopDomain: shop.myshopifyDomain,
      accessToken: shop.token,
    });

    const functionConfigValue = JSON.stringify(configuration);
    const combinesWith = getCombinesWith(
      functionType,
      combinesWithProduct,
      combinesWithOrder,
      combinesWithShipping,
      configuration
    );

    const shopifyId = await createShopifyDiscount({
      graphqlClient,
      method,
      title,
      code,
      startsAt,
      endsAt,
      combinesWith,
      functionConfigValue,
      configuration,
      discountClasses: getDiscountClasses(functionType),
    });

    await setConfigMetafield({
      graphqlClient,
      ownerId: shopifyId,
      functionConfigValue,
    });

    const newRecord = await CustomDiscount.create({
      shopId: shop.id,
      shopifyId,
      title,
      method,
      status: "active",
      startsAt: startsAt || new Date(),
      endsAt: endsAt || null,
      combinesWithProduct: combinesWith.productDiscounts,
      combinesWithOrder: combinesWith.orderDiscounts,
      combinesWithShipping: combinesWith.shippingDiscounts,
      configuration: JSON.stringify(configuration),
      functionType: functionType || "1",
    });

    successResponse(
      res,
      201,
      "Custom discount created successfully",
      newRecord
    );
  } catch (error) {
    console.error("Error creating custom discount:", error);
    handleError(res, error, "Failed to create custom discount");
  }
};

const updateCustomDiscount = async (req, res) => {
  try {
    const shop = await getShopRecord(req);
    const { id } = req.params;
    const {
      title,
      method,
      code,
      startsAt,
      endsAt,
      combinesWithProduct,
      combinesWithOrder,
      combinesWithShipping,
      configuration,
      functionType,
    } = req.body;

    const customization = await CustomDiscount.findOne({
      where: {
        shopifyId: {
          [Op.like]: `%/${id}`,
        },
        shopId: shop.id,
      },
    });

    if (!customization) {
      return errorResponse(res, 404, "Custom discount not found");
    }

    const { graphqlClient } = getGraphQLClient({
      shopDomain: shop.myshopifyDomain,
      accessToken: shop.token,
    });

    const methodChanged = method && method !== customization.method;
    const combinesWith = getCombinesWith(
      functionType || customization.functionType,
      combinesWithProduct,
      combinesWithOrder,
      combinesWithShipping,
      configuration
    );

    if (methodChanged) {
      // 1. Delete old discount on Shopify (use the mutation for its OLD method)
      try {
        const oldIsAutomatic = customization.method !== "Code";
        const deleteRes = await graphqlClient.request(
          oldIsAutomatic ? DELETE_AUTOMATIC_MUTATION : DELETE_CODE_MUTATION,
          { variables: { id: customization.shopifyId } }
        );
        const deleteErrors =
          (oldIsAutomatic
            ? deleteRes.data?.discountAutomaticDelete?.userErrors
            : deleteRes.data?.discountCodeDelete?.userErrors) || [];
        if (deleteErrors.length > 0) {
          console.warn(
            `Shopify delete warnings for GID ${customization.shopifyId} during method change:`,
            deleteErrors
          );
        }
      } catch (shopifyError) {
        console.error(
          `Could not delete old discount ${customization.shopifyId} on Shopify during method change:`,
          shopifyError.message
        );
      }

      // 2. Create new discount on Shopify with the new method
      const functionConfigValue = JSON.stringify(configuration);

      const newShopifyId = await createShopifyDiscount({
        graphqlClient,
        method,
        title,
        code,
        startsAt,
        endsAt,
        combinesWith,
        functionConfigValue,
        configuration,
        discountClasses: getDiscountClasses(
          functionType || customization.functionType
        ),
      });

      // 2b. Attach the config metafield to the newly created discount node.
      await setConfigMetafield({
        graphqlClient,
        ownerId: newShopifyId,
        functionConfigValue,
      });

      // 3. Update database record with new GID and method
      await customization.update({
        shopifyId: newShopifyId,
        method,
        title,
        startsAt: startsAt || customization.startsAt,
        endsAt: endsAt || null,
        combinesWithProduct: combinesWith.productDiscounts,
        combinesWithOrder: combinesWith.orderDiscounts,
        combinesWithShipping: combinesWith.shippingDiscounts,
        configuration: JSON.stringify(configuration),
        functionType: functionType || customization.functionType || "1",
      });
    } else {
      // 1. Update fields on Shopify (Method has not changed)
      const functionConfigValue = JSON.stringify(configuration);

      if (customization.method === "Automatic") {
        const variables = {
          id: customization.shopifyId,
          automaticAppDiscount: {
            title,
            discountClasses: getDiscountClasses(
              functionType || customization.functionType
            ),
            startsAt: startsAt || new Date().toISOString(),
            endsAt: endsAt || null,
            combinesWith: {
              productDiscounts: combinesWith.productDiscounts,
              orderDiscounts: combinesWith.orderDiscounts,
              shippingDiscounts: combinesWith.shippingDiscounts,
            },
          },
        };

        const shopifyRes = await graphqlClient.request(
          UPDATE_AUTOMATIC_MUTATION,
          { variables }
        );
        const errors =
          shopifyRes.data?.discountAutomaticAppUpdate?.userErrors || [];
        if (errors.length > 0) {
          return errorResponse(
            res,
            400,
            `Shopify error: ${errors.map((e) => e.message).join(", ")}`
          );
        }
      } else {
        const variables = {
          id: customization.shopifyId,
          codeAppDiscount: {
            title,
            code: code || configuration.code,
            discountClasses: getDiscountClasses(
              functionType || customization.functionType
            ),
            startsAt: startsAt || new Date().toISOString(),
            endsAt: endsAt || null,
            combinesWith: {
              productDiscounts: combinesWith.productDiscounts,
              orderDiscounts: combinesWith.orderDiscounts,
              shippingDiscounts: combinesWith.shippingDiscounts,
            },
            usageLimit:
              configuration?.limitTotalUses &&
              configuration?.limitTotalUsesValue
                ? parseInt(configuration.limitTotalUsesValue, 10)
                : null,
            appliesOncePerCustomer: Boolean(configuration?.limitOnePerCustomer),
          },
        };

        const shopifyRes = await graphqlClient.request(UPDATE_CODE_MUTATION, {
          variables,
        });
        const errors = shopifyRes.data?.discountCodeAppUpdate?.userErrors || [];
        if (errors.length > 0) {
          return errorResponse(
            res,
            400,
            `Shopify error: ${errors.map((e) => e.message).join(", ")}`
          );
        }
      }

      // 2. Set the Metafield
      const metafieldVariables = {
        metafields: [
          {
            ownerId: customization.shopifyId,
            namespace: CONFIG_METAFIELD.namespace,
            key: CONFIG_METAFIELD.key,
            type: "json",
            value: functionConfigValue,
          },
        ],
      };

      const metafieldRes = await graphqlClient.request(
        METAFIELDS_SET_MUTATION,
        {
          variables: metafieldVariables,
        }
      );
      const mfErrors = metafieldRes.data?.metafieldsSet?.userErrors || [];
      if (mfErrors.length > 0) {
        return errorResponse(
          res,
          400,
          `Shopify metafield error: ${mfErrors
            .map((e) => e.message)
            .join(", ")}`
        );
      }

      // 3. Update locally
      await customization.update({
        title,
        startsAt: startsAt || customization.startsAt,
        endsAt: endsAt || null,
        combinesWithProduct: combinesWith.productDiscounts,
        combinesWithOrder: combinesWith.orderDiscounts,
        combinesWithShipping: combinesWith.shippingDiscounts,
        configuration: JSON.stringify(configuration),
        functionType: functionType || customization.functionType || "1",
      });
    }

    successResponse(
      res,
      200,
      "Custom discount updated successfully",
      customization
    );
  } catch (error) {
    console.error("Error updating custom discount:", error);
    handleError(res, error, "Failed to update custom discount");
  }
};

const deleteCustomDiscounts = async (req, res) => {
  try {
    const shop = await getShopRecord(req);
    const { ids } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return errorResponse(
        res,
        400,
        "Missing list of custom discount ids to delete"
      );
    }

    const { graphqlClient } = getGraphQLClient({
      shopDomain: shop.myshopifyDomain,
      accessToken: shop.token,
    });

    const deletedLocalIds = [];

    for (const id of ids) {
      const customization = await CustomDiscount.findOne({
        where: {
          shopifyId: {
            [Op.like]: `%/${id}`,
          },
          shopId: shop.id,
        },
      });
      if (customization) {
        let shopifyDeleted = false;
        try {
          const isAutomatic = customization.method !== "Code";
          const mutation = isAutomatic
            ? DELETE_AUTOMATIC_MUTATION
            : DELETE_CODE_MUTATION;

          const shopifyRes = await graphqlClient.request(mutation, {
            variables: { id: customization.shopifyId },
          });

          const result =
            (isAutomatic
              ? shopifyRes.data?.discountAutomaticDelete
              : shopifyRes.data?.discountCodeDelete) || {};
          const deletedId = isAutomatic
            ? result.deletedAutomaticDiscountId
            : result.deletedCodeDiscountId;
          const errors = result.userErrors || [];
          const alreadyGone = errors.some((e) => {
            const msg = (e.message || "").toLowerCase();
            return (
              msg.includes("not found") ||
              msg.includes("could not find") ||
              msg.includes("does not exist") ||
              msg.includes("doesn't exist")
            );
          });

          if (deletedId || alreadyGone) {
            shopifyDeleted = true;
          } else if (errors.length > 0) {
            return errorResponse(
              res,
              400,
              `Shopify error: ${errors.map((e) => e.message).join(", ")}`
            );
          } else {
            return errorResponse(
              res,
              400,
              "Shopify did not confirm the discount was deleted. Please try again."
            );
          }
        } catch (shopifyError) {
          console.error(
            `Could not delete discount ${customization.shopifyId} on Shopify:`,
            shopifyError
          );
          return handleError(res, shopifyError, "Failed to delete discount on Shopify");
        }

        if (shopifyDeleted) {
          await customization.destroy();
          deletedLocalIds.push(customization.id);
        }
      }
    }

    successResponse(res, 200, "Custom discounts deleted successfully", {
      deletedIds: deletedLocalIds,
    });
  } catch (error) {
    console.error("Error deleting custom discounts:", error);
    handleError(res, error, "Failed to delete custom discounts");
  }
};

const toggleDiscountStatus = async (req, res) => {
  try {
    const shop = await getShopRecord(req);
    const { id } = req.params;
    const { status } = req.body; // "active" | "inactive"

    const customization = await CustomDiscount.findOne({
      where: {
        shopifyId: {
          [Op.like]: `%/${id}`,
        },
        shopId: shop.id,
      },
    });

    if (!customization) {
      return errorResponse(res, 404, "Custom discount not found");
    }

    const { graphqlClient } = getGraphQLClient({
      shopDomain: shop.myshopifyDomain,
      accessToken: shop.token,
    });

    const isAutomatic = customization.method === "Automatic";
    const activate = status === "active";

    let mutation;
    let resultKey;
    if (isAutomatic) {
      mutation = activate ? ENABLE_MUTATION : DISABLE_MUTATION;
      resultKey = activate
        ? "discountAutomaticActivate"
        : "discountAutomaticDeactivate";
    } else {
      mutation = activate ? ENABLE_CODE_MUTATION : DISABLE_CODE_MUTATION;
      resultKey = activate ? "discountCodeActivate" : "discountCodeDeactivate";
    }

    const shopifyRes = await graphqlClient.request(mutation, {
      variables: { id: customization.shopifyId },
    });

    const errors = shopifyRes.data?.[resultKey]?.userErrors || [];
    if (errors.length > 0) {
      return errorResponse(
        res,
        400,
        `Shopify error: ${errors.map((e) => e.message).join(", ")}`
      );
    }

    await customization.update({ status: activate ? "active" : "inactive" });

    successResponse(res, 200, "Discount status updated", {
      status: activate ? "active" : "inactive",
    });
  } catch (error) {
    console.error("Error toggling discount status:", error);
    handleError(res, error, "Failed to toggle discount status");
  }
};

module.exports = {
  listCustomDiscounts,
  getCustomDiscount,
  createCustomDiscount,
  updateCustomDiscount,
  deleteCustomDiscounts,
  toggleDiscountStatus,
};
