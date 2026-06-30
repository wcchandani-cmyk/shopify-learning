const { SEQUELIZE_DATA_TYPE } = require("../../config/constants");
const sequelize = require("../../config/db");
const Shop = require("../shop/model");

const CheckoutCustomization = sequelize.define(
  "checkoutCustomization",
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
    type: {
      type: SEQUELIZE_DATA_TYPE.ENUM(
        "custom_field",
        "custom_content",
        "line_item_actions"
      ),
      allowNull: false,
      comment: "custom_field | custom_content | line_item_actions",
    },
    internalName: {
      type: SEQUELIZE_DATA_TYPE.STRING(255),
      allowNull: false,
    },
    blockVisibility: {
      type: SEQUELIZE_DATA_TYPE.STRING(50),
      allowNull: true,
      defaultValue: "Dynamic",
    },
    displayRule: {
      type: SEQUELIZE_DATA_TYPE.STRING(50),
      allowNull: false,
      defaultValue: "all",
    },
    displayConditions: {
      type: SEQUELIZE_DATA_TYPE.TEXT,
      allowNull: true,
    },
    orderFieldSetting: {
      type: SEQUELIZE_DATA_TYPE.STRING(50),
      allowNull: true,
      defaultValue: "order_metafield",
    },
    subheading: {
      type: SEQUELIZE_DATA_TYPE.STRING(500),
      allowNull: true,
    },
    fields: {
      type: SEQUELIZE_DATA_TYPE.TEXT,
      allowNull: true,
    },
    heading: {
      type: SEQUELIZE_DATA_TYPE.STRING(500),
      allowNull: true,
    },
    contents: {
      type: SEQUELIZE_DATA_TYPE.TEXT,
      allowNull: true,
    },
    showActionsExpanded: {
      type: SEQUELIZE_DATA_TYPE.BOOLEAN,
      allowNull: true,
      defaultValue: true,
    },
    subscriptionSelector: {
      type: SEQUELIZE_DATA_TYPE.BOOLEAN,
      allowNull: true,
      defaultValue: false,
    },
    variantSelector: {
      type: SEQUELIZE_DATA_TYPE.BOOLEAN,
      allowNull: true,
      defaultValue: true,
    },
    quantity: {
      type: SEQUELIZE_DATA_TYPE.BOOLEAN,
      allowNull: true,
      defaultValue: true,
    },
    removeButton: {
      type: SEQUELIZE_DATA_TYPE.BOOLEAN,
      allowNull: true,
      defaultValue: true,
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
      { fields: ["type"] },
      { fields: ["isActive"] },
    ],
  }
);

Shop.hasMany(CheckoutCustomization, {
  foreignKey: "shopId",
  as: "checkoutCustomizations",
});
CheckoutCustomization.belongsTo(Shop, { foreignKey: "shopId", as: "shop" });

module.exports = CheckoutCustomization;
