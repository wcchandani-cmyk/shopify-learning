const { SEQUELIZE_DATA_TYPE } = require("../../config/constants");
const sequelize = require("../../config/db");

const Shop = sequelize.define(
  "shop",
  {
    id: {
      type: SEQUELIZE_DATA_TYPE.INTEGER,
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
    },
    myshopifyDomain: {
      type: SEQUELIZE_DATA_TYPE.STRING,
      allowNull: false,
      unique: true,
    },
    domain: {
      type: SEQUELIZE_DATA_TYPE.STRING,
      allowNull: true,
    },
    token: {
      type: SEQUELIZE_DATA_TYPE.TEXT,
      allowNull: false,
    },
    name: {
      type: SEQUELIZE_DATA_TYPE.STRING,
      allowNull: true,
    },
    email: {
      type: SEQUELIZE_DATA_TYPE.STRING,
      allowNull: true,
    },
    province: {
      type: SEQUELIZE_DATA_TYPE.STRING(100),
      allowNull: true,
    },
    country: {
      type: SEQUELIZE_DATA_TYPE.STRING(100),
      allowNull: true,
    },
    city: {
      type: SEQUELIZE_DATA_TYPE.STRING(100),
      allowNull: true,
    },
    currency: {
      type: SEQUELIZE_DATA_TYPE.STRING(100),
      allowNull: true,
    },
    ianaTimezone: {
      type: SEQUELIZE_DATA_TYPE.STRING(150),
      allowNull: true,
    },
    timezone: {
      type: SEQUELIZE_DATA_TYPE.STRING(150),
      allowNull: true,
    },
    shopOwner: {
      type: SEQUELIZE_DATA_TYPE.STRING(150),
      allowNull: true,
    },
    moneyFormat: {
      type: SEQUELIZE_DATA_TYPE.STRING(150),
      allowNull: true,
    },
    moneyWithCurrencyFormat: {
      type: SEQUELIZE_DATA_TYPE.STRING(150),
      allowNull: true,
    },
    weightUnit: {
      type: SEQUELIZE_DATA_TYPE.STRING(10),
      allowNull: true,
    },
    planDisplayName: {
      type: SEQUELIZE_DATA_TYPE.STRING(150),
      allowNull: true,
    },
    planName: {
      type: SEQUELIZE_DATA_TYPE.STRING(150),
      allowNull: true,
    },
    chargeId: {
      type: SEQUELIZE_DATA_TYPE.BIGINT,
      allowNull: true,
    },
    recurringCharge: {
      type: SEQUELIZE_DATA_TYPE.ENUM("0", "1", "2"),
      allowNull: false,
      defaultValue: "0",
      comment: "0 = not active, 1 = active, 2 = cancelled",
    },
    planType: {
      type: SEQUELIZE_DATA_TYPE.ENUM("0", "1", "2", "3"),
      allowNull: false,
      defaultValue: "0",
      comment:
        "1 = Advance (old App Plan) 2 = Shopify Plus (New App Plan) 3 = Shopify Basic (New App Plan)",
    },
    planInterval: {
      type: SEQUELIZE_DATA_TYPE.ENUM("1", "2"),
      allowNull: false,
      defaultValue: "1",
      comment: "1 = month, 2 = year",
    },
    billingOn: {
      type: SEQUELIZE_DATA_TYPE.DATEONLY,
      allowNull: true,
    },
    activatedOn: {
      type: SEQUELIZE_DATA_TYPE.DATEONLY,
      allowNull: true,
    },
    cancelledOn: {
      type: SEQUELIZE_DATA_TYPE.DATEONLY,
      allowNull: true,
    },
    trialEndsOn: {
      type: SEQUELIZE_DATA_TYPE.DATEONLY,
      allowNull: true,
    },
    appInstall: {
      type: SEQUELIZE_DATA_TYPE.ENUM("0", "1"),
      allowNull: false,
      defaultValue: "1",
      comment: "0 = uninstall, 1 = install",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = Shop;
