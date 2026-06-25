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
  if (messages.some((m) => /title must be unique/i.test(m || ""))) {
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
  const isAutomatic = method === "Automatic";
  const common = {
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
  };

  const variables = isAutomatic
    ? { automaticAppDiscount: common }
    : {
        codeAppDiscount: {
          ...common,
          code,
          usageLimit:
            configuration?.limitTotalUses && configuration?.limitTotalUsesValue
              ? parseInt(configuration.limitTotalUsesValue, 10)
              : null,
          appliesOncePerCustomer: Boolean(configuration?.limitOnePerCustomer),
        },
      };

  const shopifyRes = await graphqlClient.request(
    isAutomatic ? CREATE_AUTOMATIC_MUTATION : CREATE_CODE_MUTATION,
    { variables }
  );
  const result = isAutomatic
    ? shopifyRes.data?.discountAutomaticAppCreate
    : shopifyRes.data?.discountCodeAppCreate;
  const errors = result?.userErrors || [];
  if (errors.length > 0) throw new Error(formatShopifyErrors(errors));
  return isAutomatic
    ? result?.automaticAppDiscount?.discountId
    : result?.codeAppDiscount?.discountId;
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
  if (errors.length > 0)
    throw new Error(
      `Shopify metafield error: ${errors.map((e) => e.message).join(", ")}`
    );
};

const listCustomDiscounts = async (req, res) => {
  try {
    const shop = await getShopRecord(req);
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = parsePageSize(req.query.limit, 10, 50);

    const { count: total, rows: customizations } =
      await CustomDiscount.findAndCountAll({
        where: { shopId: shop.id },
        order: [["updatedAt", "DESC"]],
        limit,
        offset: (page - 1) * limit,
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
    handleError(res, error, "Failed to list custom discounts");
  }
};

const getCustomDiscount = async (req, res) => {
  try {
    const customization = await CustomDiscount.findOne({
      where: {
        shopifyId: { [Op.like]: `%/${req.params.id}` },
        shopId: (await getShopRecord(req)).id,
      },
    });
    if (!customization)
      return errorResponse(res, 404, "Custom discount not found");
    successResponse(
      res,
      200,
      "Custom discount fetched successfully",
      customization
    );
  } catch (error) {
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
      configuration,
      functionType,
    } = req.body;

    if (!title || !method || !configuration)
      return errorResponse(res, 400, "Missing required fields");
    if (method === "Code" && !code)
      return errorResponse(
        res,
        400,
        "Discount code is required for Code method"
      );

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
      where: { shopifyId: { [Op.like]: `%/${id}` }, shopId: shop.id },
    });
    if (!customization)
      return errorResponse(res, 404, "Custom discount not found");

    const { graphqlClient } = getGraphQLClient({
      shopDomain: shop.myshopifyDomain,
      accessToken: shop.token,
    });
    const fType = functionType || customization.functionType || "1";
    const combinesWith = getCombinesWith(
      fType,
      combinesWithProduct,
      combinesWithOrder,
      combinesWithShipping,
      configuration
    );
    const functionConfigValue = JSON.stringify(configuration);

    if (method && method !== customization.method) {
      try {
        const oldIsAutomatic = customization.method !== "Code";
        await graphqlClient.request(
          oldIsAutomatic ? DELETE_AUTOMATIC_MUTATION : DELETE_CODE_MUTATION,
          {
            variables: { id: customization.shopifyId },
          }
        );
      } catch (shopifyError) {
        console.error(
          `Could not delete old discount during method change:`,
          shopifyError.message
        );
      }

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
        discountClasses: getDiscountClasses(fType),
      });

      await setConfigMetafield({
        graphqlClient,
        ownerId: newShopifyId,
        functionConfigValue,
      });

      await customization.update({
        shopifyId: newShopifyId,
        method,
        title,
        startsAt: startsAt || customization.startsAt,
        endsAt: endsAt || null,
        combinesWithProduct: combinesWith.productDiscounts,
        combinesWithOrder: combinesWith.orderDiscounts,
        combinesWithShipping: combinesWith.shippingDiscounts,
        configuration: functionConfigValue,
        functionType: fType,
      });
    } else {
      const isAutomatic = customization.method === "Automatic";
      const variables = { id: customization.shopifyId };
      const commonDetails = {
        title,
        discountClasses: getDiscountClasses(fType),
        startsAt: startsAt || new Date().toISOString(),
        endsAt: endsAt || null,
        combinesWith: {
          productDiscounts: combinesWith.productDiscounts,
          orderDiscounts: combinesWith.orderDiscounts,
          shippingDiscounts: combinesWith.shippingDiscounts,
        },
      };

      if (isAutomatic) {
        variables.automaticAppDiscount = commonDetails;
      } else {
        variables.codeAppDiscount = {
          ...commonDetails,
          code: code || configuration.code,
          usageLimit:
            configuration?.limitTotalUses && configuration?.limitTotalUsesValue
              ? parseInt(configuration.limitTotalUsesValue, 10)
              : null,
          appliesOncePerCustomer: Boolean(configuration?.limitOnePerCustomer),
        };
      }

      const shopifyRes = await graphqlClient.request(
        isAutomatic ? UPDATE_AUTOMATIC_MUTATION : UPDATE_CODE_MUTATION,
        { variables }
      );
      const errors =
        (isAutomatic
          ? shopifyRes.data?.discountAutomaticAppUpdate
          : shopifyRes.data?.discountCodeAppUpdate
        )?.userErrors || [];
      if (errors.length > 0)
        return errorResponse(
          res,
          400,
          `Shopify error: ${errors.map((e) => e.message).join(", ")}`
        );

      await setConfigMetafield({
        graphqlClient,
        ownerId: customization.shopifyId,
        functionConfigValue,
      });

      await customization.update({
        title,
        startsAt: startsAt || customization.startsAt,
        endsAt: endsAt || null,
        combinesWithProduct: combinesWith.productDiscounts,
        combinesWithOrder: combinesWith.orderDiscounts,
        combinesWithShipping: combinesWith.shippingDiscounts,
        configuration: functionConfigValue,
        functionType: fType,
      });
    }

    successResponse(
      res,
      200,
      "Custom discount updated successfully",
      customization
    );
  } catch (error) {
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
        where: { shopifyId: { [Op.like]: `%/${id}` }, shopId: shop.id },
      });
      if (customization) {
        let shopifyDeleted = false;
        try {
          const isAutomatic = customization.method !== "Code";
          const shopifyRes = await graphqlClient.request(
            isAutomatic ? DELETE_AUTOMATIC_MUTATION : DELETE_CODE_MUTATION,
            {
              variables: { id: customization.shopifyId },
            }
          );

          const result =
            (isAutomatic
              ? shopifyRes.data?.discountAutomaticDelete
              : shopifyRes.data?.discountCodeDelete) || {};
          const errors = result.userErrors || [];
          const alreadyGone = errors.some((e) =>
            /(not found|could not find|does not exist)/i.test(e.message || "")
          );

          if (
            result.deletedAutomaticDiscountId ||
            result.deletedCodeDiscountId ||
            alreadyGone
          ) {
            shopifyDeleted = true;
          } else if (errors.length > 0) {
            return errorResponse(
              res,
              400,
              `Shopify error: ${errors.map((e) => e.message).join(", ")}`
            );
          }
        } catch (shopifyError) {
          console.error(
            `Could not delete discount ${customization.shopifyId} on Shopify:`,
            shopifyError
          );
          return handleError(
            res,
            shopifyError,
            "Failed to delete discount on Shopify"
          );
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
    handleError(res, error, "Failed to delete custom discounts");
  }
};

const toggleDiscountStatus = async (req, res) => {
  try {
    const shop = await getShopRecord(req);
    const { id } = req.params;
    const { status } = req.body;

    const customization = await CustomDiscount.findOne({
      where: { shopifyId: { [Op.like]: `%/${id}` }, shopId: shop.id },
    });
    if (!customization)
      return errorResponse(res, 404, "Custom discount not found");

    const { graphqlClient } = getGraphQLClient({
      shopDomain: shop.myshopifyDomain,
      accessToken: shop.token,
    });
    const isAutomatic = customization.method === "Automatic";
    const activate = status === "active";

    const mutation = isAutomatic
      ? activate
        ? ENABLE_MUTATION
        : DISABLE_MUTATION
      : activate
      ? ENABLE_CODE_MUTATION
      : DISABLE_CODE_MUTATION;
    const resultKey = isAutomatic
      ? activate
        ? "discountAutomaticActivate"
        : "discountAutomaticDeactivate"
      : activate
      ? "discountCodeActivate"
      : "discountCodeDeactivate";

    const shopifyRes = await graphqlClient.request(mutation, {
      variables: { id: customization.shopifyId },
    });
    const errors = shopifyRes.data?.[resultKey]?.userErrors || [];
    if (errors.length > 0)
      return errorResponse(
        res,
        400,
        `Shopify error: ${errors.map((e) => e.message).join(", ")}`
      );

    await customization.update({ status: activate ? "active" : "inactive" });
    successResponse(res, 200, "Discount status updated", {
      status: activate ? "active" : "inactive",
    });
  } catch (error) {
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
