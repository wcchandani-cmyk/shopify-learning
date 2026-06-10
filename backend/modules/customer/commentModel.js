const { SEQUELIZE_DATA_TYPE } = require("../../config/constants");
const sequelize = require("../../config/db");

const CustomerComment = sequelize.define(
  "customer_comment",
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
      allowNull: false,
      references: {
        model: "customers",
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
    indexes: [{ fields: ["shopId", "customerId"] }],
  }
);

module.exports = CustomerComment;
