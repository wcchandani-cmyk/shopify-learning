const { SEQUELIZE_DATA_TYPE } = require("../../config/constants");
const sequelize = require("../../config/db");

const Order = sequelize.define(
  "order",
  {
    id: {
      type: SEQUELIZE_DATA_TYPE.INTEGER,
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
    },
    shopId: {
      type: SEQUELIZE_DATA_TYPE.INTEGER,
      allowNull: false,
      references: {
        model: "shops",
        key: "id",
      },
    },
    customerId: {
      type: SEQUELIZE_DATA_TYPE.INTEGER,
      allowNull: true,
      references: {
        model: "customers",
        key: "id",
      },
    },
    shopifyId: {
      type: SEQUELIZE_DATA_TYPE.BIGINT,
      allowNull: false,
    },
    orderNumber: {
      type: SEQUELIZE_DATA_TYPE.INTEGER,
      allowNull: true,
    },
    name: {
      type: SEQUELIZE_DATA_TYPE.STRING(255),
      allowNull: true,
    },
    email: {
      type: SEQUELIZE_DATA_TYPE.STRING(320),
      allowNull: true,
    },
    phone: {
      type: SEQUELIZE_DATA_TYPE.STRING(50),
      allowNull: true,
    },
    totalPrice: {
      type: SEQUELIZE_DATA_TYPE.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0.0,
    },
    subtotalPrice: {
      type: SEQUELIZE_DATA_TYPE.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0.0,
    },
    totalTax: {
      type: SEQUELIZE_DATA_TYPE.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0.0,
    },
    totalShipping: {
      type: SEQUELIZE_DATA_TYPE.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0.0,
    },
    currency: {
      type: SEQUELIZE_DATA_TYPE.STRING(10),
      allowNull: true,
    },
    financialStatus: {
      type: SEQUELIZE_DATA_TYPE.STRING(50),
      allowNull: true,
    },
    fulfillmentStatus: {
      type: SEQUELIZE_DATA_TYPE.STRING(50),
      allowNull: true,
    },
    shopifyCreatedAt: {
      type: SEQUELIZE_DATA_TYPE.DATE,
      allowNull: true,
    },
    shopifyUpdatedAt: {
      type: SEQUELIZE_DATA_TYPE.DATE,
      allowNull: true,
    },
    lineItems: {
      type: SEQUELIZE_DATA_TYPE.TEXT,
      allowNull: true,
      comment: "JSON stringified line items",
    },
    shippingAddress: {
      type: SEQUELIZE_DATA_TYPE.TEXT,
      allowNull: true,
      comment: "JSON stringified shipping address",
    },
    billingAddress: {
      type: SEQUELIZE_DATA_TYPE.TEXT,
      allowNull: true,
      comment: "JSON stringified billing address",
    },
    note: {
      type: SEQUELIZE_DATA_TYPE.TEXT,
      allowNull: true,
    },
    tags: {
      type: SEQUELIZE_DATA_TYPE.TEXT,
      allowNull: true,
    },
    channel: {
      type: SEQUELIZE_DATA_TYPE.STRING(100),
      allowNull: true,
    },
    testOrder: {
      type: SEQUELIZE_DATA_TYPE.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
  },
  {
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ["shopId", "shopifyId"],
      },
      {
        fields: ["shopId"],
      },
    ],
  }
);

module.exports = Order;
