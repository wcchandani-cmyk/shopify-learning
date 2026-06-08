const { SEQUELIZE_DATA_TYPE } = require("../../config/constants");
const sequelize = require("../../config/db");

const Product = sequelize.define(
  "product",
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
      comment: "Shopify REST product id",
    },
    title: {
      type: SEQUELIZE_DATA_TYPE.STRING(500),
      allowNull: true,
    },
    bodyHtml: {
      type: SEQUELIZE_DATA_TYPE.TEXT("long"),
      allowNull: true,
    },
    vendor: {
      type: SEQUELIZE_DATA_TYPE.STRING(255),
      allowNull: true,
    },
    productType: {
      type: SEQUELIZE_DATA_TYPE.STRING(255),
      allowNull: true,
      comment: "Product type / category label (e.g. Mens, Bags)",
    },
    categoryId: {
      type: SEQUELIZE_DATA_TYPE.STRING(255),
      allowNull: true,
      comment: "Shopify taxonomy category GID (gid://shopify/TaxonomyCategory/..)",
    },
    categoryName: {
      type: SEQUELIZE_DATA_TYPE.STRING(500),
      allowNull: true,
      comment: "Full taxonomy category breadcrumb, e.g. Apparel > Shirts",
    },
    handle: {
      type: SEQUELIZE_DATA_TYPE.STRING(255),
      allowNull: true,
    },
    templateSuffix: {
      type: SEQUELIZE_DATA_TYPE.STRING(100),
      allowNull: true,
    },
    publishedScope: {
      type: SEQUELIZE_DATA_TYPE.STRING(50),
      allowNull: true,
    },
    tags: {
      type: SEQUELIZE_DATA_TYPE.TEXT,
      allowNull: true,
    },
    status: {
      type: SEQUELIZE_DATA_TYPE.STRING(50),
      allowNull: true,
      comment: "active | draft | archived",
    },
    adminGraphqlApiId: {
      type: SEQUELIZE_DATA_TYPE.STRING(100),
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
    publishedAt: {
      type: SEQUELIZE_DATA_TYPE.DATE,
      allowNull: true,
    },
    imageUrl: {
      type: SEQUELIZE_DATA_TYPE.STRING(1024),
      allowNull: true,
      comment: "Featured product image URL from Shopify",
    },
    imageAlt: {
      type: SEQUELIZE_DATA_TYPE.STRING(500),
      allowNull: true,
    },
    optionsJson: {
      type: SEQUELIZE_DATA_TYPE.TEXT,
      allowNull: true,
      comment: "JSON array of { name, values } from Shopify product options",
    },
    imagesJson: {
      type: SEQUELIZE_DATA_TYPE.TEXT("long"),
      allowNull: true,
      comment: "JSON array of { src, alt } for all product images (gallery)",
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
      {
        fields: ["handle"],
      },
    ],
  },
);

module.exports = Product;
