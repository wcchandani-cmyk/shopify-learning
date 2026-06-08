const { SEQUELIZE_DATA_TYPE } = require("../../config/constants");
const sequelize = require("../../config/db");

const Variant = sequelize.define(
  "variant",
  {
    id: {
      type: SEQUELIZE_DATA_TYPE.INTEGER,
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
    },
    productId: {
      type: SEQUELIZE_DATA_TYPE.INTEGER,
      allowNull: false,
      references: {
        model: "products",
        key: "id",
      },
    },
    shopifyId: {
      type: SEQUELIZE_DATA_TYPE.BIGINT,
      allowNull: false,
      unique: true,
      comment: "Shopify REST variant id",
    },
    title: {
      type: SEQUELIZE_DATA_TYPE.STRING(255),
      allowNull: true,
    },
    price: {
      type: SEQUELIZE_DATA_TYPE.DECIMAL(12, 2),
      allowNull: true,
    },
    compareAtPrice: {
      type: SEQUELIZE_DATA_TYPE.DECIMAL(12, 2),
      allowNull: true,
    },
    position: {
      type: SEQUELIZE_DATA_TYPE.INTEGER,
      allowNull: true,
    },
    inventoryPolicy: {
      type: SEQUELIZE_DATA_TYPE.STRING(20),
      allowNull: true,
      comment: "deny | continue",
    },
    option1: {
      type: SEQUELIZE_DATA_TYPE.STRING(255),
      allowNull: true,
    },
    option2: {
      type: SEQUELIZE_DATA_TYPE.STRING(255),
      allowNull: true,
    },
    option3: {
      type: SEQUELIZE_DATA_TYPE.STRING(255),
      allowNull: true,
    },
    barcode: {
      type: SEQUELIZE_DATA_TYPE.STRING(255),
      allowNull: true,
    },
    sku: {
      type: SEQUELIZE_DATA_TYPE.STRING(255),
      allowNull: true,
    },
    inventoryQuantity: {
      type: SEQUELIZE_DATA_TYPE.INTEGER,
      allowNull: true,
      defaultValue: 0,
    },
  },
  {
    timestamps: true,
    indexes: [
      {
        fields: ["productId"],
      },
      {
        fields: ["sku"],
      },
    ],
  },
);

module.exports = Variant;
