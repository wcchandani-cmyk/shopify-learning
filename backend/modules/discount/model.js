const { SEQUELIZE_DATA_TYPE } = require("../../config/constants");
const sequelize = require("../../config/db");

const Discount = sequelize.define(
  "discount",
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
      comment: "Shopify Global ID (GID) for the discount node",
    },
    title: {
      type: SEQUELIZE_DATA_TYPE.STRING(500),
      allowNull: true,
    },
    summary: {
      type: SEQUELIZE_DATA_TYPE.TEXT,
      allowNull: true,
    },
    status: {
      type: SEQUELIZE_DATA_TYPE.STRING(50),
      allowNull: true,
      comment: "active | scheduled | expired",
    },
    method: {
      type: SEQUELIZE_DATA_TYPE.STRING(50),
      allowNull: true,
      comment: "Automatic | Code",
    },
    eligibility: {
      type: SEQUELIZE_DATA_TYPE.STRING(100),
      allowNull: true,
      comment: "All customers | Specific customers | Specific customer segments",
    },
    type: {
      type: SEQUELIZE_DATA_TYPE.STRING(100),
      allowNull: true,
      comment: "Amount off product | Amount off order | Free shipping | Buy X get Y",
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
    usedCount: {
      type: SEQUELIZE_DATA_TYPE.INTEGER,
      allowNull: true,
      defaultValue: 0,
    },
    appliesTo: {
      type: SEQUELIZE_DATA_TYPE.STRING(50),
      allowNull: true,
      defaultValue: "all",
    },
    purchaseType: {
      type: SEQUELIZE_DATA_TYPE.STRING(50),
      allowNull: true,
      defaultValue: "one_time",
    },
    selectedItems: {
      type: SEQUELIZE_DATA_TYPE.TEXT,
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

module.exports = Discount;
