const { SEQUELIZE_DATA_TYPE } = require("../../config/constants");
const sequelize = require("../../config/db");

const MetafieldDefinition = sequelize.define(
  "metafield_definition",
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
    entityType: {
      type: SEQUELIZE_DATA_TYPE.STRING(50),
      allowNull: false,
    },
    namespace: {
      type: SEQUELIZE_DATA_TYPE.STRING(255),
      allowNull: false,
      defaultValue: "custom",
    },
    key: {
      type: SEQUELIZE_DATA_TYPE.STRING(255),
      allowNull: false,
    },
    name: {
      type: SEQUELIZE_DATA_TYPE.STRING(255),
      allowNull: false,
    },
    type: {
      type: SEQUELIZE_DATA_TYPE.STRING(50),
      allowNull: false,
    },
    description: {
      type: SEQUELIZE_DATA_TYPE.TEXT,
      allowNull: true,
    },
    storefrontApiAccess: {
      type: SEQUELIZE_DATA_TYPE.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    pinned: {
      type: SEQUELIZE_DATA_TYPE.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    validationRulesJson: {
      type: SEQUELIZE_DATA_TYPE.TEXT("long"),
      allowNull: true,
    },
    useAsCollectionFilter: {
      type: SEQUELIZE_DATA_TYPE.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    useAsAnalyticsFilter: {
      type: SEQUELIZE_DATA_TYPE.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    useAsSmartCollectionCondition: {
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
        fields: ["shopId", "entityType", "namespace", "key"],
      },
    ],
  }
);

const Metafield = sequelize.define(
  "metafield",
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
    definitionId: {
      type: SEQUELIZE_DATA_TYPE.INTEGER,
      allowNull: false,
      references: {
        model: "metafield_definitions",
        key: "id",
      },
      onDelete: "CASCADE",
    },
    entityId: {
      type: SEQUELIZE_DATA_TYPE.STRING(255),
      allowNull: false,
    },
    value: {
      type: SEQUELIZE_DATA_TYPE.TEXT("long"),
      allowNull: true,
    },
  },
  {
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ["shopId", "definitionId", "entityId"],
      },
    ],
  }
);

module.exports = {
  MetafieldDefinition,
  Metafield,
};
