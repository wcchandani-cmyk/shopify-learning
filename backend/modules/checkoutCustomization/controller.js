const { successResponse, errorResponse } = require("../../utils/response");
const { handleError } = require("../../utils/controllerHelper");
const CheckoutCustomization = require("./model");
const { VALID_TYPES, buildPayload, buildUpdatePayload } = require("./helpers");
const Shop = require("../shop/model");

exports.getAll = async (req, res) => {
  try {
    const where = { shopId: req.shop.id };
    if (req.query.type && VALID_TYPES.includes(req.query.type)) {
      where.type = req.query.type;
    }
    const records = await CheckoutCustomization.findAll({
      where,
      order: [["createdAt", "DESC"]],
    });
    successResponse(res, 200, "Checkout customizations fetched", { customizations: records });
  } catch (error) {
    handleError(res, error, "Failed to fetch checkout customizations");
  }
};

exports.getPublic = async (req, res) => {
  try {
    const shopDomain = req.query.shop;
    const type = req.query.type;

    if (!shopDomain) {
      return errorResponse(res, 400, "shop query param is required");
    }

    const shop = await Shop.findOne({ where: { myshopifyDomain: shopDomain } });
    if (!shop) {
      return errorResponse(res, 404, "Shop not found");
    }

    const where = { shopId: shop.id, isActive: true };
    if (type && VALID_TYPES.includes(type)) {
      where.type = type;
    }

    const records = await CheckoutCustomization.findAll({
      where,
      order: [["createdAt", "DESC"]],
    });

    // Parse JSON fields before returning
    const parsed = records.map((r) => {
      const raw = r.toJSON();
      return {
        ...raw,
        fields: raw.fields ? JSON.parse(raw.fields) : [],
        contents: raw.contents ? JSON.parse(raw.contents) : [],
        displayConditions: raw.displayConditions ? JSON.parse(raw.displayConditions) : null,
      };
    });

    successResponse(res, 200, "Checkout customizations fetched", { customizations: parsed });
  } catch (error) {
    handleError(res, error, "Failed to fetch public checkout customizations");
  }
};

exports.getById = async (req, res) => {
  try {
    const record = await CheckoutCustomization.findOne({
      where: { id: req.params.id, shopId: req.shop.id },
    });
    if (!record) return errorResponse(res, 404, "Checkout customization not found");
    successResponse(res, 200, "Checkout customization fetched", { customization: record });
  } catch (error) {
    handleError(res, error, "Failed to fetch checkout customization");
  }
};

exports.create = async (req, res) => {
  try {
    const { type } = req.body;
    if (!type || !VALID_TYPES.includes(type)) {
      return errorResponse(res, 400, `type is required and must be one of: ${VALID_TYPES.join(", ")}`);
    }
    const payload = buildPayload(req.body, type);
    if (!payload.internalName) {
      return errorResponse(res, 400, "internalName is required");
    }
    payload.shopId = req.shop.id;
    const record = await CheckoutCustomization.create(payload);
    successResponse(res, 201, "Checkout customization created successfully", { customization: record });
  } catch (error) {
    handleError(res, error, "Failed to create checkout customization");
  }
};

exports.update = async (req, res) => {
  try {
    const record = await CheckoutCustomization.findOne({
      where: { id: req.params.id, shopId: req.shop.id },
    });
    if (!record) return errorResponse(res, 404, "Checkout customization not found");
    const payload = buildUpdatePayload(req.body, record);
    if (!payload.internalName) {
      return errorResponse(res, 400, "internalName is required");
    }
    await record.update(payload);
    successResponse(res, 200, "Checkout customization updated successfully", { customization: record });
  } catch (error) {
    handleError(res, error, "Failed to update checkout customization");
  }
};

exports.deleted = async (req, res) => {
  try {
    const record = await CheckoutCustomization.findOne({
      where: { id: req.params.id, shopId: req.shop.id },
    });
    if (!record) return errorResponse(res, 404, "Checkout customization not found");
    await record.destroy();
    successResponse(res, 200, "Checkout customization deleted successfully", { deletedId: req.params.id });
  } catch (error) {
    handleError(res, error, "Failed to delete checkout customization");
  }
};
