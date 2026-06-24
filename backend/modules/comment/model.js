const { SEQUELIZE_DATA_TYPE } = require("../../config/constants");
const sequelize = require("../../config/db");

const Comment = sequelize.define(
  "comment",
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
    discountId: {
      type: SEQUELIZE_DATA_TYPE.INTEGER,
      allowNull: true,
      references: {
        model: "discounts",
        key: "id",
      },
    },
    orderId: {
      type: SEQUELIZE_DATA_TYPE.INTEGER,
      allowNull: true,
      references: {
        model: "orders",
        key: "id",
      },
    },
    authorName: {
      type: SEQUELIZE_DATA_TYPE.STRING(255),
      allowNull: true,
    },
    body: {
      type: SEQUELIZE_DATA_TYPE.TEXT,
      allowNull: false,
    },
  },
  {
    timestamps: true,
    indexes: [
      { fields: ["shopId", "customerId"] },
      { fields: ["shopId", "discountId"] },
      { fields: ["shopId", "orderId"] },
    ],
  }
);

module.exports = Comment;
