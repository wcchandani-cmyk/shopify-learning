const { SEQUELIZE_DATA_TYPE } = require("../../config/constants");
const sequelize = require("../../config/db");
const Shop = require("../shop/model");

const CheckoutUpsell = sequelize.define(
  "checkoutUpsell",
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
      references: { model: Shop, key: "id" },
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    },
    metaobjectId: {
      type: SEQUELIZE_DATA_TYPE.STRING(255),
      allowNull: true,
    },
    discountId: {
      type: SEQUELIZE_DATA_TYPE.STRING(255),
      allowNull: true,
    },
    title: {
      type: SEQUELIZE_DATA_TYPE.STRING(255),
      allowNull: false,
    },
    triggerProductId: {
      type: SEQUELIZE_DATA_TYPE.STRING(255),
      allowNull: true,
    },
    triggerProductTitle: {
      type: SEQUELIZE_DATA_TYPE.STRING(255),
      allowNull: true,
    },
    triggerType: {
      type: SEQUELIZE_DATA_TYPE.STRING(50),
      allowNull: false,
      defaultValue: "products",
    },
    triggerProducts: {
      type: SEQUELIZE_DATA_TYPE.TEXT,
      allowNull: true,
    },
    triggerCollections: {
      type: SEQUELIZE_DATA_TYPE.TEXT,
      allowNull: true,
    },
    triggerProductIds: {
      type: SEQUELIZE_DATA_TYPE.TEXT,
      allowNull: true,
    },
    upsellProductId: {
      type: SEQUELIZE_DATA_TYPE.STRING(255),
      allowNull: false,
    },
    upsellProductTitle: {
      type: SEQUELIZE_DATA_TYPE.STRING(255),
      allowNull: true,
    },
    offerTitle: {
      type: SEQUELIZE_DATA_TYPE.STRING(255),
      allowNull: true,
    },
    discountPercentage: {
      type: SEQUELIZE_DATA_TYPE.INTEGER,
      allowNull: false,
      defaultValue: 10,
    },
    isActive: {
      type: SEQUELIZE_DATA_TYPE.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  },
  {
    timestamps: true,
    indexes: [
      { fields: ["shopId"] },
      { fields: ["metaobjectId"] },
      { fields: ["discountId"] },
      { fields: ["isActive"] },
    ],
  }
);

Shop.hasMany(CheckoutUpsell, { foreignKey: "shopId", as: "checkoutUpsells" });
CheckoutUpsell.belongsTo(Shop, { foreignKey: "shopId", as: "shop" });

module.exports = CheckoutUpsell;
