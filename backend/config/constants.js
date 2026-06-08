require("dotenv").config();

const sequelize = require("sequelize");

module.exports = {
  DB_HOST: process.env.DB_HOST,
  DB_USER: process.env.DB_USER,
  DB_PASSWORD: process.env.DB_PASSWORD,
  DB_DATABASE: process.env.DB_DATABASE,
  DB_PORT: process.env.DB_PORT || 3306,

  PORT: process.env.PORT || 5000,
  BACKEND_URI: process.env.BACKEND_URI,

  SHOPIFY_API_KEY: process.env.SHOPIFY_API_KEY,
  SHOPIFY_API_SECRET_KEY: process.env.SHOPIFY_API_SECRET_KEY,
  SCOPES: process.env.SCOPES,
  SHOPIFY_APP_URI: process.env.SHOPIFY_APP_URI,
  WEBHOOK_URI: process.env.WEBHOOK_URI || process.env.BACKEND_URI,

  PROCESS_WEBHOOKS: process.env.PROCESS_WEBHOOKS !== "false",

  SEQUELIZE_DATA_TYPE: sequelize.DataTypes,

  FREE_TRIAL_DAYS: process.env.FREE_TRIAL_DAYS || 14,
};
