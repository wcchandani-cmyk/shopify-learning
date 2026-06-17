const { SEQUELIZE_DATA_TYPE } = require("../../config/constants");
const sequelize = require("../../config/db");

const CustomDiscount = sequelize.define(
  "customDiscount",
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
      type: SEQUELIZE_DATA_TYPE.STRING(255),
      allowNull: false,
      comment: "Shopify GID of the custom discount (Automatic or Code App Discount)",
    },
    functionType: {
      type: SEQUELIZE_DATA_TYPE.ENUM("1", "2", "3"),
      allowNull: false,
      defaultValue: "1",
      comment: "1 = Product Discount, 2 = Shipping Discount, 3 = Order Discount",
    },
    title: {
      type: SEQUELIZE_DATA_TYPE.STRING(500),
      allowNull: false,
    },
    method: {
      type: SEQUELIZE_DATA_TYPE.STRING(50),
      allowNull: false,
      comment: "Automatic | Code",
    },
    status: {
      type: SEQUELIZE_DATA_TYPE.STRING(50),
      allowNull: true,
      comment: "active | scheduled | expired",
    },
    startsAt: {
      type: SEQUELIZE_DATA_TYPE.DATE,
      allowNull: false,
    },
    endsAt: {
      type: SEQUELIZE_DATA_TYPE.DATE,
      allowNull: true,
    },
    combinesWithProduct: {
      type: SEQUELIZE_DATA_TYPE.BOOLEAN,
      allowNull: true,
      defaultValue: false,
    },
    combinesWithOrder: {
      type: SEQUELIZE_DATA_TYPE.BOOLEAN,
      allowNull: true,
      defaultValue: false,
    },
    combinesWithShipping: {
      type: SEQUELIZE_DATA_TYPE.BOOLEAN,
      allowNull: true,
      defaultValue: false,
    },
    configuration: {
      type: SEQUELIZE_DATA_TYPE.TEXT,
      allowNull: false,
      comment: "JSON string of rule conditions and discount configuration",
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

module.exports = CustomDiscount;
