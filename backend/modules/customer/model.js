const { SEQUELIZE_DATA_TYPE } = require("../../config/constants");
const sequelize = require("../../config/db");

const Customer = sequelize.define(
  "customer",
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
    shopifyId: {
      type: SEQUELIZE_DATA_TYPE.BIGINT,
      allowNull: false,
      comment: "Shopify REST customer id",
    },
    firstName: {
      type: SEQUELIZE_DATA_TYPE.STRING(255),
      allowNull: true,
    },
    lastName: {
      type: SEQUELIZE_DATA_TYPE.STRING(255),
      allowNull: true,
    },
    displayName: {
      type: SEQUELIZE_DATA_TYPE.STRING(500),
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
    locale: {
      type: SEQUELIZE_DATA_TYPE.STRING(20),
      allowNull: true,
      comment: "Customer notification language, e.g. en",
    },
    emailSubscribed: {
      type: SEQUELIZE_DATA_TYPE.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: "true when email marketing state is subscribed",
    },
    smsSubscribed: {
      type: SEQUELIZE_DATA_TYPE.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: "true when SMS marketing state is subscribed",
    },
    taxExempt: {
      type: SEQUELIZE_DATA_TYPE.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: "true = do not collect tax for this customer",
    },
    note: {
      type: SEQUELIZE_DATA_TYPE.TEXT,
      allowNull: true,
    },
    tags: {
      type: SEQUELIZE_DATA_TYPE.TEXT,
      allowNull: true,
    },
    numberOfOrders: {
      type: SEQUELIZE_DATA_TYPE.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    amountSpent: {
      type: SEQUELIZE_DATA_TYPE.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
    },
    currencyCode: {
      type: SEQUELIZE_DATA_TYPE.STRING(10),
      allowNull: true,
    },
    addressId: {
      type: SEQUELIZE_DATA_TYPE.STRING(100),
      allowNull: true,
      comment: "Default address id (REST numeric), used to update it in place",
    },
    company: {
      type: SEQUELIZE_DATA_TYPE.STRING(255),
      allowNull: true,
    },
    address1: {
      type: SEQUELIZE_DATA_TYPE.STRING(500),
      allowNull: true,
    },
    address2: {
      type: SEQUELIZE_DATA_TYPE.STRING(500),
      allowNull: true,
    },
    city: {
      type: SEQUELIZE_DATA_TYPE.STRING(255),
      allowNull: true,
    },
    province: {
      type: SEQUELIZE_DATA_TYPE.STRING(255),
      allowNull: true,
      comment: "State/Province full name, e.g. Maharashtra",
    },
    country: {
      type: SEQUELIZE_DATA_TYPE.STRING(255),
      allowNull: true,
      comment: "Country full name, e.g. India",
    },
    zip: {
      type: SEQUELIZE_DATA_TYPE.STRING(30),
      allowNull: true,
    },
    addressPhone: {
      type: SEQUELIZE_DATA_TYPE.STRING(50),
      allowNull: true,
    },
    shopifyUpdatedAt: {
      type: SEQUELIZE_DATA_TYPE.DATE,
      allowNull: true,
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

module.exports = Customer;
